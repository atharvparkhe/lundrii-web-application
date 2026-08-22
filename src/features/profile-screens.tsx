"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FieldButton,
  GlassCard,
  Overlay,
  Phone,
  Sheet,
  WhiteSheet,
} from "@/components/ui";
import { IconCheck, IconChevronRight } from "@/components/icons";
import { initials } from "@/lib/format";
import {
  api,
  type AssistantConnectionsDto,
  type AssistantProviderDto,
  type AssistantProviderId,
} from "@/lib/api";
import { shortDate } from "@/lib/live";
import { useLundrii } from "@/store/lundrii-store";
import { HostelSwitcher } from "./home-screen";

const PROVIDER_ORDER: AssistantProviderId[] = ["chatgpt", "claude"];
const AI_CONNECTORS_ENABLED = false;
const WHATSAPP_BOOKING_ENABLED = false;

const FALLBACK_PROVIDERS: Record<AssistantProviderId, AssistantProviderDto> = {
  chatgpt: {
    id: "chatgpt",
    label: "ChatGPT",
    status: "disconnected",
    openUrl: "https://chatgpt.com/",
    steps: [
      "Open ChatGPT",
      "Settings → Connectors → add server",
      "Paste the MCP URL",
      "Approve Lundrii",
    ],
    connectedAt: null,
  },
  claude: {
    id: "claude",
    label: "Claude",
    status: "disconnected",
    openUrl: "https://claude.ai/settings/connectors",
    steps: [
      "Open Claude",
      "Settings → Connectors → add a connector",
      "Paste the MCP URL",
      "Approve Lundrii",
    ],
    connectedAt: null,
  },
};

const POLL_MS = 3000;
const WAIT_TIMEOUT_MS = 3 * 60 * 1000;

function providerLabel(id: AssistantProviderDto["id"]): string {
  if (id === "chatgpt") return "ChatGPT";
  if (id === "claude") return "Claude";
  return "Other";
}

function mergeProviders(fromApi: AssistantProviderDto[]): AssistantProviderDto[] {
  const byId = new Map(fromApi.map((p) => [p.id, p] as const));
  const known = PROVIDER_ORDER.map((id) => {
    const existing = byId.get(id);
    if (!existing) return FALLBACK_PROVIDERS[id];
    return {
      ...FALLBACK_PROVIDERS[id],
      ...existing,
      id,
      label: existing.label || FALLBACK_PROVIDERS[id].label,
      steps: existing.steps?.length ? existing.steps : FALLBACK_PROVIDERS[id].steps,
      openUrl: existing.openUrl || FALLBACK_PROVIDERS[id].openUrl,
    };
  });
  const other = byId.get("unknown");
  if (other?.status === "connected") {
    known.push({
      id: "unknown",
      label: other.label || "Other assistant",
      status: "connected",
      openUrl: "",
      steps: [],
      connectedAt: other.connectedAt,
    });
  }
  return known;
}

function connectionSubtitle(providers: AssistantProviderDto[]): string {
  const names = providers
    .filter((p) => p.status === "connected")
    .map((p) => providerLabel(p.id));
  return names.length ? names.join(" · ") : "Not connected";
}

function isLocalMcpUrl(url: string): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "[::1]" ||
      host === "::1" ||
      host.endsWith(".local")
    );
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ProfileScreen() {
  const app = useLundrii();
  const { showToast } = app;
  const router = useRouter();
  const p = app.profile;
  const suspended = p.suspended;
  const strikeCount = p.strikes.length;
  const [sheet, setSheet] = useState<
    "standing" | "out" | "hostel" | "ai-list" | "ai-detail" | null
  >(null);
  const [connections, setConnections] = useState<AssistantConnectionsDto>({
    mcpUrl: "",
    providers: [],
  });
  const [detailId, setDetailId] = useState<AssistantProviderDto["id"] | null>(null);
  const [waitTimedOut, setWaitTimedOut] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const pipCount = Math.max(app.quotaLimit, 1);
  const pips = Array.from({ length: pipCount }, (_, i) => i < app.quotaUsed);
  const openTickets = app.tickets.filter((t) => t.status === "open").length;
  const resolvedTickets = app.tickets.length - openTickets;
  const ticketSummary = app.tickets.length
    ? [
        openTickets ? `${openTickets} in review` : null,
        resolvedTickets ? `${resolvedTickets} resolved` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "None yet";

  const providers = useMemo(
    () => mergeProviders(connections.providers),
    [connections.providers],
  );
  const detail = providers.find((pr) => pr.id === detailId) ?? null;
  const mcpUrl = connections.mcpUrl;
  const localMcp = isLocalMcpUrl(mcpUrl);

  const refreshConnections = useCallback(async () => {
    const data = await api.me.getAssistantConnections();
    setConnections(data);
    return data;
  }, []);

  useEffect(() => {
    if (!AI_CONNECTORS_ENABLED) return;
    let cancelled = false;
    void refreshConnections().catch(() => {
      if (!cancelled) {
        setConnections({ mcpUrl: "", providers: [] });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [refreshConnections]);

  useEffect(() => {
    if (sheet !== "ai-detail" || !detailId) {
      setWaitTimedOut(false);
      return;
    }

    let cancelled = false;
    const startedAt = Date.now();
    let timer = 0;

    const tick = async (isInitial: boolean) => {
      if (cancelled) return;
      try {
        const data = await refreshConnections();
        if (cancelled) return;
        const next = mergeProviders(data.providers).find((pr) => pr.id === detailId);
        if (next?.status === "connected") {
          if (!isInitial) showToast(`${providerLabel(detailId)} connected.`);
          return;
        }
      } catch {
        /* keep waiting */
      }
      if (cancelled) return;
      if (Date.now() - startedAt >= WAIT_TIMEOUT_MS) {
        setWaitTimedOut(true);
        return;
      }
      timer = window.setTimeout(() => void tick(false), POLL_MS);
    };

    void tick(true);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [sheet, detailId, refreshConnections, showToast]);

  const goodStanding =
    "No strikes recorded. Strikes are added by the hostel committee after a ticket or an incident — never automatically.";
  const suspendedWhy =
    p.suspensionReason ||
    "Applied by the hostel committee. You can still browse machines.";
  const suspendedUntil = p.suspensionEnds
    ? `Booking paused until ${shortDate(p.suspensionEnds)}`
    : "Booking paused";
  const standingLabel = suspended
    ? "Suspended"
    : strikeCount
      ? `Strikes · ${strikeCount}`
      : "Good · no strikes";
  const standingBody = suspended
    ? `${strikeCount ? `${strikeCount} strike${strikeCount === 1 ? "" : "s"} on record. ` : ""}${suspendedWhy}`
    : strikeCount
      ? p.strikes.join(" · ")
      : goodStanding;

  return (
    <Phone variant={suspended ? "suspended" : "field"}>
      <div className="flex min-h-full flex-col">
        <div className="flex items-center gap-3.5 px-[22px] pt-[62px]">
          <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full border border-white/32 bg-white/20 text-[19px] font-semibold">
            {initials(app.profile.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[21px] font-bold tracking-[-0.025em]">{app.profile.name}</div>
            <div className="mt-[3px] truncate text-[13px] text-white/[0.62]">{app.profile.email}</div>
            <div className="mt-0.5 truncate text-[12.5px] text-white/[0.45]">
              {app.profile.hostelName} · {app.meta.instituteName}
            </div>
          </div>
        </div>

        {suspended ? (
          <GlassCard className="mx-5 mt-4 rounded-[26px] p-4">
            <div className="text-[10.5px] font-bold tracking-[0.6px] text-coral">SUSPENDED</div>
            <div className="mt-1 text-[16px] font-semibold">{suspendedUntil}</div>
            <p className="mt-1 text-[12.5px] text-white/65">{suspendedWhy}</p>
          </GlassCard>
        ) : null}

        <div className="mx-5 mt-[22px] rounded-[26px] border border-white/28 bg-white/18 p-[18px] backdrop-blur-[26px] backdrop-saturate-180">
          <div className="flex items-baseline justify-between">
            <div className="text-[11px] tracking-[0.06em] text-white/60">THIS WEEK</div>
            <div className="text-[11.5px] text-white/60">{app.profile.quota.resetLabel}</div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-[3px]">
            <span className="text-[40px] font-[650] tracking-[-0.03em]">{app.quotaUsed}</span>
            <span className="text-[40px] font-[650] tracking-[-0.03em] text-white/50">
              /{app.quotaLimit}
            </span>
            <span className="ml-2 text-[14px] text-white/65">washes used</span>
          </div>
          <div className="mt-3 flex gap-1.5">
            {pips.map((on, i) => (
              <div
                key={i}
                className={`h-[7px] flex-1 rounded ${on ? "bg-white" : "bg-white/25"}`}
              />
            ))}
          </div>
        </div>

        <WhiteSheet grow={false} className="mt-auto px-5 pb-28 pt-[22px]">
          <div className="flex items-center justify-between">
            <div className="text-base font-bold">Standing</div>
            <button
              type="button"
              onClick={() => setSheet("standing")}
              className={`rounded-[13px] px-[11px] py-[5px] text-xs font-[650] ${
                suspended
                  ? "bg-danger/10 text-danger"
                  : "bg-success/10 text-success-dark"
              }`}
            >
              {standingLabel}
            </button>
          </div>
          <p className="mt-[11px] text-[12.5px] leading-normal text-navy/55">{standingBody}</p>
          <div className="mt-5 flex flex-col gap-2">
            <Row
              label="Edit profile"
              value="Name, phone, home hostel"
              onClick={() => router.push("/profile/edit")}
            />
            {app.signedIn && app.hostels.length > 0 ? (
              <Row
                label="Switch hostel"
                value={app.selectedHostelName}
                onClick={() => setSheet("hostel")}
              />
            ) : null}
            <Row
              label="Connect to your AI provider"
              value={
                AI_CONNECTORS_ENABLED
                  ? connectionSubtitle(providers)
                  : "ChatGPT or Claude"
              }
              comingSoon={!AI_CONNECTORS_ENABLED}
              onClick={
                AI_CONNECTORS_ENABLED ? () => setSheet("ai-list") : undefined
              }
            />
            <Row
              label="Book using WhatsApp"
              value="Message a slot to book"
              comingSoon={!WHATSAPP_BOOKING_ENABLED}
            />
            <Row
              label="Your tickets"
              value={ticketSummary}
              onClick={() => router.push("/tickets")}
            />
          </div>
          <button
            type="button"
            onClick={() => setSheet("out")}
            className="mt-[11px] flex h-[50px] w-full items-center justify-center rounded-[25px] border-[1.5px] border-[rgba(180,52,31,.22)] text-[14.5px] font-[650] text-danger"
          >
            Sign out
          </button>
        </WhiteSheet>
      </div>
      <HostelSwitcher open={sheet === "hostel"} onClose={() => setSheet(null)} />
      <Overlay open={sheet === "standing"} onClose={() => setSheet(null)}>
        <Sheet>
          <h2 className="text-[20px] font-bold">Standing</h2>
          <p className="mt-1 text-[12.5px] text-navy/50">
            {suspended
              ? `${strikeCount || 1} strike${strikeCount === 1 ? "" : "s"} on record. The committee applied this suspension by hand.`
              : strikeCount
                ? `${strikeCount} strike${strikeCount === 1 ? "" : "s"} on record.`
                : "No strikes recorded. Strikes never trigger a suspension automatically."}
          </p>
          <p className="mt-3 rounded-[20px] bg-navy/4 px-4 py-3.5 text-[12.5px] leading-relaxed text-navy/60">
            {standingBody}
          </p>
          <FieldButton variant="soft" className="mt-4 h-[52px] w-full rounded-[26px]" onClick={() => setSheet(null)}>
            Close
          </FieldButton>
        </Sheet>
      </Overlay>
      <Overlay open={sheet === "out"} onClose={() => setSheet(null)}>
        <Sheet>
          <h2 className="text-[20px] font-bold">Sign out?</h2>
          <p className="mt-2 text-[13.5px] text-navy/55">
            You&apos;ll need to sign in again to book. The schedule stays open to everyone.
          </p>
          <FieldButton
            variant="danger"
            className="mt-5 h-[52px] w-full rounded-[26px]"
            onClick={() => {
              app.signOut();
              router.push("/book");
            }}
          >
            Sign out
          </FieldButton>
          <FieldButton variant="soft" className="mt-2 h-[52px] w-full rounded-[26px]" onClick={() => setSheet(null)}>
            Stay
          </FieldButton>
        </Sheet>
      </Overlay>
      <Overlay
        open={sheet === "ai-list"}
        onClose={() => {
          setSheet(null);
          setDetailId(null);
        }}
      >
        <Sheet>
          <h2 className="text-[20px] font-bold">Connect to your AI provider</h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-navy/50">
            Add Lundrii in ChatGPT or Claude. This tab cannot finish the connection for you.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {providers.map((pr) => (
              <button
                key={pr.id}
                type="button"
                onClick={() => {
                  setWaitTimedOut(false);
                  setDetailId(pr.id);
                  setSheet("ai-detail");
                }}
                className="flex w-full items-center justify-between rounded-[20px] bg-navy/4 px-4 py-[15px] text-left"
              >
                <span>
                  <span className="block text-[14.5px] font-[650]">{pr.label}</span>
                  <span className="mt-0.5 block text-xs text-navy/50">
                    {pr.status === "connected" ? "Connected" : "Not connected"}
                  </span>
                </span>
                {pr.status === "connected" ? (
                  <IconCheck className="h-[18px] w-[18px] text-success-dark" />
                ) : (
                  <IconChevronRight className="text-navy/35" />
                )}
              </button>
            ))}
          </div>
        </Sheet>
      </Overlay>
      <Overlay open={sheet === "ai-detail"} onClose={() => setSheet("ai-list")}>
        <Sheet>
          {detail ? (
            <>
              <h2 className="text-[20px] font-bold">{detail.label}</h2>
              {detail.status === "connected" ? (
                <>
                  <p className="mt-2 text-[13.5px] text-navy/55">
                    Connected
                    {detail.connectedAt ? ` since ${shortDate(detail.connectedAt)}` : ""}.
                    Bookings from {detail.label} use your Lundrii account.
                  </p>
                  {detail.id === "chatgpt" || detail.id === "claude" ? (
                    <FieldButton
                      variant="danger"
                      className="mt-5 h-[52px] w-full rounded-[26px]"
                      disabled={disconnecting}
                      onClick={async () => {
                        const providerId = detail.id;
                        if (providerId !== "chatgpt" && providerId !== "claude") return;
                        setDisconnecting(true);
                        try {
                          await api.me.disconnectAssistant(providerId);
                          await refreshConnections();
                          showToast(`${detail.label} disconnected.`, "neutral");
                        } catch (err) {
                          showToast(
                            err instanceof Error ? err.message : "Could not disconnect.",
                            "danger",
                          );
                        } finally {
                          setDisconnecting(false);
                        }
                      }}
                    >
                      Disconnect
                    </FieldButton>
                  ) : (
                    <p className="mt-3 rounded-[20px] bg-navy/4 px-4 py-3.5 text-[12.5px] leading-relaxed text-navy/55">
                      This grant is not ChatGPT or Claude, so Profile cannot disconnect it
                      here.
                    </p>
                  )}
                  <FieldButton
                    variant="soft"
                    className="mt-2 h-[52px] w-full rounded-[26px]"
                    onClick={() => setSheet("ai-list")}
                  >
                    Back
                  </FieldButton>
                </>
              ) : (
                <>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-navy/55">
                    This tab cannot finish the connection for you — add the server in{" "}
                    {detail.label}, then approve Lundrii.
                  </p>
                  {localMcp ? (
                    <p className="mt-3 rounded-[20px] bg-[rgba(201,138,18,.14)] px-4 py-3.5 text-[12.5px] leading-relaxed text-[#8A5C05]">
                      This MCP URL is on localhost. ChatGPT and Claude on the internet cannot
                      reach a local API — use the hosted Railway URL for a real test.
                    </p>
                  ) : null}
                  {mcpUrl ? (
                    <div className="mt-3 rounded-[20px] bg-navy/4 px-4 py-3.5">
                      <div className="text-[10.5px] font-bold tracking-[0.5px] text-navy/45">
                        MCP URL
                      </div>
                      <p className="mt-1 break-all text-[13px] leading-relaxed text-navy/80">
                        {mcpUrl}
                      </p>
                      <FieldButton
                        variant="soft"
                        className="mt-3 h-[44px] w-full rounded-[22px] text-[14px]"
                        onClick={async () => {
                          const ok = await copyText(mcpUrl);
                          showToast(
                            ok ? "MCP URL copied." : "Could not copy. Select the URL instead.",
                            ok ? "ok" : "warn",
                          );
                        }}
                      >
                        Copy
                      </FieldButton>
                    </div>
                  ) : (
                    <p className="mt-3 rounded-[20px] bg-navy/4 px-4 py-3.5 text-[12.5px] text-navy/55">
                      MCP URL will appear once the API is reachable.
                    </p>
                  )}
                  <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-[13px] leading-relaxed text-navy/60">
                    {detail.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  {waitTimedOut ? (
                    <p className="mt-3 text-[12.5px] leading-relaxed text-navy/55">
                      Still waiting? Finish setup in {detail.label}, then come back.
                    </p>
                  ) : (
                    <p className="mt-3 text-[12.5px] text-navy/45">
                      Waiting for {detail.label} to connect…
                    </p>
                  )}
                  <FieldButton
                    variant="navy"
                    className="mt-4 h-[52px] w-full rounded-[26px]"
                    onClick={() => {
                      window.open(detail.openUrl, "_blank", "noopener");
                    }}
                  >
                    Open {detail.label}
                  </FieldButton>
                  <FieldButton
                    variant="soft"
                    className="mt-2 h-[52px] w-full rounded-[26px]"
                    onClick={() => setSheet("ai-list")}
                  >
                    Back
                  </FieldButton>
                </>
              )}
            </>
          ) : null}
        </Sheet>
      </Overlay>
    </Phone>
  );
}

function Row({
  label,
  value,
  onClick,
  comingSoon,
}: {
  label: string;
  value: string;
  onClick?: () => void;
  comingSoon?: boolean;
}) {
  const disabled = comingSoon || !onClick;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`flex w-full items-center justify-between rounded-[20px] bg-navy/4 px-4 py-[15px] text-left ${
        disabled ? "cursor-not-allowed" : ""
      }`}
    >
      <span>
        <span className="block text-[14.5px] font-[650]">{label}</span>
        <span className="mt-0.5 block text-xs text-navy/50">{value}</span>
      </span>
      {comingSoon ? (
        <span className="flex-none rounded-[11px] bg-navy/8 px-2.5 py-1 text-[11px] font-[650] text-navy/45">
          Coming soon
        </span>
      ) : (
        <IconChevronRight className="text-navy/35" />
      )}
    </button>
  );
}
