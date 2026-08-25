export type MachineKind = "washer" | "dryer";
export type MachineStatus = "free" | "busy" | "offline";
export type SlotState =
  | "free"
  | "taken"
  | "mine"
  | "blocked"
  | "offline"
  | "past"
  | "running";
export type BookingKind = "washer" | "dryer";
export type ExchangeKind = "request" | "swap";
export type TicketKind = "maintenance";
export type TicketStatus = "open" | "resolved";
export type NotificationKind = "info" | "warn" | "danger" | "success";
export type Gender = "male" | "female";
export type DemoMode = "normal" | "suspended" | "offline";

/**
 * What a signed-out visitor was trying to do when they hit the sign-in wall.
 * The sign-in screen uses it for its subtitle, then sends them to `href` so
 * they land back on the slot they tapped rather than on Home.
 */
export type PendingIntent = {
  kind: "screen" | "confirm" | "exchange";
  href: string;
  machineName?: string;
  hour?: number;
};
export type ToastKind = "ok" | "warn" | "danger" | "neutral";

export type Hostel = {
  id: string;
  name: string;
  isHome: boolean;
};

export type Machine = {
  id: string;
  name: string;
  kind: MachineKind;
  status: MachineStatus;
  hostelId: string;
  subtitle: string;
  takenHours: number[];
  runningHour: number;
  /** ISO instant from the API when the machine next frees. */
  freeUntil?: string | null;
};

export type Slot = {
  hour: number;
  state: SlotState;
  label?: string;
  bookingId?: string | null;
  holder?: string | null;
};

export type Booking = {
  id: string;
  machineId: string;
  machineName: string;
  kind: BookingKind;
  dayLabel: string;
  hour: number;
  isLateCancel: boolean;
  hostelName: string | null;
};

export type Quota = {
  used: number;
  limit: number;
  dryerUsed: number;
  dryerLimit: number;
  resetLabel: string;
};

export type StudentProfile = {
  name: string;
  email: string;
  phone: string;
  whatsappOptIn: boolean;
  hostelId: string;
  hostelName: string;
  floor: string;
  gender: Gender;
  quota: Quota;
  strikes: string[];
  suspensionEnds: string | null;
  emailVerified: boolean;
  suspended: boolean;
  suspensionReason: string | null;
  cooldownClearsAt: string | null;
};

export type ExchangeSlotSnapshot = {
  hour: number;
  dayLabel: string;
  location: string;
  machineId?: string;
  kind?: BookingKind;
  rangeLabel?: string;
  footnote?: string;
};

export type ExchangeRuleCheck = {
  label: string;
  passed: boolean;
};

export type ExchangeTimelineEvent = {
  title: string;
  timeLabel: string;
  pending: boolean;
};

export type ExchangeRejectOption = {
  id: string;
  label: string;
  allowsCustomNote: boolean;
};

export type ExchangeRequest = {
  id: string;
  initials: string;
  name: string;
  title: string;
  timeLabel: string;
  theyTake: string;
  theyTakeSub: string;
  youGet: string;
  youGetSub: string;
  approveLabel: string;
  kind: ExchangeKind;
  peerHostel: string | null;
  askedAgoLabel: string | null;
  expiresLabel: string | null;
  screenTitle: string | null;
  giveUp: ExchangeSlotSnapshot | null;
  getSlot: ExchangeSlotSnapshot | null;
  ruleChecks: ExchangeRuleCheck[];
  ruleChecksFooter: string | null;
  peerNote: string | null;
  irreversibleNotes: string[];
  approveConfirmTitle: string | null;
  approveConfirmBody: string | null;
  rejectTitle: string | null;
  rejectBody: string | null;
  rejectOptionIds: string[];
};

export type SentExchangeDetail = {
  id: string;
  peerName: string;
  peerInitials: string;
  waitingTitle: string;
  waitingBody: string;
  peerSlotSummary: string;
  statusLabel: string;
  kind: ExchangeKind;
  canWithdraw: boolean;
  offered: ExchangeSlotSnapshot | null;
  wanted: ExchangeSlotSnapshot | null;
  timeline: ExchangeTimelineEvent[];
  withdrawHint: string;
};

export type SwapDoneResult = {
  peerName: string;
  headline: string;
  subtitle: string;
  quotaNote: string;
  gained: ExchangeSlotSnapshot;
  lost: ExchangeSlotSnapshot;
};

export type ExchangeFailedResult = {
  kind: ExchangeKind;
  peerName: string;
  headline: string;
  body: string;
};

export type Ticket = {
  id: string;
  number: string;
  title: string;
  note: string;
  kind: TicketKind;
  status: TicketStatus;
  timeLabel: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  machineId: string | null;
  machineName: string | null;
  photoUrl: string | null;
  committeeNote: string | null;
  statusDetail: string | null;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  timeLabel: string;
  kind: NotificationKind;
};

export type ManagedNotification = {
  notification: AppNotification;
  unread: boolean;
};

export type MoveOption = {
  machineId: string;
  machineName: string;
  hour: number;
  startsAt?: string;
};

export type RuleBlock = {
  rule: "quota" | "cooldown" | "advance" | "suspended" | "unverified" | "offline";
  title: string;
  body: string;
  clearsAt?: string;
};

export type ToastMessage = {
  id: number;
  message: string;
  kind: ToastKind;
};
