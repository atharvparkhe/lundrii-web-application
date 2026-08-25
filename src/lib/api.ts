/**
 * Django REST client for the student app.
 *
 * The API speaks camelCase JSON and UUID ids, paginates list endpoints as
 * `{count, results}`, and authenticates with a JWT pair. Access tokens are
 * short-lived, so `request` transparently refreshes once on a 401 and replays.
 */

function resolveApiBase(raw: string | undefined): string {
  let value = (raw ?? "http://localhost:8000/api/v1").trim().replace(/\/+$/, "");
  // `http:localhost:8000/...` is not an origin. The browser treats it as a
  // relative URL and POSTs to `/auth/localhost:8000/api/v1/auth/register`.
  value = value.replace(/^(https?):(?!\/\/)/i, "$1://");
  return value;
}

export const API_BASE = resolveApiBase(process.env.NEXT_PUBLIC_API_BASE);

/** Stamped on every request so bookings record channel `website`. */
export const CLIENT_PLATFORM = "website";

const ACCESS_KEY = "lundrii.access";
const REFRESH_KEY = "lundrii.refresh";

export function getAccess(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(ACCESS_KEY);
}

export function getRefresh(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh?: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ACCESS_KEY, access);
  if (refresh) window.sessionStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(ACCESS_KEY);
  window.sessionStorage.removeItem(REFRESH_KEY);
}

/** Error carrying the API's own code so callers can branch on rule blocks. */
export class ApiError extends Error {
  code: string;
  status: number;
  errors?: Record<string, string[]>;
  payload?: unknown;

  constructor(
    message: string,
    opts: {
      code?: string;
      status: number;
      errors?: Record<string, string[]>;
      payload?: unknown;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.code = opts.code ?? "ERROR";
    this.status = opts.status;
    this.errors = opts.errors;
    this.payload = opts.payload;
  }

  /** First field error, which is what forms want to show. */
  get fieldMessage(): string | null {
    if (!this.errors) return null;
    for (const key of Object.keys(this.errors)) {
      const list = this.errors[key];
      if (list?.length) return list[0];
    }
    return null;
  }
}

type RequestOpts = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  /** Internal: prevents an infinite refresh loop. */
  retried?: boolean;
};

/**
 * Called when the session is definitively gone — a 401 that a refresh could not
 * rescue. The store registers a handler that signs the user out on the spot
 * rather than leaving them on a screen that can no longer load anything.
 */
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

async function refreshAccess(): Promise<boolean> {
  const refresh = getRefresh();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Platform": CLIENT_PLATFORM,
      },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { access?: string; refresh?: string };
    if (!data.access) return false;
    setTokens(data.access, data.refresh);
    return true;
  } catch {
    return false;
  }
}

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

export async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { method = "GET", body, auth = true, retried = false } = opts;
  const headers: Record<string, string> = {
    "X-Client-Platform": CLIENT_PLATFORM,
  };
  const form = isFormData(body);
  // Let the browser set the multipart boundary; JSON still needs the type.
  if (body !== undefined && !form) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getAccess();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body:
        body === undefined ? undefined : form ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Can't reach Lundrii. Check your connection.", {
      code: "NETWORK",
      status: 0,
    });
  }

  if (res.status === 401 && auth) {
    if (!retried && (await refreshAccess())) {
      return request<T>(path, { ...opts, retried: true });
    }
    // Refresh didn't rescue it — the session is over.
    clearTokens();
    onUnauthorized?.();
    throw new ApiError("Your session expired. Sign in again.", {
      code: "UNAUTHENTICATED",
      status: 401,
    });
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const d = (data ?? {}) as {
      code?: string;
      detail?: string;
      errors?: Record<string, string[]>;
    };
    const err = new ApiError(d.detail || `Request failed (${res.status})`, {
      code: d.code,
      status: res.status,
      errors: d.errors,
      payload: data,
    });
    // Field errors read better than the generic "Validation failed."
    const field = err.fieldMessage;
    if (field) err.message = field;
    throw err;
  }

  return data as T;
}

/** List endpoints are paginated; screens only ever want the page of results. */
type Page<T> = { count: number; results: T[] };

async function list<T>(path: string): Promise<T[]> {
  const data = await request<Page<T> | T[]>(path);
  if (Array.isArray(data)) return data;
  return data?.results ?? [];
}

/* ------------------------------------------------------------------ *
 * DTOs — exactly what the API returns.
 * ------------------------------------------------------------------ */

export type LoginDto = {
  access: string;
  refresh: string;
  emailVerified: boolean;
};

export type HostelDto = {
  id: string;
  name: string;
  isHome: boolean;
};

export type SignupHostelDto = {
  id: string;
  name: string;
  instituteId: string;
  instituteName: string;
};

export type MeDto = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  whatsappOptIn: boolean;
  hostelId: string | null;
  hostelName: string | null;
  floor: string | null;
  gender: "male" | "female" | null;
  emailVerified: boolean;
  suspended: boolean;
  suspensionEnds: string | null;
  suspensionReason: string | null;
  quota: { used: number; limit: number; dryerUsed: number; dryerLimit: number; windowDays: number; resetsAt: string | null };
  cooldownClearsAt: string | null;
  strikes: Array<{ id: string; reason?: string; createdAt?: string }>;
};

export type InstituteDto = {
  id: string;
  name: string;
  allowedDomains: string[];
  rules: {
    quotaLimit: number;
    quotaWindowDays: number;
    cooldownHours: number;
    advanceWindowDays: number;
    cancellationCutoffHours: number;
    dryerCapEnabled: boolean;
  };
};

export type MachineDto = {
  id: string;
  name: string;
  kind: "washer" | "dryer";
  status: "free" | "busy" | "offline";
  hostelId: string;
  hostelName: string;
  subtitle: string;
  isOffline: boolean;
  slotLengthMinutes: number;
  openSlotsToday: number;
  freeUntil: string | null;
  freesAt: string | null;
  runningUntil: string | null;
  nextSlotStartsAt: string | null;
};

export type SlotHolderDto = {
  id: string;
  name: string;
};

export type SlotDto = {
  startsAt: string;
  endsAt: string;
  hour: number;
  state: "past" | "free" | "taken" | "mine" | "blocked" | "running" | "offline";
  label: string;
  isMine: boolean;
  /** API sends `{id, name}`; older mocks used a plain string. */
  holder: SlotHolderDto | string | null;
  bookingId: string | null;
  blockedRule: string | null;
  clearsAt: string | null;
};

export type SlotsDto = {
  date: string;
  machineId: string;
  machineName: string;
  kind: "washer" | "dryer";
  isOffline: boolean;
  slotLengthMinutes: number;
  slots: SlotDto[];
};

export type AvailabilitySideDto = {
  freeNow: number;
  total: number;
  nextFreeAt: string | null;
  nextFreeMachineId: string | null;
  nextFreeMachineName: string | null;
  freeingSoon: Array<{ machineId: string; machineName: string; at: string }>;
};

export type AvailabilityDto = {
  asOf: string;
  hostelId: string;
  hostelName: string;
  washers: AvailabilitySideDto;
  dryers: AvailabilitySideDto;
};

export type BookingDto = {
  id: string;
  machineId: string;
  machineName: string;
  kind: "washer" | "dryer";
  hostelId: string;
  hostelName: string;
  startsAt: string;
  endsAt: string;
  hour: number;
  isLateCancel: boolean;
  countsAgainstQuota: boolean;
  cancelledAt: string | null;
  isCancelled: boolean;
};

export type HomeDto = {
  profile: MeDto | null;
  hostels: HostelDto[];
  selectedHostelId: string;
  machines: MachineDto[];
  washersFree: number;
  washersTotal: number;
  upcoming: BookingDto[];
  pendingIncomingExchangeCount: number;
};

/** One slot claim in a batch. `date` + `hour` is accepted instead of `startsAt`. */
export type BookingItemInput = {
  machineId: string;
  startsAt?: string;
  date?: string;
  hour?: number;
};

/**
 * Booking is batch-oriented: a washer and a dryer are two independent claims,
 * either of which can fail on its own. The endpoint answers 200 even when
 * every item failed, so callers must read `ok` per item — never the status.
 */
export type BookingResult =
  | { ok: true; index: number; machineId: string; booking: BookingDto }
  | {
      ok: false;
      index: number;
      machineId: string;
      code: string;
      detail: string;
      rule: string | null;
      clearsAt: string | null;
    };

export type MoveOptionDto = {
  machineId: string;
  machineName: string;
  hostelId?: string;
  hostelName?: string;
  startsAt: string;
  endsAt: string;
  hour: number;
  label?: string;
};

export type MoveOptionsEnvelope = {
  bookingId: string;
  options: MoveOptionDto[];
};

export type ExchangePartyDto = {
  id: string;
  name: string;
  initials: string;
};

export type ExchangeDto = {
  id: string;
  kind: "request" | "swap";
  status: string;
  requester: ExchangePartyDto;
  holder: ExchangePartyDto;
  targetBooking: BookingDto;
  offeredBooking: BookingDto | null;
  failureReason?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  direction?: "incoming" | "outgoing" | null;
  /** Optional reject reason from the holder. */
  rejectNote?: string | null;
  note?: string | null;
};

export type TicketDto = {
  id: string;
  number?: string | number;
  kind: "maintenance";
  status: "open" | "resolved" | "in_review";
  title?: string;
  note: string;
  machineId: string | null;
  machineName: string | null;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string | null;
  reference?: string;
  photoUrl?: string | null;
  committeeNote?: string | null;
};

export type NotificationDto = {
  id: string;
  title: string;
  body: string;
  kind: "info" | "warn" | "danger" | "success";
  type: string;
  createdAt: string;
  read: boolean;
  deepLink: string | null;
};

/** Disconnectable products. GET may also include `unknown`. */
export type AssistantProviderId = "chatgpt" | "claude";

export type AssistantProviderDto = {
  id: AssistantProviderId | "unknown";
  label: string;
  status: "connected" | "disconnected";
  openUrl: string;
  steps: string[];
  connectedAt: string | null;
};

export type AssistantConnectionsDto = {
  mcpUrl: string;
  providers: AssistantProviderDto[];
};

function parseProvider(raw: unknown): AssistantProviderDto | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const id = rec.id;
  if (id !== "chatgpt" && id !== "claude" && id !== "unknown") return null;
  const status = rec.status === "connected" ? "connected" : "disconnected";
  const steps = Array.isArray(rec.steps)
    ? rec.steps.filter((s): s is string => typeof s === "string")
    : [];
  return {
    id,
    label: typeof rec.label === "string" ? rec.label : "",
    status,
    openUrl: typeof rec.openUrl === "string" ? rec.openUrl : "",
    steps,
    connectedAt: typeof rec.connectedAt === "string" ? rec.connectedAt : null,
  };
}

function unwrapAssistantConnections(data: unknown): AssistantConnectionsDto {
  if (Array.isArray(data)) {
    return { mcpUrl: "", providers: data.map(parseProvider).filter(Boolean) as AssistantProviderDto[] };
  }
  if (!data || typeof data !== "object") {
    return { mcpUrl: "", providers: [] };
  }
  const rec = data as Record<string, unknown>;
  if (Array.isArray(rec.providers)) {
    return {
      mcpUrl: typeof rec.mcpUrl === "string" ? rec.mcpUrl : "",
      providers: rec.providers.map(parseProvider).filter(Boolean) as AssistantProviderDto[],
    };
  }
  if (Array.isArray(rec.results)) {
    const results = rec.results;
    const first = results[0];
    if (
      results.length === 1 &&
      first &&
      typeof first === "object" &&
      Array.isArray((first as { providers?: unknown }).providers)
    ) {
      return unwrapAssistantConnections(first);
    }
    return {
      mcpUrl: typeof rec.mcpUrl === "string" ? rec.mcpUrl : "",
      providers: results.map(parseProvider).filter(Boolean) as AssistantProviderDto[],
    };
  }
  return { mcpUrl: "", providers: [] };
}

/* ------------------------------------------------------------------ *
 * Endpoints
 * ------------------------------------------------------------------ */

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<LoginDto>("/auth/login", {
        method: "POST",
        body: { email, password },
        auth: false,
      }),
    register: (input: {
      name: string;
      email: string;
      password: string;
      phone: string;
      hostelId: string;
      whatsapp_opt_in?: boolean;
    }) =>
      request<{ id?: string; emailVerified?: boolean }>("/auth/register", {
        method: "POST",
        body: input,
        auth: false,
      }),
    signupOptions: (email?: string) =>
      request<{ hostels: SignupHostelDto[] }>(
        `/auth/signup-options${email ? `?email=${encodeURIComponent(email)}` : ""}`,
        { auth: false },
      ),
    logout: (refresh: string) =>
      request<void>("/auth/logout", { method: "POST", body: { refresh } }),
    forgotPassword: (email: string) =>
      request<void>("/auth/forgot-password", {
        method: "POST",
        body: { email },
        auth: false,
      }),
    resetPassword: (body: {
      token?: string;
      email?: string;
      otp?: string;
      password: string;
    }) =>
      request<void>("/auth/reset-password", {
        method: "POST",
        body,
        auth: false,
      }),
    requestLoginOtp: (email: string) =>
      request<{ detail: string }>("/auth/login/request-otp", {
        method: "POST",
        body: { email },
        auth: false,
      }),
    verifyLoginOtp: (email: string, otp: string) =>
      request<LoginDto>("/auth/login/verify-otp", {
        method: "POST",
        body: { email, otp },
        auth: false,
      }),
  },

  home: {
    /** Auth optional: sends a bearer token when one is stored. */
    get: (hostelId?: string) =>
      request<HomeDto>(
        `/home${hostelId ? `?hostelId=${encodeURIComponent(hostelId)}` : ""}`,
      ),
  },

  me: {
    get: () => request<MeDto>("/me"),
    patch: (body: {
      name?: string;
      phone?: string;
      whatsappOptIn?: boolean;
      hostelId?: string;
    }) => request<MeDto>("/me", { method: "PATCH", body }),
    hostels: () => list<HostelDto>("/me/hostels"),
    institute: () => request<InstituteDto>("/me/institute"),
    getAssistantConnections: async () => {
      const data = await request<
        AssistantConnectionsDto | Page<AssistantProviderDto> | AssistantProviderDto[]
      >("/me/assistant-connections");
      return unwrapAssistantConnections(data);
    },
    disconnectAssistant: (id: AssistantProviderId) =>
      request<void>(`/me/assistant-connections/${id}`, { method: "DELETE" }),
  },

  hostels: {
    machines: (hostelId: string, kind?: "washer" | "dryer") =>
      list<MachineDto>(
        `/hostels/${hostelId}/machines${kind ? `?kind=${kind}` : ""}`,
      ),
    availabilityNow: (hostelId: string) =>
      request<AvailabilityDto>(`/hostels/${hostelId}/availability/now`),
  },

  machines: {
    get: (machineId: string) => request<MachineDto>(`/machines/${machineId}`),
    slots: (machineId: string, date?: string) =>
      request<SlotsDto>(
        `/machines/${machineId}/slots${date ? `?date=${date}` : ""}`,
      ),
  },

  bookings: {
    list: (status: "upcoming" | "past" = "upcoming") =>
      list<BookingDto>(`/bookings?status=${status}`),
    get: (id: string) => request<BookingDto>(`/bookings/${id}`),
    create: async (items: BookingItemInput[]) => {
      const data = await request<{ results: BookingResult[] }>("/bookings", {
        method: "POST",
        body: { items },
      });
      return data.results ?? [];
    },
    cancel: (id: string) =>
      request<void>(`/bookings/${id}/cancel`, { method: "POST" }),
    move: (id: string, body: BookingItemInput) =>
      request<BookingDto>(`/bookings/${id}/move`, { method: "POST", body }),
    moveOptions: async (id: string) => {
      const data = await request<MoveOptionsEnvelope | MoveOptionDto[]>(
        `/bookings/${id}/move-options`,
      );
      if (Array.isArray(data)) return data;
      return data?.options ?? [];
    },
  },

  exchanges: {
    list: () => list<ExchangeDto>("/exchanges"),
    create: (body: {
      kind: "request" | "swap";
      targetBookingId: string;
      /** Required for `swap`: the booking offered in return. */
      offeredBookingId?: string;
    }) => request<ExchangeDto>("/exchanges", { method: "POST", body }),
    approve: (id: string) =>
      request<ExchangeDto>(`/exchanges/${id}/approve`, { method: "POST" }),
    reject: (id: string, note?: string) =>
      request<ExchangeDto>(`/exchanges/${id}/reject`, {
        method: "POST",
        body: note ? { note } : undefined,
      }),
    withdraw: (id: string) =>
      request<ExchangeDto>(`/exchanges/${id}/withdraw`, { method: "POST" }),
  },

  tickets: {
    list: () => list<TicketDto>("/tickets"),
    get: (id: string) => request<TicketDto>(`/tickets/${id}`),
    create: (body: {
      kind?: "maintenance";
      note: string;
      machineId?: string;
      photo?: File;
    }) => {
      const kind = body.kind ?? "maintenance";
      if (body.photo) {
        const fd = new FormData();
        fd.append("kind", kind);
        fd.append("note", body.note);
        if (body.machineId) fd.append("machineId", body.machineId);
        fd.append("photo", body.photo);
        return request<TicketDto>("/tickets", { method: "POST", body: fd });
      }
      return request<TicketDto>("/tickets", {
        method: "POST",
        body: {
          kind,
          note: body.note,
          machineId: body.machineId,
        },
      });
    },
  },

  notifications: {
    list: () => list<NotificationDto>("/notifications"),
    read: (id: string) =>
      request<void>(`/notifications/${id}/read`, { method: "POST" }),
    readAll: () => request<void>("/notifications/read-all", { method: "POST" }),
    preferences: () => request<Record<string, unknown>>("/notifications/preferences"),
    setPreferences: (body: Record<string, unknown>) =>
      request<Record<string, unknown>>("/notifications/preferences", {
        method: "PATCH",
        body,
      }),
  },
};
