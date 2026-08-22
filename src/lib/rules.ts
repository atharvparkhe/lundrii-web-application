import type { BookingKind, DemoMode, RuleBlock } from "./types";

export const QUOTA_LIMIT = 3;
export const ADVANCE_WINDOW_DAYS = 7;
export const LATE_CANCEL_CUTOFF_HOURS = 6;

export function demoBlock(mode: DemoMode): RuleBlock | null {
  if (mode === "unverified") {
    return {
      rule: "unverified",
      title: "Email not confirmed yet",
      body: "Confirm your email before booking.",
    };
  }
  if (mode === "suspended") {
    return {
      rule: "suspended",
      title: "Booking is paused until 6 Aug",
      body: "Applied by the committee after ticket #427. You can still browse.",
    };
  }
  if (mode === "offline") {
    return {
      rule: "offline",
      title: "You're offline",
      body: "You need a connection to book.",
    };
  }
  return null;
}

export function checkBookingRules(opts: {
  kind: BookingKind;
  hour: number;
  dayIdx: number;
  quotaUsed: number;
  quotaLimit: number;
}): RuleBlock | null {
  const { kind, dayIdx, quotaUsed, quotaLimit } = opts;
  if (dayIdx >= ADVANCE_WINDOW_DAYS) {
    return {
      rule: "advance",
      title: "Outside the advance window",
      body: `Your institute lets you book ${ADVANCE_WINDOW_DAYS} days ahead. Pick a nearer day.`,
    };
  }
  if (kind === "washer" && quotaUsed >= quotaLimit) {
    return {
      rule: "quota",
      title: "Weekly quota used",
      body: `You've used ${quotaUsed} of ${quotaLimit} washes this week (Monday–Sunday). Quota resets next Monday.`,
    };
  }
  return null;
}
