export interface DonationBankAccount {
  label: string;
  accountName: string;
  accountNumber?: string;
  bankName: string;
  routingNumber?: string;
  swiftCode?: string;
  businessAddress?: string;
  bankAddress?: string;
  accountType?: string;
  email?: string;
  currency: string;
}

export interface DonationBankDetails {
  paymentReference: string;
  accounts: DonationBankAccount[];
}

export interface OriginsRegistrationEmailData {
  firstName: string;
  lastName: string;
  attendanceTypeLabel: string;
  basketLines: { label: string; amountLabel: string }[];
  totalLabel: string;
  currency: string;
  reference: string;
  dateLabel: string;
  bankDetails: DonationBankDetails;
  /** Form fields the registrant submitted, shown in the email. */
  details?: { label: string; value: string }[];
}
export interface AdminNotificationEmailData {
  firstName: string;
  lastName: string;
  attendanceTypeLabel: string;
  basketLines: { label: string; amountLabel: string }[];
  totalLabel: string;
  currency: string;
  reference: string;
}

// Brand accent (matches the checkout page): red #C8161D, text #A31117, tint #FBEDEC.
const BRAND_RED = "#C8161D";
const BRAND_RED_INK = "#A31117";
const BRAND_RED_TINT = "#FBEDEC";
const BRAND_RED_BORDER = "#F3B7B5";
const BRAND_MUTED = "#5E5A56";

const ORIGINS_LOGO_URL = "https://sonderplace.com/images/origins-logo.jpeg";
const DONATION_FONT_BASE_URL = "https://sonderplace.com/fonts";
const DONATION_FONT_STACK = "'Poppins',Helvetica,Arial,sans-serif";
const DONATION_SUPPORT_EMAIL = "info@sonderplace.com";
const OPERATIONS_EMAIL = "operations@sonderplace.com";

const donationFontFaceStyle = `
  <style>
    @font-face {
      font-family: 'Poppins';
      font-weight: 400;
      font-style: normal;
      font-display: swap;
      src: url(${DONATION_FONT_BASE_URL}/poppins-400.woff2) format('woff2');
    }
    @font-face {
      font-family: 'Poppins';
      font-weight: 600;
      font-style: normal;
      font-display: swap;
      src: url(${DONATION_FONT_BASE_URL}/poppins-600.woff2) format('woff2');
    }
    @font-face {
      font-family: 'Poppins';
      font-weight: 700;
      font-style: normal;
      font-display: swap;
      src: url(${DONATION_FONT_BASE_URL}/poppins-700.woff2) format('woff2');
    }
  </style>`;

const row = (label: string, value: string) => `
  <tr>
    <td style="padding:8px 16px;color:#6b7280;font-size:13px;width:40%;">${label}</td>
    <td style="padding:8px 16px;color:#111827;font-size:13px;">${value}</td>
  </tr>`;

function renderBankDetailsSection(bankDetails?: DonationBankDetails) {
  if (!bankDetails || bankDetails.accounts.length === 0) return "";

  const accountRow = (label: string, value?: string) =>
    value
      ? `<tr><td style="padding:4px 0;color:#4b5563;">${label}</td><td style="padding:4px 0;text-align:right;">${value}</td></tr>`
      : "";

  const accountsHtml = bankDetails.accounts
    .map(
      (account) => `
        <div style="margin:0 0 16px;padding:16px;border:1px solid #e5e7eb;border-radius:6px;">
          <p style="margin:0 0 10px;font-family:${DONATION_FONT_STACK};font-size:13px;font-weight:700;color:#111827;">${
            account.label
          }</p>
          <table style="width:100%;border-collapse:collapse;font-family:${DONATION_FONT_STACK};font-size:13px;">
            ${accountRow("Account Name", account.accountName)}
            ${accountRow("Account Number", account.accountNumber)}
            ${accountRow("Bank", account.bankName)}
            ${accountRow("Routing Number", account.routingNumber)}
            ${accountRow("SWIFT Code", account.swiftCode)}
            ${accountRow("Email", account.email)}
            ${accountRow("Currency", account.currency)}
          </table>
        </div>`,
    )
    .join("");

  return `
        ${accountsHtml}
        <div style="margin:0 0 16px;padding:14px 16px;background:${BRAND_RED_TINT};border:1px solid ${BRAND_RED_BORDER};border-radius:6px;">
          <p style="margin:0 0 4px;font-family:${DONATION_FONT_STACK};font-size:12.5px;font-weight:700;color:${BRAND_RED_INK};">Payment reference</p>
          <p style="margin:0 0 8px;font-family:${DONATION_FONT_STACK};font-size:12.5px;color:${BRAND_MUTED};">Include this as your payment reference or narration:</p>
          <p style="margin:0;padding:8px 10px;background:#ffffff;border-radius:4px;font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:13px;font-weight:700;color:${BRAND_RED_INK};">${bankDetails.paymentReference}</p>
           <p style="margin:0;font-family:${DONATION_FONT_STACK};font-size:12.5px;font-weight:700;color:${BRAND_RED_INK};">
            Please send proof of payment to <a href="mailto:${OPERATIONS_EMAIL}" style="color:${BRAND_RED_INK};text-decoration:underline;">${OPERATIONS_EMAIL}</a>.
          </p>
        </div>
        `;
}

export function adminEmail(data: AdminNotificationEmailData) {
  const {
    firstName,
    lastName,
    attendanceTypeLabel,
    totalLabel,
    currency,
    reference,
  } = data;

  return {
    subject: `Complete your Origins registration — payment instructions inside`,
    html: `
  ${donationFontFaceStyle}
  <div style="margin:0;padding:32px 16px;background:#f9fafb;font-family:${DONATION_FONT_STACK};">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
      <div style="padding:30px 40px 24px;border-bottom:1px solid #e5e7eb;text-align:center;">
        <img src="${ORIGINS_LOGO_URL}" alt="Origins: Business Creativity Workshop" width="180" height="66" style="height:66px;width:180px;display:inline-block;border:0;" />
        <p style="margin:10px 0 0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#9ca3af;font-family:${DONATION_FONT_STACK};font-weight:600;">
          Origins: Business Creativity Workshop by Leke Alder
        </p>
      </div>

      <div style="padding:32px 40px 30px;">
        <h1 style="text-align:center;font-family:${DONATION_FONT_STACK};font-weight:700;font-size:22px;line-height:1.35;margin:0 0 5px;color:#111827;">
          New registration: ${firstName} ${lastName}
        </h1>

        <div style="text-align:center;padding:22px 0 26px;">
          <p style="font-family:${DONATION_FONT_STACK};font-size:40px;font-weight:700;color:#111827;margin:0;">
            ${totalLabel}
          </p>
          <p style="font-family:${DONATION_FONT_STACK};font-size:12.5px;color:#9ca3af;margin-top:4px;">
            ${currency} &middot; ${attendanceTypeLabel}
          </p>
        </div>

        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;font-family:${DONATION_FONT_STACK};font-size:13.5px;margin-bottom:16px;">
          <tr>
            <td style="padding:11px 16px;border-bottom:1px solid #e5e7eb;color:#4b5563;font-weight:600;">Name</td>
            <td style="padding:11px 16px;border-bottom:1px solid #e5e7eb;text-align:right;">${firstName} ${lastName}</td>
          </tr>
          <tr>
            <td style="padding:11px 16px;color:#4b5563;font-weight:600;">Reference No.</td>
            <td style="padding:11px 16px;text-align:right;font-family:'SFMono-Regular',Menlo,Consolas,monospace;">${reference}</td>
          </tr>
          <tr>
            <td style="padding:11px 16px;color:#4b5563;font-weight:600;">Attendace Type</td>
            <td style="padding:11px 16px;text-align:right;font-family:'SFMono-Regular',Menlo,Consolas,monospace;">${attendanceTypeLabel}</td>
          </tr>
        </table>
      </div>
    </div>
  </div>
  `,
  };
}
export function originsRegistrationEmail(data: OriginsRegistrationEmailData) {
  const {
    firstName,
    lastName,
    attendanceTypeLabel,
    basketLines,
    totalLabel,
    currency,
    reference,
    dateLabel,
    bankDetails,
    details = [],
  } = data;

  // Form fields only. Values are escaped because they come from the form.
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const detailsHtml = details.length
    ? `<p style="font-family:${DONATION_FONT_STACK};font-size:13px;font-weight:700;color:#111827;margin:0 0 8px;">Your details</p>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:4px;font-family:${DONATION_FONT_STACK};margin-bottom:16px;">
          ${details.map((d) => row(esc(d.label), esc(d.value))).join("")}
        </table>`
    : "";

  const basketRowsHtml = basketLines
    .map(
      (line) => `
          <tr>
            <td style="padding:11px 16px;border-bottom:1px solid #e5e7eb;color:#4b5563;">${line.label}</td>
            <td style="padding:11px 16px;border-bottom:1px solid #e5e7eb;text-align:right;">${line.amountLabel}</td>
          </tr>`,
    )
    .join("");

  return {
    subject: `Complete your Origins registration — payment instructions inside`,
    html: `
  ${donationFontFaceStyle}
  <div style="margin:0;padding:32px 16px;background:#f9fafb;font-family:${DONATION_FONT_STACK};">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
      <div style="padding:30px 40px 24px;border-bottom:1px solid #e5e7eb;text-align:center;">
        <img src="${ORIGINS_LOGO_URL}" alt="Origins: Business Creativity Workshop" width="180" height="66" style="height:66px;width:180px;display:inline-block;border:0;" />
        <p style="margin:10px 0 0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#9ca3af;font-family:${DONATION_FONT_STACK};font-weight:600;">
          Origins: Business Creativity Workshop by Leke Alder — Registration
        </p>
      </div>

      <div style="padding:32px 40px 8px;">
        <span style="display:inline-block;background:#f3f4f6;color:#374151;font-family:${DONATION_FONT_STACK};font-size:12px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;padding:5px 10px;border-radius:100px;margin-bottom:20px;">
          Registration received
        </span>

        <h1 style="font-family:${DONATION_FONT_STACK};font-weight:700;font-size:22px;line-height:1.35;margin:0 0 14px;color:#111827;">
          We've received your registration, ${firstName}.
        </h1>
        <p style="font-family:${DONATION_FONT_STACK};font-size:14.5px;line-height:1.65;color:#4b5563;margin:0 0 16px;">
          ${dateLabel} &middot; hosted by Leke Alder. To secure your spot, complete your transfer using the bank details below.
        </p>

        <div style="text-align:center;padding:22px 0 26px;">
          <p style="font-family:${DONATION_FONT_STACK};font-size:40px;font-weight:700;color:#111827;margin:0;">
            ${totalLabel}
          </p>
          <p style="font-family:${DONATION_FONT_STACK};font-size:12.5px;color:#9ca3af;margin-top:4px;">
            ${currency} &middot; ${attendanceTypeLabel}
          </p>
        </div>

        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;font-family:${DONATION_FONT_STACK};font-size:13.5px;margin-bottom:16px;">
          <tr>
            <td style="padding:11px 16px;border-bottom:1px solid #e5e7eb;color:#4b5563;font-weight:600;">Attendee</td>
            <td style="padding:11px 16px;border-bottom:1px solid #e5e7eb;text-align:right;">${firstName} ${lastName}</td>
          </tr>
          <tr>
            <td style="padding:11px 16px;color:#4b5563;font-weight:600;">Reference no.</td>
            <td style="padding:11px 16px;text-align:right;font-family:'SFMono-Regular',Menlo,Consolas,monospace;">${reference}</td>
          </tr>
          <tr>
            <td style="padding:11px 16px;border-bottom:1px solid #e5e7eb;color:#4b5563;font-weight:600;">Payment Details</td>
          </tr>
                  ${basketRowsHtml}
          <tr>
            <td style="padding:11px 16px;color:#111827;font-weight:700;">Total</td>
            <td style="padding:11px 16px;text-align:right;color:#111827;font-weight:700;">${totalLabel}</td>
          </tr>
        </table>

        ${renderBankDetailsSection(bankDetails)}


        ${
          currency === "USD"
            ? `<p style="font-family:${DONATION_FONT_STACK};font-size:12.5px;line-height:1.6;color:#6b7280;margin:0 0 8px;">
          Outside Nigeria and the US? Use a money transfer or currency conversion service to send to the US ACH details above, or convert to Naira and pay via GTBank.
        </p>`
            : ""
        }
      </div>

      <div style="padding:22px 40px 30px;border-top:1px solid #e5e7eb;font-family:${DONATION_FONT_STACK};font-size:12px;line-height:1.7;color:#9ca3af;text-align:center;">
        Questions about this registration? Reply to this email or write to<br />
        <a href="mailto:${DONATION_SUPPORT_EMAIL}" style="color:${BRAND_RED};text-decoration:none;font-weight:600;">${DONATION_SUPPORT_EMAIL}</a>
      </div>
    </div>
  </div>
  `,
  };
}
