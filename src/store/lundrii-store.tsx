"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import seedJson from "@/data/mock/seed.json";
import {
  ApiError,
  api,
  clearTokens,
  getAccess,
  getRefresh,
  setTokens,
  setUnauthorizedHandler,
  type MeDto,
} from "@/lib/api";
import {
  isPendingExchange,
  liveDays,
  mapBooking,
  mapHostel,
  mapIncomingExchange,
  mapMachine,
  mapMoveOption,
  mapNotification,
  mapOutgoingExchange,
  mapProfile,
  mapSlot,
  mapTicket,
  applyLiveClock,
  overlayMineHours,
  blockFrom,
  startsAtFor,
  swapDoneFromIncoming,
  type LiveDay,
} from "@/lib/live";
import { bookingDayLabel, normalizeDayLabel } from "@/lib/days";
import { timeLabel } from "@/lib/format";
import {
  checkBookingRules,
  demoBlock,
} from "@/lib/rules";
import type {
  Booking,
  BookingKind,
  DemoMode,
  ExchangeKind,
  ExchangeRequest,
  Hostel,
  Machine,
  ManagedNotification,
  MoveOption,
  PendingIntent,
  RuleBlock,
  SentExchangeDetail,
  Slot,
  StudentProfile,
  SwapDoneResult,
  Ticket,
  ToastKind,
  ToastMessage,
  AppNotification,
} from "@/lib/types";

const seed = seedJson as typeof seedJson;

function clone<T>(value: T): T {
  return structuredClone(value);
}

/**
 * The seed fixture predates the API and numbers its ids. Entity ids are UUID
 * strings now, so the demo/signed-out data is revived with string ids rather
 * than rewriting the fixture.
 */
function seeded<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value), (key, val) =>
    key === "id" && typeof val === "number" ? String(val) : val,
  ) as T;
}

function normalizeBooking(b: Booking): Booking {
  return { ...b, dayLabel: normalizeDayLabel(b.dayLabel) };
}

type AuthDraft = {
  name: string;
  email: string;
  phone: string;
  hostel: string;
  whatsappOptIn: boolean;
};

type State = {
  hydrated: boolean;
  signedIn: boolean;
  pending: PendingIntent | null;
  auth: AuthDraft;
  demoMode: DemoMode;
  selectedHostelId: string;
  selectedFloor: string;
  profile: StudentProfile;
  hostels: Hostel[];
  machines: Machine[];
  upcoming: Booking[];
  past: Booking[];
  exchanges: ExchangeRequest[];
  sentSeed: SentExchangeDetail[];
  extraSent: SentExchangeDetail[];
  withdrawnSentIds: string[];
  tickets: Ticket[];
  notifications: ManagedNotification[];
  quotaUsed: number;
  quotaLimit: number;
  nextId: number;
  toast: ToastMessage | null;
  lastSwapDone: SwapDoneResult | null;
  lastRaisedTicket: Ticket | null;
  /** True once the signed-in student API has answered. */
  live: boolean;
  loading: boolean;
  /** Book/confirm schedule fetch failed — show empty/error, never seed machines. */
  scheduleError: string | null;
  /** Booking window from the live IST calendar. */
  days: LiveDay[];
  /** Slots keyed `machineId:YYYY-MM-DD`; filled by loadSlots. */
  slotCache: Record<string, Slot[]>;
};

const AUTH_KEY = "lundrii.signedIn";
const SELECTED_HOSTEL_KEY = "lundrii.selectedHostelId";

function loadSelectedHostelId(): string {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(SELECTED_HOSTEL_KEY) ?? "";
}

function persistSelectedHostelId(hostelId: string) {
  if (typeof window === "undefined") return;
  if (hostelId) window.sessionStorage.setItem(SELECTED_HOSTEL_KEY, hostelId);
  else window.sessionStorage.removeItem(SELECTED_HOSTEL_KEY);
}

type CatalogOpts = {
  hostelId?: string;
  homeHostelId?: string | null;
  gender?: "male" | "female" | null;
  /** Placed students: same-gender hostels from /me/hostels. */
  eligible?: Hostel[];
};

type Catalog = {
  hostels: Hostel[];
  machines: Machine[];
  activeHostel: string;
  scheduleError: string | null;
};

async function fetchMachines(hostelId: string): Promise<{
  machines: Machine[];
  scheduleError: string | null;
}> {
  try {
    return {
      machines: (await api.hostels.machines(hostelId)).map(mapMachine),
      scheduleError: null,
    };
  } catch {
    return { machines: [], scheduleError: "Couldn't load the schedule." };
  }
}

/** One Book catalog for guests and signed-in students. */
async function fetchCatalog(opts: CatalogOpts = {}): Promise<Catalog> {
  let hostels = opts.eligible?.length ? opts.eligible : [];
  if (!hostels.length) {
    const signup = await api.auth.signupOptions();
    hostels = (signup.hostels ?? []).map((h) => ({
      id: h.id,
      name: h.name,
      gender: h.gender === "female" ? "female" : "male",
      isHome: Boolean(opts.homeHostelId && h.id === opts.homeHostelId),
    }));
    const gender = opts.gender;
    if (gender === "male" || gender === "female") {
      const filtered = hostels.filter((h) => h.gender === gender);
      if (filtered.length) hostels = filtered;
    }
  } else if (opts.homeHostelId) {
    hostels = hostels.map((h) => ({
      ...h,
      isHome: h.id === opts.homeHostelId,
    }));
  }

  const requested = opts.hostelId ?? "";
  const homeId = opts.homeHostelId ?? "";
  const activeHostel =
    (requested && hostels.some((h) => h.id === requested) ? requested : "") ||
    (homeId && hostels.some((h) => h.id === homeId) ? homeId : "") ||
    hostels[0]?.id ||
    "";
  if (!activeHostel) {
    return { hostels, machines: [], activeHostel: "", scheduleError: null };
  }
  const { machines, scheduleError } = await fetchMachines(activeHostel);
  return { hostels, machines, activeHostel, scheduleError };
}

function loadSignedIn(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(AUTH_KEY) === "1";
}

function withProfileDefaults(profile: typeof seed.profile): StudentProfile {
  return {
    ...profile,
    whatsappOptIn: false,
    gender: profile.gender === "female" ? "female" : "male",
    emailVerified: true,
    suspended: false,
    suspensionReason: null,
    cooldownClearsAt: null,
  };
}

function initialState(): State {
  const profile = withProfileDefaults(clone(seed.profile));
  return {
    hydrated: false,
    signedIn: false,
    pending: null,
    // Auth forms start empty — the seed profile is demo data, not a draft.
    auth: {
      name: "",
      email: "",
      phone: "",
      hostel: "",
      whatsappOptIn: false,
    },
    demoMode: "normal",
    selectedHostelId: "",
    selectedFloor: profile.floor ?? "3rd Floor",
    profile,
    hostels: [],
    machines: [],
    upcoming: seeded<Booking[]>(seed.bookings.upcoming).map(normalizeBooking),
    past: seeded<Booking[]>(seed.bookings.past),
    exchanges: seeded<ExchangeRequest[]>(seed.exchanges),
    sentSeed: seeded<SentExchangeDetail[]>(seed.sentExchanges),
    extraSent: [],
    withdrawnSentIds: [],
    tickets: seeded<Ticket[]>(seed.tickets),
    notifications: seeded<AppNotification[]>(seed.notifications).map((n) => ({
      notification: n,
      unread: true,
    })),
    quotaUsed: seed.profile.quota.used,
    quotaLimit: seed.meta.quotaLimit,
    nextId: 2000,
    toast: null,
    lastSwapDone: clone(seed.swapDone) as SwapDoneResult,
    lastRaisedTicket: null,
    live: false,
    loading: false,
    scheduleError: null,
    days: liveDays(),
    slotCache: {},
  };
}

function guestSeedPatch(): Partial<State> {
  const fresh = initialState();
  return {
    live: false,
    loading: false,
    scheduleError: null,
    profile: fresh.profile,
    hostels: [],
    machines: [],
    upcoming: fresh.upcoming,
    past: fresh.past,
    exchanges: fresh.exchanges,
    sentSeed: fresh.sentSeed,
    extraSent: [],
    withdrawnSentIds: [],
    tickets: fresh.tickets,
    notifications: fresh.notifications,
    quotaUsed: fresh.quotaUsed,
    quotaLimit: fresh.quotaLimit,
    selectedHostelId: fresh.selectedHostelId,
    selectedFloor: fresh.selectedFloor,
    days: liveDays(),
    slotCache: {},
    demoMode: "normal",
    lastRaisedTicket: null,
  };
}

type Action =
  | { type: "toast"; message: string; kind: ToastKind }
  | { type: "clearToast" }
  | { type: "setSignedIn"; value: boolean }
  | { type: "setPending"; pending: PendingIntent | null }
  | { type: "setAuth"; patch: Partial<AuthDraft> }
  | { type: "setDemoMode"; mode: DemoMode }
  | { type: "setHostel"; hostelId: string }
  | { type: "setFloor"; floor: string }
  | { type: "setState"; patch: Partial<State> }
  | { type: "slots"; key: string; slots: Slot[] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "toast":
      return {
        ...state,
        toast: { id: Date.now(), message: action.message, kind: action.kind },
      };
    case "clearToast":
      return { ...state, toast: null };
    case "setSignedIn":
      return { ...state, signedIn: action.value };
    case "setPending":
      return { ...state, pending: action.pending };
    case "setAuth":
      return { ...state, auth: { ...state.auth, ...action.patch } };
    case "setDemoMode":
      return { ...state, demoMode: action.mode };
    case "setHostel": {
      persistSelectedHostelId(action.hostelId);
      return {
        ...state,
        selectedHostelId: action.hostelId,
      };
    }
    case "setFloor":
      return { ...state, selectedFloor: action.floor };
    case "setState":
      return { ...state, ...action.patch };
    case "slots":
      return {
        ...state,
        slotCache: { ...state.slotCache, [action.key]: action.slots },
      };
    default:
      return state;
  }
}

export type LundriiStore = {
  hydrated: boolean;
  signedIn: boolean;
  pending: PendingIntent | null;
  auth: AuthDraft;
  demoMode: DemoMode;
  selectedHostelId: string;
  selectedFloor: string;
  selectedHostelName: string;
  profile: StudentProfile;
  hostels: Hostel[];
  machines: Machine[];
  upcoming: Booking[];
  past: Booking[];
  exchanges: ExchangeRequest[];
  sentExchanges: SentExchangeDetail[];
  tickets: Ticket[];
  notifications: ManagedNotification[];
  quotaUsed: number;
  quotaLimit: number;
  quotaLeft: number;
  toast: ToastMessage | null;
  lastSwapDone: SwapDoneResult | null;
  lastRaisedTicket: Ticket | null;
  rejectPresets: typeof seed.rejectPresets;
  ticketCompose: typeof seed.ticketCompose;
  meta: typeof seed.meta;
  /** True once the signed-in student API has answered. */
  live: boolean;
  loading: boolean;
  scheduleError: string | null;
  days: LiveDay[];
  refresh: (hostelId?: string) => Promise<void>;
  applyMe: (me: MeDto) => void;
  loadSlots: (machineId: string, dayIdx: number) => Promise<void>;
  rememberDraft: (patch: Partial<AuthDraft>) => void;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  signInWithOtp: (
    email: string,
    otp: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  signUp: (input: {
    name: string;
    email: string;
    password: string;
    phone: string;
    hostelId: string;
    floor: string;
    whatsappOptIn?: boolean;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => void;
  setPending: (pending: PendingIntent | null) => void;
  setDemoMode: (mode: DemoMode) => void;
  setHostel: (hostelId: string) => void;
  setFloor: (floor: string) => void;
  showToast: (message: string, kind?: ToastKind) => void;
  clearToast: () => void;
  getHostels: () => Hostel[];
  getMachines: (hostelId?: string) => Machine[];
  getSlots: (machineId: string, dayIdx: number) => Slot[];
  hasLoadedSlots: (machineId: string, dayIdx: number) => boolean;
  getProfile: () => StudentProfile;
  getBookings: () => { upcoming: Booking[]; past: Booking[] };
  ensureBooking: (id: string) => Promise<Booking | null>;
  machineById: (id: string) => Machine | undefined;
  guardAction: () => RuleBlock | null;
  createBooking: (input: {
    machineId: string;
    hour: number;
    dayIdx: number;
    addDryer?: boolean;
  }) => Promise<{ ok: true; booking: Booking } | { ok: false; block: RuleBlock }>;
  cancelBooking: (id: string) => Promise<void>;
  moveBooking: (bookingId: string, option: MoveOption) => Promise<boolean>;
  moveOptionsFor: (booking: Booking) => Promise<MoveOption[]>;
  getExchanges: () => ExchangeRequest[];
  exchangeById: (id: string) => ExchangeRequest | undefined;
  sentById: (id: string) => SentExchangeDetail | undefined;
  approveExchange: (
    id: string,
  ) => Promise<{ ok: true } | { ok: false; reason: string }>;
  rejectExchange: (id: string, optionId?: string, note?: string) => Promise<void>;
  withdrawSent: (id: string) => Promise<void>;
  sendExchange: (input: {
    machineId: string;
    hour: number;
    isSwap: boolean;
    offerId?: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  getTickets: () => Ticket[];
  ticketById: (id: string) => Ticket | undefined;
  ensureTicket: (id: string) => Promise<Ticket | null>;
  raiseTicket: (input: {
    note: string;
    machineId?: string;
    photo?: File | null;
    photoName?: string | null;
  }) => Promise<Ticket>;
  getNotifications: () => ManagedNotification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
};

const Ctx = createContext<LundriiStore | null>(null);

function emptyLiveLists(): Partial<State> {
  return {
    upcoming: [],
    past: [],
    exchanges: [],
    sentSeed: [],
    extraSent: [],
    withdrawnSentIds: [],
    tickets: [],
    notifications: [],
    machines: [],
    hostels: [],
    lastRaisedTicket: null,
    quotaUsed: 0,
    quotaLimit: 0,
    selectedHostelId: "",
    selectedFloor: "",
    profile: {
      name: "",
      email: "",
      phone: "",
      hostelId: "",
      hostelName: "",
      floor: "",
      gender: "male",
      quota: { used: 0, limit: 0, resetLabel: "" },
      strikes: [],
      suspensionEnds: null,
      emailVerified: true,
      suspended: false,
      suspensionReason: null,
      cooldownClearsAt: null,
    },
  };
}

export function LundriiProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const selectedHostelIdRef = useRef(state.selectedHostelId);

  useEffect(() => {
    selectedHostelIdRef.current = state.selectedHostelId;
  }, [state.selectedHostelId]);

  const persistSignedIn = useCallback((value: boolean) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(AUTH_KEY, value ? "1" : "0");
    }
    dispatch({ type: "setSignedIn", value });
  }, []);

  const showToast = useCallback((message: string, kind: ToastKind = "ok") => {
    dispatch({ type: "toast", message, kind });
  }, []);

  /**
   * One reload for Book. Always fills the hostel/machine catalog; signed-in
   * students also get profile, bookings, tickets, and exchanges in the same pass.
   */
  const refresh = useCallback(async (hostelId?: string) => {
    const signedIn = !!getAccess();
    dispatch({
      type: "setState",
      patch: {
        loading: true,
        scheduleError: null,
        ...(signedIn ? { live: true } : {}),
      },
    });
    try {
      const days = liveDays();
      if (!signedIn) {
        const catalog = await fetchCatalog({
          hostelId: hostelId ?? (loadSelectedHostelId() || undefined),
        });
        if (catalog.activeHostel) persistSelectedHostelId(catalog.activeHostel);
        dispatch({
          type: "setState",
          patch: {
            loading: false,
            live: false,
            days,
            hostels: catalog.hostels,
            machines: catalog.machines,
            selectedHostelId: catalog.activeHostel,
            slotCache: {},
            scheduleError: catalog.scheduleError,
          },
        });
        return;
      }

      const [me, eligible] = await Promise.all([
        api.me.get(),
        api.me.hostels().catch(() => []),
      ]);
      const remembered =
        hostelId ??
        (selectedHostelIdRef.current || loadSelectedHostelId() || "");
      const [catalog, upcomingDtos, pastDtos, ticketDtos, notifDtos, exchangeDtos] =
        await Promise.all([
          fetchCatalog({
            hostelId: remembered || me.hostelId || undefined,
            homeHostelId: me.hostelId,
            gender: me.gender,
            eligible: eligible.map(mapHostel),
          }),
          api.bookings.list("upcoming").catch(() => []),
          api.bookings.list("past").catch(() => []),
          api.tickets.list().catch(() => []),
          api.notifications.list().catch(() => []),
          api.exchanges.list().catch(() => []),
        ]);
      if (catalog.activeHostel) persistSelectedHostelId(catalog.activeHostel);
      const pending = exchangeDtos.filter(isPendingExchange);
      const incoming = pending.filter((e) => e.direction === "incoming");
      const outgoing = pending.filter((e) => e.direction === "outgoing");
      dispatch({
        type: "setState",
        patch: {
          live: true,
          loading: false,
          scheduleError: catalog.scheduleError,
          days,
          profile: mapProfile(me),
          selectedHostelId: catalog.activeHostel,
          ...(hostelId && me.hostelId && hostelId !== me.hostelId
            ? {}
            : { selectedFloor: me.floor ?? "" }),
          hostels: catalog.hostels,
          machines: catalog.machines,
          upcoming: upcomingDtos.map((b) => mapBooking(b, days)),
          past: pastDtos.map((b) => mapBooking(b, days)),
          tickets: ticketDtos.map(mapTicket),
          notifications: notifDtos.map(mapNotification),
          exchanges: incoming.map((e) => mapIncomingExchange(e, days)),
          extraSent: outgoing.map((e) => mapOutgoingExchange(e, days)),
          sentSeed: [],
          withdrawnSentIds: [],
          quotaUsed: me.quota.used,
          quotaLimit: me.quota.limit,
          slotCache: {},
        },
      });
    } catch (err) {
      dispatch({ type: "setState", patch: { loading: false } });
      if (err instanceof ApiError && err.status === 401) {
        clearTokens();
        persistSignedIn(false);
        dispatch({ type: "setState", patch: guestSeedPatch() });
        const catalog = await fetchCatalog({
          hostelId: loadSelectedHostelId() || undefined,
        });
        dispatch({
          type: "setState",
          patch: {
            loading: false,
            live: false,
            hostels: catalog.hostels,
            machines: catalog.machines,
            selectedHostelId: catalog.activeHostel,
            slotCache: {},
            scheduleError: catalog.scheduleError,
            days: liveDays(),
          },
        });
        return;
      }
      dispatch({
        type: "setState",
        patch: {
          machines: [],
          slotCache: {},
          scheduleError: "Couldn't load the schedule.",
        },
      });
    }
  }, [persistSignedIn]);

  const applyMe = useCallback((me: MeDto) => {
    dispatch({
      type: "setState",
      patch: {
        profile: mapProfile(me),
        selectedFloor: me.floor ?? "",
      },
    });
  }, []);

  useEffect(() => {
    const hasToken = !!getAccess();
    dispatch({
      type: "setState",
      patch: {
        hydrated: true,
        signedIn: hasToken || loadSignedIn(),
        days: liveDays(),
        ...(hasToken ? { live: true, ...emptyLiveLists() } : {}),
      },
    });
    void refresh();
  }, [refresh]);

  // Any unrecoverable 401 ends the session immediately, wherever it happened.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      persistSignedIn(false);
      dispatch({ type: "setState", patch: guestSeedPatch() });
      dispatch({ type: "toast", message: "Your session expired. Sign in again.", kind: "danger" });
      void refresh();
    });
    return () => setUnauthorizedHandler(null);
  }, [persistSignedIn, refresh]);

  /** Slots are per machine per day, so they load on demand and cache. */
  const loadSlots = useCallback(
    async (machineId: string, dayIdx: number) => {
      const days = liveDays();
      const day = days[Math.max(0, Math.min(dayIdx, days.length - 1))];
      const key = `${machineId}:${day.date}`;
      try {
        const dto = await api.machines.slots(machineId, day.date);
        dispatch({
          type: "slots",
          key,
          slots: dto.slots.map(mapSlot),
        });
        dispatch({ type: "setState", patch: { scheduleError: null } });
      } catch {
        dispatch({ type: "slots", key, slots: [] });
        dispatch({
          type: "setState",
          patch: { scheduleError: "Couldn't load today's slots." },
        });
      }
    },
    [],
  );

  const selectedHostelName =
    state.hostels.find((h) => h.id === state.selectedHostelId)?.name ??
    state.profile.hostelName;

  const sentExchanges = useMemo(() => {
    const withdrawn = new Set(state.withdrawnSentIds);
    return [...state.extraSent, ...state.sentSeed].filter(
      (s) => !withdrawn.has(s.id),
    );
  }, [state.extraSent, state.sentSeed, state.withdrawnSentIds]);

  const machineById = useCallback(
    (id: string) => state.machines.find((m) => m.id === id),
    [state.machines],
  );

  const getSlots = useCallback(
    (machineId: string, dayIdx: number): Slot[] => {
      const machine = state.machines.find((m) => m.id === machineId);
      if (!machine) return [];
      const dayLabel = bookingDayLabel(dayIdx);
      const mineHours = state.upcoming
        .filter((b) => b.machineId === machineId && b.dayLabel === dayLabel)
        .map((b) => b.hour);
      const days = liveDays();
      const day = days[Math.max(0, Math.min(dayIdx, days.length - 1))];
      const cached = state.slotCache[`${machineId}:${day.date}`];
      if (!cached?.length) return [];
      return applyLiveClock(overlayMineHours(cached, mineHours), day.date);
    },
    [state.machines, state.upcoming, state.slotCache],
  );

  const hasLoadedSlots = useCallback(
    (machineId: string, dayIdx: number) => {
      const days = liveDays();
      const day = days[Math.max(0, Math.min(dayIdx, days.length - 1))];
      return Object.prototype.hasOwnProperty.call(
        state.slotCache,
        `${machineId}:${day.date}`,
      );
    },
    [state.slotCache],
  );

  const guardAction = useCallback((): RuleBlock | null => {
    const demo = demoBlock(state.demoMode);
    if (demo && !state.live) return demo;
    if (state.live || getAccess()) {
      if (!state.profile.emailVerified) {
        return {
          rule: "unverified",
          title: "Confirm your email first",
          body: "Tap the link we emailed you to start booking.",
        };
      }
      if (state.profile.suspended) {
        return {
          rule: "suspended",
          title: "Booking is paused",
          body: state.profile.suspensionReason ?? "The hostel committee paused booking on this account.",
          clearsAt: state.profile.suspensionEnds ?? undefined,
        };
      }
    }
    return demo;
  }, [state.demoMode, state.live, state.profile]);

  const store: LundriiStore = {
    hydrated: state.hydrated,
    signedIn: state.signedIn,
    auth: state.auth,
    demoMode: state.demoMode,
    selectedHostelId: state.selectedHostelId,
    selectedFloor: state.selectedFloor,
    selectedHostelName,
    profile: state.profile,
    hostels: state.hostels,
    machines: state.machines,
    upcoming: state.upcoming,
    past: state.past,
    exchanges: state.exchanges,
    sentExchanges,
    tickets: state.tickets,
    notifications: state.notifications,
    quotaUsed: state.quotaUsed,
    quotaLimit: state.quotaLimit,
    quotaLeft: Math.max(0, state.quotaLimit - state.quotaUsed),
    toast: state.toast,
    lastSwapDone: state.lastSwapDone,
    lastRaisedTicket: state.lastRaisedTicket,
    rejectPresets: seed.rejectPresets,
    ticketCompose: seed.ticketCompose,
    meta: seed.meta,
    pending: state.pending,
    live: state.live,
    loading: state.loading,
    scheduleError: state.scheduleError,
    days: state.days,
    refresh,
    applyMe,
    loadSlots,
    rememberDraft: (patch) => dispatch({ type: "setAuth", patch }),
    signIn: async (email, password) => {
      try {
        const res = await api.auth.login(email, password);
        setTokens(res.access, res.refresh);
        dispatch({ type: "setAuth", patch: { email } });
        dispatch({ type: "setDemoMode", mode: "normal" });
        dispatch({ type: "setPending", pending: null });
        dispatch({ type: "setState", patch: { live: true, ...emptyLiveLists() } });
        persistSignedIn(true);
        persistSelectedHostelId("");
        await refresh();
        return { ok: true };
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Couldn't sign in. Try again.";
        return { ok: false, error: message };
      }
    },
    signInWithOtp: async (email, otp) => {
      try {
        const res = await api.auth.verifyLoginOtp(email, otp);
        setTokens(res.access, res.refresh);
        dispatch({ type: "setAuth", patch: { email } });
        dispatch({ type: "setDemoMode", mode: "normal" });
        dispatch({ type: "setPending", pending: null });
        dispatch({ type: "setState", patch: { live: true, ...emptyLiveLists() } });
        persistSignedIn(true);
        persistSelectedHostelId("");
        await refresh();
        return { ok: true };
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "That code didn't work.";
        return { ok: false, error: message };
      }
    },
    signUp: async (input) => {
      try {
        await api.auth.register({
          name: input.name,
          email: input.email,
          password: input.password,
          phone: input.phone,
          hostelId: input.hostelId,
          floor: input.floor,
          whatsapp_opt_in: input.whatsappOptIn ?? false,
        });
        dispatch({
          type: "setAuth",
          patch: { email: input.email, name: input.name, phone: input.phone },
        });
        return { ok: true };
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Couldn't create the account.";
        return { ok: false, error: message };
      }
    },
    signOut: () => {
      const refreshToken = getRefresh();
      // Best-effort blacklist; the local session goes either way.
      if (refreshToken) void api.auth.logout(refreshToken).catch(() => {});
      clearTokens();
      persistSelectedHostelId("");
      dispatch({ type: "setPending", pending: null });
      dispatch({ type: "setState", patch: guestSeedPatch() });
      persistSignedIn(false);
      void refresh();
      showToast("Signed out. Today's schedule stays open to everyone.", "neutral");
    },
    setPending: (pending) => dispatch({ type: "setPending", pending }),
    setDemoMode: (mode) => dispatch({ type: "setDemoMode", mode }),
    setHostel: (hostelId) => {
      dispatch({ type: "setHostel", hostelId });
      void (async () => {
        dispatch({
          type: "setState",
          patch: { loading: true, scheduleError: null },
        });
        const { machines, scheduleError } = await fetchMachines(hostelId);
        dispatch({
          type: "setState",
          patch: {
            loading: false,
            machines,
            slotCache: {},
            scheduleError,
          },
        });
      })();
    },
    setFloor: (floor) => dispatch({ type: "setFloor", floor }),
    showToast,
    clearToast: () => dispatch({ type: "clearToast" }),
    getHostels: () => state.hostels,
    getMachines: (hostelId) => {
      const id = hostelId ?? state.selectedHostelId;
      if (!id) return state.machines;
      const matched = state.machines.filter((m) => m.hostelId === id);
      return matched.length ? matched : state.machines;
    },
    getSlots,
    hasLoadedSlots,
    getProfile: () => state.profile,
    getBookings: () => ({ upcoming: state.upcoming, past: state.past }),
    ensureBooking: async (id) => {
      const cached =
        state.upcoming.find((b) => b.id === id) ?? state.past.find((b) => b.id === id);
      if (!state.live || !getAccess()) return cached ?? null;
      try {
        const dto = await api.bookings.get(id);
        const booking = mapBooking(dto, state.days);
        const past =
          dto.isCancelled ||
          (dto.endsAt ? new Date(dto.endsAt).getTime() < Date.now() : false);
        dispatch({
          type: "setState",
          patch: past
            ? {
                upcoming: state.upcoming.filter((b) => b.id !== id),
                past: [booking, ...state.past.filter((b) => b.id !== id)],
              }
            : {
                past: state.past.filter((b) => b.id !== id),
                upcoming: [booking, ...state.upcoming.filter((b) => b.id !== id)],
              },
        });
        return booking;
      } catch {
        return cached ?? null;
      }
    },
    machineById,
    guardAction,
    createBooking: async (input) => {
      const block = guardAction();
      if (block) return { ok: false, block };
      const machine = state.machines.find((m) => m.id === input.machineId);
      if (!machine) {
        return {
          ok: false,
          block: {
            rule: "offline",
            title: "Machine not found",
            body: "That machine is not on the list.",
          },
        };
      }
      const kind: BookingKind = machine.kind;

      // Guest / demo never hit the API — signed-in bookings are always live.
      if (!getAccess()) {
        const rule = checkBookingRules({
          kind,
          hour: input.hour,
          dayIdx: input.dayIdx,
          quotaUsed: state.quotaUsed,
          quotaLimit: state.quotaLimit,
        });
        if (rule) return { ok: false, block: rule };
        return {
          ok: false,
          block: {
            rule: "unverified",
            title: "Sign in to book",
            body: "Today's schedule is open to everyone. Booking needs an account.",
          },
        };
      }

      const days = liveDays();
      const day = days[Math.max(0, Math.min(input.dayIdx, days.length - 1))];
      const items = [
        { machineId: machine.id, startsAt: startsAtFor(day.date, input.hour) },
      ];
      // The washer+dryer pass is two independent claims in one request.
      if (input.addDryer && kind === "washer") {
        const dryer = state.machines.find(
          (m) => m.kind === "dryer" && m.status !== "offline",
        );
        if (dryer) {
          items.push({
            machineId: dryer.id,
            startsAt: startsAtFor(day.date, (input.hour + 1) % 24),
          });
        }
      }

      try {
        const results = await api.bookings.create(items);
        const primary = results.find((r) => r.machineId === machine.id) ?? results[0];
        if (!primary) {
          return {
            ok: false,
            block: { rule: "offline", title: "Nothing booked", body: "Try again." },
          };
        }
        if (!primary.ok) {
          await refresh();
          return { ok: false, block: blockFrom(primary) };
        }
        const booking = mapBooking(primary.booking, days);
        // A dryer that failed alongside a successful washer is worth saying.
        const failedExtra = results.find((r) => !r.ok && r.index !== primary.index);
        if (failedExtra && !failedExtra.ok) {
          showToast(failedExtra.detail, "warn");
        }
        await refresh();
        return { ok: true, booking };
      } catch (err) {
        const detail =
          err instanceof ApiError ? err.message : "Couldn't reach Lundrii.";
        return {
          ok: false,
          block: { rule: "offline", title: "Booking failed", body: detail },
        };
      }
    },
    cancelBooking: async (id) => {
      const booking = state.upcoming.find((b) => b.id === id);
      if (!booking) return;
      if (!state.live || !getAccess()) {
        const refund = !booking.isLateCancel && booking.kind === "washer";
        dispatch({
          type: "setState",
          patch: {
            upcoming: state.upcoming.filter((b) => b.id !== id),
            quotaUsed: refund ? Math.max(0, state.quotaUsed - 1) : state.quotaUsed,
          },
        });
        return;
      }
      try {
        await api.bookings.cancel(id);
        await refresh();
      } catch (err) {
        showToast(
          err instanceof ApiError ? err.message : "Couldn't cancel that booking.",
          "danger",
        );
      }
    },
    moveBooking: async (bookingId, option) => {
      if (!getAccess()) {
        dispatch({
          type: "setState",
          patch: {
            upcoming: state.upcoming.map((b) =>
              b.id === bookingId
                ? {
                    ...b,
                    hour: option.hour,
                    machineId: option.machineId,
                    machineName: option.machineName,
                    isLateCancel: false,
                  }
                : b,
            ),
          },
        });
        return true;
      }
      try {
        const days = liveDays();
        const day = days[0];
        await api.bookings.move(bookingId, {
          machineId: option.machineId,
          startsAt: option.startsAt ?? startsAtFor(day.date, option.hour),
        });
        await refresh();
        return true;
      } catch (err) {
        showToast(
          err instanceof ApiError ? err.message : "Couldn't move that booking.",
          "danger",
        );
        return false;
      }
    },
    moveOptionsFor: async (booking) => {
      if (getAccess()) {
        try {
          const opts = await api.bookings.moveOptions(booking.id);
          return opts.map(mapMoveOption);
        } catch (err) {
          showToast(
            err instanceof ApiError ? err.message : "Couldn't load move options.",
            "danger",
          );
          return [];
        }
      }
      return [];
    },
    getExchanges: () => state.exchanges,
    exchangeById: (id) => state.exchanges.find((e) => e.id === id),
    sentById: (id) => sentExchanges.find((s) => s.id === id),
    approveExchange: async (id) => {
      const request = state.exchanges.find((e) => e.id === id);
      if (!request) return { ok: false, reason: "Request gone" };
      if (getAccess()) {
        try {
          await api.exchanges.approve(id);
          if (request.kind === "swap") {
            dispatch({
              type: "setState",
              patch: { lastSwapDone: swapDoneFromIncoming(request) },
            });
          }
          await refresh();
          return { ok: true };
        } catch (err) {
          const reason =
            err instanceof ApiError ? err.message : "The swap couldn't go through.";
          return { ok: false, reason };
        }
      }
      let upcoming = [...state.upcoming];
      const target = upcoming.find(
        (b) =>
          request.theyTake.includes(timeLabel(b.hour)) &&
          request.theyTakeSub === b.machineName,
      );
      if (request.kind === "request" || request.youGet.toLowerCase() === "nothing") {
        if (target) upcoming = upcoming.filter((b) => b.id !== target.id);
      } else if (target) {
        const snap = request.getSlot;
        upcoming = upcoming.map((b) =>
          b.id === target.id
            ? {
                ...b,
                hour: snap?.hour ?? b.hour,
                dayLabel: normalizeDayLabel(snap?.dayLabel ?? b.dayLabel),
                machineId: snap?.machineId ?? b.machineId,
                machineName: snap?.location ?? request.youGetSub,
                kind: snap?.kind ?? b.kind,
                isLateCancel: false,
              }
            : b,
        );
      }
      const swapDone: SwapDoneResult =
        request.kind === "swap"
          ? swapDoneFromIncoming(request)
          : state.lastSwapDone ?? (clone(seed.swapDone) as SwapDoneResult);
      dispatch({
        type: "setState",
        patch: {
          exchanges: state.exchanges.filter((e) => e.id !== id),
          upcoming,
          lastSwapDone: swapDone,
        },
      });
      return { ok: true };
    },
    rejectExchange: async (id, optionId, note) => {
      if (getAccess()) {
        const preset = seed.rejectPresets.find((p) => p.id === optionId);
        const reason =
          (note ?? "").trim() ||
          (preset && !preset.allowsCustomNote ? preset.label : undefined);
        try {
          await api.exchanges.reject(id, reason);
          await refresh();
        } catch (err) {
          showToast(
            err instanceof ApiError ? err.message : "Couldn't reject that request.",
            "danger",
          );
        }
        return;
      }
      dispatch({
        type: "setState",
        patch: {
          exchanges: state.exchanges.filter((e) => e.id !== id),
        },
      });
    },
    withdrawSent: async (id) => {
      if (getAccess()) {
        try {
          await api.exchanges.withdraw(id);
          await refresh();
        } catch (err) {
          showToast(
            err instanceof ApiError ? err.message : "Couldn't withdraw that request.",
            "danger",
          );
        }
        return;
      }
      dispatch({
        type: "setState",
        patch: { withdrawnSentIds: [...state.withdrawnSentIds, id] },
      });
    },
    sendExchange: async (input) => {
      if (getAccess()) {
        try {
          const days = liveDays();
          const day = days[0];
          const key = `${input.machineId}:${day.date}`;
          let slots = state.slotCache[key];
          if (!slots) {
            const dto = await api.machines.slots(input.machineId, day.date);
            slots = dto.slots.map(mapSlot);
            dispatch({ type: "slots", key, slots });
          }
          const targetBookingId = slots.find((s) => s.hour === input.hour)?.bookingId;
          if (!targetBookingId) {
            return {
              ok: false,
              error: "That slot isn't open to request anymore.",
            };
          }
          await api.exchanges.create({
            kind: input.isSwap ? "swap" : "request",
            targetBookingId,
            offeredBookingId: input.isSwap ? input.offerId : undefined,
          });
          await refresh();
          return { ok: true };
        } catch (err) {
          const error =
            err instanceof ApiError ? err.message : "Couldn't send that request.";
          showToast(error, "danger");
          return { ok: false, error };
        }
      }
      const machine = state.machines.find((m) => m.id === input.machineId);
      const slotLabel = `Today ${timeLabel(input.hour)} · ${machine?.name ?? "Washer"}`;
      const offered = input.isSwap
        ? state.upcoming.find((b) => b.id === input.offerId) ??
          state.upcoming[0]
        : undefined;
      const id = String(state.nextId);
      const sent: SentExchangeDetail = {
        id,
        peerName: "Rohan Shetty",
        peerInitials: "RS",
        waitingTitle: "Waiting on Rohan",
        waitingBody:
          "He can accept until the slot starts. Nothing is reserved for you in the meantime.",
        peerSlotSummary: slotLabel,
        statusLabel: "Pending",
        kind: (input.isSwap ? "swap" : "request") as ExchangeKind,
        canWithdraw: true,
        offered: offered
          ? {
              hour: offered.hour,
              dayLabel: offered.dayLabel,
              location: offered.machineName,
              machineId: offered.machineId,
              kind: offered.kind,
            }
          : null,
        wanted: {
          hour: input.hour,
          dayLabel: "Today",
          location: machine?.name ?? "",
          machineId: input.machineId,
          kind: machine?.kind === "dryer" ? "dryer" : "washer",
        },
        timeline: [
          {
            title: input.isSwap ? "You offered a swap" : "You asked for the slot",
            timeLabel: "Just now",
            pending: false,
          },
          {
            title: "Rohan was notified",
            timeLabel: "Just now",
            pending: false,
          },
          {
            title: "His decision",
            timeLabel: `Expires at ${timeLabel(input.hour)}`,
            pending: true,
          },
        ],
        withdrawHint:
          "Withdrawing is silent — Rohan just stops seeing the request. Your booking is unaffected either way.",
      };
      const title = input.isSwap
        ? "Swap offer sent to Rohan Shetty"
        : "Request sent to Rohan Shetty";
      const body =
        input.isSwap && offered
          ? `Your ${offered.dayLabel} ${timeLabel(offered.hour)} for ${slotLabel}.`
          : `You asked for ${slotLabel}. Nothing offered back.`;
      dispatch({
        type: "setState",
        patch: {
          nextId: Number(id) + 1,
          extraSent: [sent, ...state.extraSent],
          notifications: [
            {
              unread: true,
              notification: {
                id,
                title,
                body,
                timeLabel: "Just now",
                kind: "success",
              },
            },
            ...state.notifications,
          ],
        },
      });
      return { ok: true };
    },
    getTickets: () => state.tickets,
    ticketById: (id) => state.tickets.find((t) => t.id === id),
    ensureTicket: async (id) => {
      const cached = state.tickets.find((t) => t.id === id);
      if (!state.live || !getAccess()) return cached ?? null;
      try {
        const dto = await api.tickets.get(id);
        const ticket = mapTicket(dto);
        dispatch({
          type: "setState",
          patch: {
            tickets: [ticket, ...state.tickets.filter((t) => t.id !== id)],
          },
        });
        return ticket;
      } catch {
        return cached ?? null;
      }
    },
    raiseTicket: async (input) => {
      if (state.live && getAccess()) {
        try {
          const dto = await api.tickets.create({
            kind: "maintenance",
            note: input.note,
            machineId: input.machineId,
            photo: input.photo ?? undefined,
          });
          const ticket = mapTicket(dto);
          dispatch({ type: "setState", patch: { lastRaisedTicket: ticket } });
          await refresh();
          return ticket;
        } catch (err) {
          showToast(
            err instanceof ApiError ? err.message : "Couldn't raise that ticket.",
            "danger",
          );
          throw err;
        }
      }
      const id = String(state.nextId);
      const number = `#${440 + state.tickets.length}`;
      const machine =
        state.machines.find((m) => m.id === input.machineId) ??
        state.machines[0];
      const ticket: Ticket = {
        id,
        number,
        title: "Machine not working",
        note: input.note,
        kind: "maintenance",
        status: "open",
        timeLabel: "Just now",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resolvedAt: null,
        machineId: machine?.id ?? null,
        machineName: machine?.name ?? null,
        photoUrl: input.photoName ? `mock://${input.photoName}` : null,
        committeeNote: null,
        statusDetail: "In review · raised just now",
      };
      dispatch({
        type: "setState",
        patch: {
          nextId: Number(id) + 1,
          tickets: [ticket, ...state.tickets],
          lastRaisedTicket: ticket,
          notifications: [
            {
              unread: true,
              notification: {
                id,
                title: `Ticket ${number} raised`,
                body: ticket.title,
                timeLabel: "Just now",
                kind: "info",
              },
            },
            ...state.notifications,
          ],
        },
      });
      return ticket;
    },
    getNotifications: () => state.notifications,
    markRead: (id) => {
      // Optimistic: the badge should clear the instant it's tapped.
      dispatch({
        type: "setState",
        patch: {
          notifications: state.notifications.map((n) =>
            n.notification.id === id ? { ...n, unread: false } : n,
          ),
        },
      });
      if (state.live) void api.notifications.read(id).catch(() => {});
    },
    markAllRead: () => {
      dispatch({
        type: "setState",
        patch: {
          notifications: state.notifications.map((n) => ({
            ...n,
            unread: false,
          })),
        },
      });
      if (state.live) void api.notifications.readAll().catch(() => {});
    },
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useLundrii(): LundriiStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLundrii must be used inside LundriiProvider");
  return ctx;
}
