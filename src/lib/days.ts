import { liveDays } from "@/lib/live";
import { ADVANCE_WINDOW_DAYS } from "@/lib/rules";

export type MockDay = {
  dow: string;
  dd: string;
  fullLabel: string;
};

const WINDOW = ADVANCE_WINDOW_DAYS;

/** Day strip / confirm labels from the live IST calendar (same as `liveDays`). */
export function bookingDays(): ReturnType<typeof liveDays> {
  return liveDays(WINDOW);
}

export function bookingDayLabel(dayIdx: number): string {
  if (dayIdx <= 0) return "Today";
  const days = bookingDays();
  const i = Math.max(0, Math.min(dayIdx, days.length - 1));
  return days[i].fullLabel;
}

export function clampDayIdx(raw: string | null | undefined): number {
  const n = Number.parseInt(raw ?? "0", 10);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(n, WINDOW - 1));
}

/** Seed fixture labels from the old prototype calendar. */
export function normalizeDayLabel(label: string): string {
  switch (label) {
    case "Sat 8 Aug":
    case "Sat 08 Aug":
    case "Sat":
      return "Saturday 1 August";
    case "Fri":
    case "Fri 31 Jul":
    case "Friday 31 Jul":
      return "Friday 31 July";
    default:
      return label;
  }
}
