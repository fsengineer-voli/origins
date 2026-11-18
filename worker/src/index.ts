/**
 * Cloudflare Worker: Origins registration endpoint.
 *
 * The registration form is the source of truth. This Worker accepts only the
 * fields the form asks for. Anything else in the request is ignored, and the
 * same field set is used for:
 *  - validation (required fields and allowed option values)
 *  - the Google Sheet row (Origins tab)
 *  - the attendee email and the internal copy
 *
 * Secrets / vars (set with `wrangler secret put` or in wrangler.toml [vars]):
 *  GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, RESEND_API_KEY, INFO_EMAIL, MAIL_FROM
 */

import { ALDER_GTBANK_NAIRA_ACCOUNT, ALDER_USD_ACCOUNT, ALDER_ZELLE_EMAIL } from "./static-data";
import { originsRegistrationEmail, type DonationBankAccount } from "./email-templates";
import {
  BUNDLE_DISCOUNT,
  EMPLOYMENT_LEVEL_OPTIONS,
  GENDER_OPTIONS,
  getOriginsPrice,
  OCCUPATION_OPTIONS,
  ORIGINS_ATTENDANCE_LABELS,
  ORIGINS_COHORT_IDS,
  ORIGINS_COHORTS,
  SOURCE_OPTIONS,
  type OriginsAttendanceType,
  type OriginsCohortId,
} from "./origins";
import { sendNotificationEmail } from "./mail";
import { getSheetsAccessToken, ensureOriginsTabExists, appendRow, quoteTab } from "./sheets";

export interface Env {
  GOOGLE_CLIENT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  RESEND_API_KEY: string;
  INFO_EMAIL: string;
  MAIL_FROM: string;
  ALLOWED_ORIGIN?: string;
}

type Currency = "USD" | "NGN";

/** The sheet columns, in order. One entry per form field plus the generated values. */
const ORIGINS_SHEET_COLUMNS = [
  "Submitted At",
  "Reference",
  "Name",
  "Email",
  "Phone",
  "Gender",
  "Occupation",
  "Employment Level",
  "Company",
  "Role",
  "City",
  "Country",
  "Attendance Type",
  "Ticket",
  "Currency",
  "Total",
  "How Heard",
  "Payment Status",
] as const;

/** Only these fields are read from the request. Anything else is discarded. */
interface Registration {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  gender: string;
  occupation: string;
  employmentLevel: string;
  company: string;
  role: string;
  city: string;
  country: string;
  attendanceType: OriginsAttendanceType;
  currency: Currency;
  source: string;
  bundle: boolean;
  cohortId: OriginsCohortId;
}

// ---------- helpers ----------------------------------------------------------

const corsHeaders = (origin: string) => ({
  "access-control-allow-origin": origin,
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
});

const json = (body: unknown, status = 200, origin = "*") =>
  // 204 responses must not carry a body, or the Response constructor throws.
  status === 204
    ? new Response(null, { status, headers: corsHeaders(origin) })
    : new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json", ...corsHeaders(origin) },
      });

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Reads only the form fields, checks them, and returns a clean Registration. */
function parseForm(body: any): { ok: true; data: Registration } | { ok: false; message: string } {
  const issues: string[] = [];

  const firstName = str(body?.firstName);
  const lastName = str(body?.lastName);
  const email = str(body?.email);
  const phone = str(body?.phone, 30);
  const gender = str(body?.gender);
  const occupation = str(body?.occupation);
  const employmentLevel = str(body?.employmentLevel);
  const city = str(body?.city);
  const country = str(body?.country);
  const source = str(body?.source);

  if (!firstName) issues.push("First name is required");
  if (!lastName) issues.push("Last name is required");
  if (!EMAIL_RE.test(email)) issues.push("A valid email is required");
  if (phone.replace(/\D/g, "").length < 6) issues.push("Phone number is required");
  if (!(GENDER_OPTIONS as readonly string[]).includes(gender)) issues.push("Gender is required");
  if (!(OCCUPATION_OPTIONS as readonly string[]).includes(occupation)) issues.push("Occupation is required");
  if (occupation === "Employed" && !(EMPLOYMENT_LEVEL_OPTIONS as readonly string[]).includes(employmentLevel)) {
    issues.push("Employment level is required");
  }
  if (!city) issues.push("City is required");
  if (!country) issues.push("Country is required");
  if (!(SOURCE_OPTIONS as readonly string[]).includes(source)) issues.push("How did you hear about us is required");

  const attendanceType = body?.attendanceType;
  if (attendanceType !== "in-person" && attendanceType !== "virtual") issues.push("Invalid attendance type");

  const currency = body?.currency;
  if (currency !== "USD" && currency !== "NGN") issues.push("Invalid currency");

  const cohortRaw = body?.cohortId;
  if (!(ORIGINS_COHORT_IDS as readonly string[]).includes(cohortRaw)) issues.push("Invalid cohort");

  if (issues.length) return { ok: false, message: issues.join(", ") };

  return {
    ok: true,
    data: {
      firstName,
      lastName,
      email,
      phone,
      phoneCountryCode: str(body?.phoneCountryCode, 8),
      gender,
      occupation,
      employmentLevel: occupation === "Employed" ? employmentLevel : "",
      company: str(body?.company),
      role: str(body?.role),
      city,
      country,
      attendanceType,
      currency,
      source,
      bundle: body?.bundle === true,
      cohortId: cohortRaw,
    },
  };
}

const formatUSD = (v: number) =>
  `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatNGN = (v: number) =>
  `₦${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const toBankAccount = (
  label: string,
  account: typeof ALDER_USD_ACCOUNT | typeof ALDER_GTBANK_NAIRA_ACCOUNT,
): DonationBankAccount => ({
  label,
  accountName: account.accountName,
  accountNumber: account.accountNumber,
  bankName: account.bankName.trim(),
  routingNumber: "routingNumber" in account ? (account as any).routingNumber : undefined,
  currency: account.currency,
});

function buildBankDetails(currency: Currency, paymentReference: string) {
  if (currency === "NGN") {
    return {
      paymentReference,
      accounts: [toBankAccount("GTBank (Naira)", ALDER_GTBANK_NAIRA_ACCOUNT)],
    };
  }
  return {
    paymentReference,
    accounts: [
      toBankAccount("US ACH", ALDER_USD_ACCOUNT),
      {
        label: "Zelle",
        accountName: ALDER_USD_ACCOUNT.accountName,
        bankName: "Zelle",
        email: ALDER_ZELLE_EMAIL,
        currency: "USD",
      } as DonationBankAccount,
    ],
  };
}

// ---------- handler ----------------------------------------------------------

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const origin = env.ALLOWED_ORIGIN ?? "*";

    if (request.method === "OPTIONS") return json({}, 204, origin);
    if (request.method !== "POST") return json({ success: false, message: "Method not allowed." }, 405, origin);

    let body: any;
    try {
      body = await request.json();
    } catch {
      return json({ success: false, message: "Invalid payload." }, 400, origin);
    }

    const parsed = parseForm(body);
    if (!parsed.ok) return json({ success: false, message: parsed.message }, 400, origin);
    const r = parsed.data;

    const cohort = ORIGINS_COHORTS[r.cohortId];
    if (!cohort.registrationOpen) {
      return json({ success: false, message: "Registration for Origins is closed." }, 403, origin);
    }
    if (!cohort.inPersonOpen && r.attendanceType === "in-person") {
      return json({ success: false, message: "In-person registration is closed." }, 403, origin);
    }

    // Amounts
    const formatAmount = r.currency === "NGN" ? formatNGN : formatUSD;
    const listPrice = getOriginsPrice(r.attendanceType as OriginsAttendanceType, r.currency);
    const discount = r.bundle ? Math.round(listPrice * BUNDLE_DISCOUNT) : 0;
    const totalAmount = listPrice - discount;
    const totalLabel = formatAmount(totalAmount);

    const reference = `ORIGINS-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    const basketLines = [
      {
        label: `Your ticket – ${ORIGINS_ATTENDANCE_LABELS[r.attendanceType]}`,
        amountLabel: formatAmount(listPrice),
      },
      ...(r.bundle
        ? [{
            label: `2-in-1 Bundle discount (${BUNDLE_DISCOUNT * 100}%)`,
            amountLabel: `−${formatAmount(discount)}`,
          }]
        : []),
    ];

    // Form fields shown in the email. Only fields the form asked for.
    const details = [
      { label: "Email", value: r.email },
      { label: "Phone", value: r.phoneCountryCode ? `${r.phoneCountryCode} ${r.phone}` : r.phone },
      { label: "Gender", value: r.gender },
      { label: "Occupation", value: r.occupation },
      ...(r.employmentLevel ? [{ label: "Employment level", value: r.employmentLevel }] : []),
      ...(r.company ? [{ label: "Company", value: r.company }] : []),
      ...(r.role ? [{ label: "Role", value: r.role }] : []),
      { label: "City", value: r.city },
      { label: "Country", value: r.country },
      { label: "How you heard about us", value: r.source },
    ];

    const submittedAt = new Date().toISOString();
    const ticketLabel = r.bundle ? "2-in-1 Bundle" : "Individual";

    // 1. Save the row. A failure is logged and does not block the response.
    try {
      const token = await getSheetsAccessToken(env.GOOGLE_CLIENT_EMAIL, env.GOOGLE_PRIVATE_KEY);
      await ensureOriginsTabExists(token, cohort.sheetTab, ORIGINS_SHEET_COLUMNS);
      await appendRow(token, `${quoteTab(cohort.sheetTab)}!A:R`, [
        submittedAt,
        reference,
        `${r.firstName} ${r.lastName}`,
        r.email,
        r.phoneCountryCode ? `${r.phoneCountryCode} ${r.phone}` : r.phone,
        r.gender,
        r.occupation,
        r.employmentLevel,
        r.company,
        r.role,
        r.city,
        r.country,
        ORIGINS_ATTENDANCE_LABELS[r.attendanceType],
        ticketLabel,
        r.currency,
        totalLabel,
        r.source,
        "Awaiting Bank Transfer",
      ]);
    } catch (err) {
      console.error("Error saving Origins registration to Google Sheet:", err);
    }

    const bankDetails = buildBankDetails(r.currency, reference);
    const dateLabel = cohort.dateRangeLabel;

    // 2. Emails are sent after the response, so a slow or failed send never
    //    turns a saved registration into an error.
    ctx.waitUntil(
      (async () => {
        try {
          const attendeeEmail = originsRegistrationEmail({
            firstName: r.firstName,
            lastName: r.lastName,
            attendanceTypeLabel: ORIGINS_ATTENDANCE_LABELS[r.attendanceType],
            basketLines,
            totalLabel,
            currency: r.currency,
            reference,
            dateLabel,
            bankDetails,
            details,
          });

          await Promise.all([
            sendNotificationEmail(env, {
              subject: attendeeEmail.subject,
              html: attendeeEmail.html,
              to: r.email,
              replyTo: env.INFO_EMAIL,
            }),
            sendNotificationEmail(env, {
              subject: `New Origins (${dateLabel}) registration — ${r.firstName} ${r.lastName} (${totalLabel})`,
              html: attendeeEmail.html,
              to: env.INFO_EMAIL,
            }),
          ]);
        } catch (err) {
          console.error("Error sending Origins registration email:", err, { reference });
        }
      })(),
    );

    return json(
      { success: true, reference, currency: r.currency, totalAmount, totalLabel, bankDetails },
      200,
      origin,
    );
  },
};
