// Cohort config and prices. Cohort IDs, date labels, sheet tabs and open flags are
// reconstructed; check them against lib/events/origins in the Next.js project.
// Prices match the checkout page (₦800,000 / ₦700,000 and $600 / $500).

export const ORIGINS_COHORT_IDS = ["sep-2026", "mar-2027"] as const;
export type OriginsCohortId = (typeof ORIGINS_COHORT_IDS)[number];
export type OriginsAttendanceType = "in-person" | "virtual";

export const ORIGINS_ATTENDANCE_LABELS: Record<OriginsAttendanceType, string> = {
  "in-person": "In-person",
  virtual: "Online",
};

export const ORIGINS_COHORTS: Record<
  OriginsCohortId,
  { sheetTab: string; dateRangeLabel: string; registrationOpen: boolean; inPersonOpen: boolean }
> = {
  "sep-2026": {
    sheetTab: "Origins Sep 2026",
    dateRangeLabel: "September 2026",
    registrationOpen: false,
    inPersonOpen: false,
  },
  "mar-2027": {
    sheetTab: "Origins Mar 2027",
    dateRangeLabel: "March 19–20, 2027",
    registrationOpen: true,
    inPersonOpen: true,
  },
};

const PRICES = {
  "in-person": { NGN: 800_000, USD: 600 },
  virtual: { NGN: 700_000, USD: 500 },
} as const;

export function getOriginsPrice(type: OriginsAttendanceType, currency: "USD" | "NGN"): number {
  return PRICES[type][currency];
}

// Bundle: two tickets, 10% off each ticket. The page's combined 10% is the same
// as applying 10% to each ticket, so each request carries its own discount.
export const BUNDLE_DISCOUNT = 0.1;

// ---- Form options. These must match the <option> lists in checkout/index.html.
export const GENDER_OPTIONS = ["Male", "Female", "Prefer not to say"] as const;
export const OCCUPATION_OPTIONS = ["Employed", "Self-employed", "Entrepreneur", "Student", "Other"] as const;
export const EMPLOYMENT_LEVEL_OPTIONS = [
  "Founder / Co-founder",
  "Executive / C-suite",
  "Manager",
  "Associate",
  "Other",
] as const;
export const SOURCE_OPTIONS = [
  "Instagram",
  "LinkedIn",
  "X (Twitter)",
  "Facebook",
  "WhatsApp",
  "Friend or colleague",
  "A past participant",
  "Leke Alder's website or newsletter",
  "Sonderplace",
  "Other",
] as const;
