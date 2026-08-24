/**
 * Maps API DTOs onto the app's view types.
 *
 * The prototype ran on a frozen calendar (Thu 30 Jul) and derived slots from
 * `takenHours` baked into each machine. Against the real API, days are actual
 * dates and slots come from `/machines/{id}/slots`, so both are rebuilt here.
 */

import type {
  BookingDto,
  ExchangeDto,
  HostelDto,
  MachineDto,
  MeDto,
  MoveOptionDto,
  NotificationDto,
  SlotDto,
  TicketDto,
} from "@/lib/api";
import { initials, padHour, timeLabel } from "@/lib/format";
import { ADVANCE_WINDOW_DAYS } from "@/lib/rules";
import type {
  Booking,
  ExchangeRequest,
  ExchangeSlotSnapshot,
  Hostel,
  Machine,
  ManagedNotification,
  MoveOption,
  NotificationKind,
  Slot,
  SlotState,
  RuleBlock,
  SentExchangeDetail,
  StudentProfile,
  SwapDoneResult,
  Ticket,
  TicketStatus,
} from "@/lib/types";

const DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export type LiveDay = {
  dow: string;
  dd: string;
  fullLabel: string;
  /** `YYYY-MM-DD`, the form the slots endpoint takes. */
  date: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Institute wall clock. Matches Django `TIME_ZONE = Asia/Kolkata` (IST, no DST). */
export const PRODUCT_TZ = "Asia/Kolkata";
export const PRODUCT_OFFSET = "+05:30";

const WEEKDAYS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type IstParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: string;
};

function istParts(d: Date): IstParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PRODUCT_TZ,
    weekday: "short",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
    weekday: get("weekday"),
  };
}

function addCalendarDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + n));
  return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;
}

function weekdayIndex(short: string): number {
  const i = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(short);
  return i >= 0 ? i : 0;
}

export function isoDate(d: Date): string {
  const p = istParts(d);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function now(from?: Date): Date {
  return from ?? new Date();
}

/** Current hour 0–23 on the institute clock. */
export function istHour(from?: Date): number {
  return istParts(now(from)).hour;
}

export function istMinutesOfDay(from?: Date): number {
  const p = istParts(now(from));
  return p.hour * 60 + p.minute;
}

function hourFromInstant(iso: string): number {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  return istParts(d).hour;
}

/** Booking window starting today (IST), as wide as the institute allows. */
export function liveDays(count = ADVANCE_WINDOW_DAYS, from?: Date): LiveDay[] {
  const startKey = isoDate(now(from));
  const days: LiveDay[] = [];
  for (let i = 0; i < count; i += 1) {
    const date = addCalendarDays(startKey, i);
    const noonIst = new Date(`${date}T12:00:00${PRODUCT_OFFSET}`);
    const p = istParts(noonIst);
    const wd = weekdayIndex(p.weekday);
    days.push({
      dow: DOW[wd],
      dd: pad(p.day),
      fullLabel: `${WEEKDAYS_LONG[wd]} ${p.day} ${MONTH[p.month - 1]}`,
      date,
    });
  }
  return days;
}

/** The label a booking should carry, given its start instant. */
export function dayLabelFor(startsAt: string, days: LiveDay[]): string {
  const d = new Date(startsAt);
  const key = isoDate(d);
  if (days.length && key === days[0].date) return "Today";
  const match = days.find((x) => x.date === key);
  return match ? match.fullLabel : key;
}

export function mapHostel(dto: HostelDto): Hostel {
  return {
    id: dto.id,
    name: dto.name,
    isHome: dto.isHome,
  };
}

export function mapMachine(dto: MachineDto): Machine {
  return {
    id: dto.id,
    name: dto.name,
    kind: dto.kind,
    status: dto.isOffline ? "offline" : dto.status,
    hostelId: dto.hostelId,
    subtitle: dto.subtitle,
    // Slot detail now comes from the slots endpoint; these stay empty so any
    // leftover mock-era derivation yields nothing rather than wrong hours.
    takenHours: [],
    runningHour: -1,
    freeUntil: dto.freeUntil,
  };
}

export function holderName(holder: SlotDto["holder"]): string | null {
  if (!holder) return null;
  if (typeof holder === "string") return holder.trim() || null;
  return holder.name?.trim() || null;
}

const SLOT_STATES: SlotState[] = [
  "free",
  "taken",
  "mine",
  "blocked",
  "offline",
  "past",
  "running",
];

export function mapSlot(dto: SlotDto): Slot {
  const state = SLOT_STATES.includes(dto.state as SlotState)
    ? (dto.state as SlotState)
    : "blocked";
  return {
    hour: dto.hour,
    state,
    label: dto.label,
    bookingId: dto.bookingId,
    holder: holderName(dto.holder),
  };
}

/** Mark this student's hours on an API-derived grid. Does not invent occupancy. */
export function overlayMineHours(slots: Slot[], mineHours: number[]): Slot[] {
  if (!mineHours.length) return slots;
  const mine = new Set(mineHours);
  return slots.map((slot) =>
    mine.has(slot.hour) && slot.state !== "mine" && slot.state !== "running"
      ? { ...slot, state: "mine" as const, label: "Your booking" }
      : slot,
  );
}

/** Always 24 hourly slots, 00:00 through 23:00 (the last hour runs to 24:00). */
export function completeDaySlots(
  partial: Slot[],
  extras?: { mineHours?: number[]; takenHours?: number[] },
): Slot[] {
  const byHour = new Map<number, Slot>();
  for (const slot of partial) {
    if (slot.hour >= 0 && slot.hour < 24) byHour.set(slot.hour, slot);
  }
  const mine = new Set(extras?.mineHours ?? []);
  const taken = new Set(extras?.takenHours ?? []);
  return Array.from({ length: 24 }, (_, hour) => {
    const existing = byHour.get(hour);
    if (existing) {
      if (mine.has(hour) && existing.state !== "mine" && existing.state !== "running") {
        return { ...existing, state: "mine" as const, label: "Your booking" };
      }
      if (
        existing.state === "past" &&
        (existing.bookingId || existing.holder || taken.has(hour)) &&
        !existing.label
      ) {
        return { ...existing, label: existing.holder ?? "Reserved" };
      }
      return existing;
    }
    if (mine.has(hour)) return { hour, state: "mine" as const, label: "Your booking" };
    if (taken.has(hour)) return { hour, state: "taken" as const, label: "Reserved" };
    return { hour, state: "free" as const, label: "Available" };
  });
}

/** Hours that have already ended today (IST) read as past, matching the API. */
export function applyLiveClock(slots: Slot[], date: string, from?: Date): Slot[] {
  const clock = now(from);
  if (isoDate(clock) !== date) return slots;
  const current = istParts(clock).hour;
  return slots.map((slot) =>
    slot.hour < current && slot.state !== "past"
      ? { ...slot, state: "past" as const }
      : slot,
  );
}

/** Institute-local clock from an API instant, matching slot hours. */
export function istHourLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${padHour(istParts(d).hour)}:00`;
}

export function mapBooking(dto: BookingDto, days: LiveDay[]): Booking {
  return {
    id: dto.id,
    machineId: dto.machineId,
    machineName: dto.machineName,
    kind: dto.kind,
    dayLabel: dayLabelFor(dto.startsAt, days),
    hour: dto.hour ?? hourFromInstant(dto.startsAt),
    isLateCancel: dto.isLateCancel ?? false,
    hostelName: dto.hostelName ?? null,
  };
}

export function mapProfile(dto: MeDto): StudentProfile {
  return {
    name: dto.name,
    email: dto.email,
    phone: dto.phone ?? "",
    whatsappOptIn: dto.whatsappOptIn ?? false,
    // Null until the committee places the student in a hostel.
    hostelId: dto.hostelId ?? "",
    hostelName: dto.hostelName ?? "",
    floor: dto.floor ?? "",
    gender: dto.gender ?? "male",
    quota: {
      used: dto.quota.used,
      limit: dto.quota.limit,
      dryerUsed: dto.quota.dryerUsed ?? 0,
      resetLabel: dto.quota.resetsAt
        ? `resets ${shortDate(dto.quota.resetsAt)}`
        : "resets Monday",
    },
    strikes: (dto.strikes ?? []).map((s) => s.reason ?? "Strike"),
    suspensionEnds: dto.suspensionEnds,
    emailVerified: dto.emailVerified,
    suspended: dto.suspended,
    suspensionReason: dto.suspensionReason,
    cooldownClearsAt: dto.cooldownClearsAt,
  };
}

const TICKET_STATUS: Record<string, TicketStatus> = {
  open: "open",
  in_review: "open",
  resolved: "resolved",
};

export function mapTicket(dto: TicketDto): Ticket {
  const created = new Date(dto.createdAt);
  const rawNumber = dto.number ?? dto.reference;
  const number =
    rawNumber == null
      ? `#${dto.id.slice(0, 6).toUpperCase()}`
      : String(rawNumber).startsWith("#")
        ? String(rawNumber)
        : `#${rawNumber}`;
  const photo = (dto.photoUrl ?? "").trim();
  return {
    id: dto.id,
    number,
    title: dto.title ?? "Machine not working",
    note: dto.note,
    kind: "maintenance",
    status: TICKET_STATUS[dto.status] ?? "open",
    timeLabel: relativeLabel(created),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt ?? dto.resolvedAt ?? dto.createdAt,
    resolvedAt: dto.resolvedAt ?? null,
    machineId: dto.machineId,
    machineName: dto.machineName,
    photoUrl: photo || null,
    committeeNote: dto.committeeNote ?? null,
    statusDetail: dto.status === "in_review" ? "In review" : null,
  };
}

const NOTIF_KINDS: NotificationKind[] = ["info", "warn", "danger", "success"];

export function mapNotification(dto: NotificationDto): ManagedNotification {
  const kind = NOTIF_KINDS.includes(dto.kind) ? dto.kind : "info";
  return {
    notification: {
      id: dto.id,
      title: dto.title,
      body: dto.body,
      timeLabel: relativeLabel(new Date(dto.createdAt)),
      kind,
    },
    unread: !dto.read,
  };
}

export function mapMoveOption(dto: MoveOptionDto): MoveOption {
  return {
    machineId: dto.machineId,
    machineName: dto.machineName,
    hour: dto.hour,
    startsAt: dto.startsAt,
  };
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

function bookingHour(dto: BookingDto): number {
  return dto.hour ?? hourFromInstant(dto.startsAt);
}

function snapshotFromBooking(
  dto: BookingDto | null | undefined,
  days: LiveDay[],
): ExchangeSlotSnapshot | null {
  if (!dto) return null;
  return {
    hour: bookingHour(dto),
    dayLabel: dayLabelFor(dto.startsAt, days),
    location: dto.machineName,
    machineId: dto.machineId,
    kind: dto.kind,
  };
}

function shortSlot(dto: BookingDto, days: LiveDay[]): string {
  return `${dayLabelFor(dto.startsAt, days)} ${timeLabel(bookingHour(dto))}`;
}

/** Exchange has no expiresAt; the holder's slot start is the deadline. */
export function expiresLabelFromStartsAt(startsAt: string | null | undefined): string | null {
  if (!startsAt) return null;
  const d = new Date(startsAt);
  if (Number.isNaN(d.getTime())) return null;
  return `Expires at ${padHour(istParts(d).hour)}:00 · when the slot starts`;
}

export function mapIncomingExchange(dto: ExchangeDto, days: LiveDay[]): ExchangeRequest {
  const peer = dto.requester;
  const target = dto.targetBooking;
  const offered = dto.offeredBooking;
  const isSwap = dto.kind === "swap" && !!offered;
  const first = firstName(peer.name);
  const theyTake = target ? shortSlot(target, days) : "";
  const theyTakeSub = target?.machineName ?? "";
  const youGet = offered ? shortSlot(offered, days) : "Nothing";
  const youGetSub = offered ? offered.machineName : "Straight request";
  return {
    id: dto.id,
    initials: peer.initials || initials(peer.name),
    name: peer.name,
    title: isSwap ? `${peer.name} wants a swap` : `${peer.name} asked for a slot`,
    timeLabel: `Sent ${relativeLabel(new Date(dto.createdAt))}`,
    theyTake,
    theyTakeSub,
    youGet,
    youGetSub,
    approveLabel: isSwap ? "Approve swap" : `Give ${first} the slot`,
    kind: dto.kind,
    peerHostel: target?.hostelName ?? null,
    askedAgoLabel: `asked ${relativeLabel(new Date(dto.createdAt))}`,
    expiresLabel: expiresLabelFromStartsAt(target?.startsAt),
    screenTitle: isSwap ? "Swap request" : "Slot request",
    giveUp: snapshotFromBooking(target, days),
    getSlot: snapshotFromBooking(offered, days),
    ruleChecks: [],
    ruleChecksFooter: isSwap
      ? "If any of these changes before you decide, the swap fails and you're both told why."
      : null,
    peerNote: (dto.note || dto.rejectNote || "").trim() || null,
    irreversibleNotes: isSwap
      ? []
      : [`${first} becomes the holder immediately`, "This can't be undone once you hand it over"],
    approveConfirmTitle: isSwap ? `Swap with ${first}?` : `Give ${first} the slot?`,
    approveConfirmBody: isSwap
      ? "Both bookings change hands at once. Neither of you can reverse it afterwards — you'd have to agree a new swap."
      : `You're handing over ${theyTake} with nothing in return. Rejections are private; approvals are final.`,
    rejectTitle: isSwap ? `Reject ${first}'s swap` : `Reject ${first}'s ask`,
    rejectBody: isSwap
      ? `You keep ${theyTake}. A short reason helps, but you can skip it.`
      : "You keep the slot. A reason is optional.",
    rejectOptionIds: ["need_slot", "day_bad", "say_nothing"],
  };
}

export function mapOutgoingExchange(dto: ExchangeDto, days: LiveDay[]): SentExchangeDetail {
  const peer = dto.holder;
  const first = firstName(peer.name);
  const target = dto.targetBooking;
  const offered = dto.offeredBooking;
  const hour = target ? bookingHour(target) : 0;
  const pending = (dto.status || "pending").toLowerCase() === "pending";
  const rejected = (dto.status || "").toLowerCase() === "rejected";
  const rejectNote = (dto.rejectNote || dto.note || "").trim();
  return {
    id: dto.id,
    peerName: peer.name,
    peerInitials: peer.initials || initials(peer.name),
    waitingTitle: pending
      ? `Waiting on ${first}`
      : rejected
        ? `${first} declined`
        : `Update from ${first}`,
    waitingBody: pending
      ? `${first} can accept until the slot starts. Nothing is reserved for you in the meantime.`
      : rejected && rejectNote
        ? rejectNote
        : `${first} already responded.`,
    peerSlotSummary: target ? `${shortSlot(target, days)} · ${target.machineName}` : "",
    statusLabel: pending
      ? "Pending"
      : (dto.failureReason || "").toLowerCase().includes("withdrawn")
        ? "Withdrawn"
        : dto.status,
    kind: dto.kind,
    canWithdraw: pending,
    offered: snapshotFromBooking(offered, days),
    wanted: snapshotFromBooking(target, days),
    timeline: [
      {
        title: dto.kind === "swap" ? "You offered a swap" : "You asked for the slot",
        timeLabel: relativeLabel(new Date(dto.createdAt)),
        pending: false,
      },
      {
        title: `${first} was notified`,
        timeLabel: relativeLabel(new Date(dto.createdAt)),
        pending: false,
      },
      {
        title: "Their decision",
        timeLabel: target ? `Expires at ${timeLabel(hour)}` : "Expires when the slot starts",
        pending,
      },
    ],
    withdrawHint: `Withdrawing is silent — ${first} just stops seeing the request. Your booking is unaffected either way.`,
  };
}

export function swapDoneFromIncoming(request: ExchangeRequest): SwapDoneResult {
  const first = firstName(request.name);
  return {
    peerName: first,
    headline: "Slots swapped",
    subtitle: `${first} has been told. Your bookings are already updated.`,
    quotaNote: "Your weekly count didn't change — a swap isn't a new wash.",
    gained: request.getSlot ?? {
      hour: 0,
      dayLabel: "",
      location: request.youGetSub,
    },
    lost: request.giveUp ?? {
      hour: 0,
      dayLabel: "",
      location: request.theyTakeSub,
    },
  };
}

export function isPendingExchange(dto: ExchangeDto): boolean {
  return (dto.status || "pending").toLowerCase() === "pending";
}

export function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = istParts(d);
  const wd = weekdayIndex(p.weekday);
  return `${DOW[wd][0]}${DOW[wd].slice(1, 3).toLowerCase()} ${p.day} ${MONTH[p.month - 1].slice(0, 3)}`;
}

/** "3h ago" / "Yesterday" — the prototype's timeLabel voice. */
export function relativeLabel(when: Date, now = new Date()): string {
  const mins = Math.round((now.getTime() - when.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return shortDate(when.toISOString());
}

/** `startsAt` for a given IST calendar day + hour. Offset, not `Z`. */
export function startsAtFor(date: string, hour: number): string {
  return `${date}T${pad(hour)}:00:00${PRODUCT_OFFSET}`;
}

/** API refusal codes onto the screens' rule-block vocabulary. */
const BLOCK_RULES: Record<string, RuleBlock["rule"]> = {
  quota: "quota",
  cooldown: "cooldown",
  advance_window: "advance",
  outside_advance_window: "advance",
  past_slot: "advance",
  machine_offline: "offline",
  slot_taken: "offline",
  suspended: "suspended",
  unverified: "unverified",
};

const BLOCK_TITLES: Record<string, string> = {
  QUOTA: "You've used this week's washes",
  RULE_BLOCKED: "You can't book this yet",
  COOLDOWN: "You can't book this yet",
  SLOT_TAKEN: "Someone just took it",
  MACHINE_OFFLINE: "That machine is out of service",
  PAST_SLOT: "That hour has passed",
  OUTSIDE_ADVANCE_WINDOW: "Too far ahead",
  UNVERIFIED: "Confirm your email first",
  SUSPENDED: "Booking is paused",
  NOT_FOUND: "Machine not found",
};

export function blockFrom(failure: {
  code: string;
  detail: string;
  rule: string | null;
  clearsAt: string | null;
}): RuleBlock {
  const key = (failure.rule ?? failure.code ?? "").toLowerCase();
  return {
    rule: BLOCK_RULES[key] ?? "offline",
    title: BLOCK_TITLES[failure.code] ?? "You can't book this yet",
    body: failure.detail,
    clearsAt: failure.clearsAt ?? undefined,
  };
}
