export function padHour(hour: number): string {
  return hour.toString().padStart(2, "0");
}

export function timeLabel(hour: number): string {
  return `${padHour(hour)}:00`;
}

export function timeRange(hour: number): string {
  const end = hour === 23 ? "24:00" : `${padHour(hour + 1)}:00`;
  return `${padHour(hour)}:00 – ${end}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "A";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function kindLabel(kind: "washer" | "dryer"): string {
  return kind === "dryer" ? "Dryer" : "Washer";
}

/** "3rd Floor · A Wing" → "3rd Floor" */
export function machineFloor(location: string): string {
  const name = location.trim();
  const sep = name.indexOf(" · ");
  return sep === -1 ? name : name.slice(0, sep);
}

export function uniqueFloors(locations: string[]): string[] {
  const seen = new Set<string>();
  const floors: string[] = [];
  for (const location of locations) {
    const floor = machineFloor(location);
    if (floor && !seen.has(floor)) {
      seen.add(floor);
      floors.push(floor);
    }
  }
  return floors;
}

/** Prototype clock is :41 past nowHour (09:41 → 13:00 = 3h 19m). */
export const MOCK_NOW_MINUTE = 41;

export function startsInLabel(
  booking: { dayLabel: string; hour: number },
  nowHour: number,
): string {
  if (booking.dayLabel !== "Today") return booking.dayLabel;
  const totalMins = booking.hour * 60 - (nowHour * 60 + MOCK_NOW_MINUTE);
  if (totalMins <= 0) return "Starting now";
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h <= 0) return `Starts in ${m}m`;
  if (m === 0) return `Starts in ${h}h`;
  return `Starts in ${h}h ${m}m`;
}

export function slotStateLabel(state: string): string {
  switch (state) {
    case "free":
      return "Available";
    case "mine":
      return "Your booking";
    case "taken":
      return "Reserved";
    case "running":
      return "Running now";
    case "blocked":
      return "Cooldown";
    case "offline":
      return "Machine offline";
    case "past":
      return "Past";
    default:
      return state;
  }
}
