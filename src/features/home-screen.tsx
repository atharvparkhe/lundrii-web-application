"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FieldButton,
  GlassCard,
  HourChip,
  Overlay,
  Phone,
  Sheet,
  WhiteSheet,
} from "@/components/ui";
import { initials, kindLabel } from "@/lib/format";
import { shortDate, istHour, istHourLabel, istMinutesOfDay } from "@/lib/live";
import type { Machine } from "@/lib/types";
import { useLundrii } from "@/store/lundrii-store";

export function HostelSwitcher({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const app = useLundrii();
  return (
    <Overlay open={open} onClose={onClose}>
      <Sheet>
        <div className="text-[18px] font-bold">Switch hostel</div>
        <p className="mt-1 text-[12.5px] text-navy/50">
          You can book machines in any hostel you&apos;re allowed to use.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {app.hostels.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => {
                app.setHostel(h.id);
                onClose();
              }}
              className={`rounded-[18px] px-4 py-3.5 text-left ${
                h.id === app.selectedHostelId
                  ? "border-[1.5px] border-success/40 bg-success/8"
                  : "bg-navy/4"
              }`}
            >
              <div className="text-[15px] font-semibold">{h.name}</div>
              <div className="text-[12px] text-navy/45">
                {h.isHome ? "Home hostel" : "Eligible"}
              </div>
            </button>
          ))}
        </div>
        <FieldButton variant="soft" className="mt-3 h-[52px] w-full rounded-[26px]" onClick={onClose}>
          Close
        </FieldButton>
      </Sheet>
    </Overlay>
  );
}

export function HomeScreen() {
  const app = useLundrii();
  const router = useRouter();
  const [hostelOpen, setHostelOpen] = useState(false);
  const washers = app.getMachines().filter((m) => m.kind === "washer");
  const freeWashers = washers.filter((m) => m.status === "free");
  const upcoming = app.upcoming.slice(0, 2);

  const liveUnverified = app.live && !app.profile.emailVerified;
  const liveSuspended = app.live && app.profile.suspended;
  const banner =
    liveUnverified
      ? { title: "Email not confirmed yet", body: "Tap the link we emailed you to start booking.", href: null as string | null }
      : liveSuspended
        ? {
            title: app.profile.suspensionEnds
              ? `Booking paused until ${shortDate(app.profile.suspensionEnds)}`
              : "Booking paused",
            body: app.profile.suspensionReason ?? "Applied by the committee. You can still browse.",
            href: null,
          }
        : app.demoMode === "unverified" && !app.live
      ? { title: "Email not confirmed yet", body: "Tap the link we emailed you to start booking.", href: null }
      : app.demoMode === "suspended" && !app.live
        ? { title: "Booking paused until 6 Aug", body: "Applied by the committee after ticket #427. You can still browse.", href: null }
        : app.demoMode === "offline" && !app.live
          ? { title: "You're offline", body: "Showing what we knew at 09:12. Slots may already be gone.", href: null }
          : app.exchanges.length > 0
            ? {
                title:
                  app.exchanges.length === 1
                    ? "1 exchange request waiting"
                    : `${app.exchanges.length} exchange requests waiting`,
                body: "Open Bookings to approve or reject.",
                href: "/bookings",
              }
            : null;

  function claim(machine: Machine) {
    const block = app.guardAction();
    if (block) {
      app.showToast(block.body, "warn");
      return;
    }
    router.push(
      `/confirm?machineId=${machine.id}&hour=${Math.min(23, istHour() + 1)}&day=0`,
    );
  }

  return (
    <Phone>
      <div className="flex min-h-full flex-col">
        <div className="flex-1 px-[22px] pt-[58px] pb-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setHostelOpen(true)}
              className="flex items-center gap-2.5"
            >
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-white/30 bg-white/18 text-[13px] font-semibold">
                {initials(app.profile.name)}
              </div>
              <div className="text-left">
                <div className="text-[11px] text-white/55">
                  {app.selectedHostelName} · GIM
                </div>
                <div className="text-[14px] font-semibold">{app.profile.name}</div>
              </div>
            </button>
          </div>

          {banner ? (
            <GlassCard
              className="mt-3.5 rounded-[18px] px-[15px] py-[13px]"
              onClick={banner.href ? () => router.push(banner.href!) : undefined}
            >
              <div className="flex items-center gap-[11px]">
                <span className="h-[9px] w-[9px] shrink-0 rounded-full bg-warn-amber" />
                <div>
                  <div className="text-[13px] font-semibold">{banner.title}</div>
                  <div className="mt-0.5 text-[11.5px] text-white/60">{banner.body}</div>
                </div>
              </div>
            </GlassCard>
          ) : null}

          <div className="pt-[22px] text-center">
            <div className="text-[14px] text-white/62">Washers free right now</div>
            <div className="mt-0.5 flex items-baseline justify-center gap-0.5">
              <span className="text-[74px] font-semibold leading-[1.05] tracking-[-0.035em]">
                {freeWashers.length}
              </span>
              <span className="text-[74px] font-semibold tracking-[-0.035em] text-white/45">
                /{washers.length}
              </span>
            </div>
            <div className="mt-1 inline-flex items-center gap-[7px] rounded-[20px] border border-white/22 bg-white/16 px-[15px] py-[7px] text-[13px] font-medium">
              <span className="opacity-70">
                {app.quotaLeft} of {app.quotaLimit}
              </span>
              washes left this week
            </div>
          </div>

          {freeWashers.length > 0 ? (
            <div className="px-0.5 pt-[22px] pb-5">
              <div className="relative">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-7 -bottom-[19px] h-[58px] rounded-[24px] border border-white/[0.13] bg-white/[0.09] shadow-[0_10px_24px_-14px_rgba(2,10,34,.5)] backdrop-blur-[10px]"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-3.5 -bottom-2.5 h-[58px] rounded-[24px] border border-white/[0.19] bg-white/[0.14] shadow-[0_10px_24px_-14px_rgba(2,10,34,.5)] backdrop-blur-[16px]"
                />
                <GlassCard className="relative rounded-[24px] px-[18px] py-[15px] shadow-[0_12px_30px_-12px_rgba(2,10,34,.5)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 text-left">
                      <div className="text-[16px] font-semibold">{freeWashers[0].name}</div>
                      <div className="mt-[3px] text-[12.5px] text-white/62">
                        {freeWashers[0].freeUntil
                          ? `Washer · free until ${istHourLabel(freeWashers[0].freeUntil)}`
                          : freeWashers[0].subtitle || "Washer · free now"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => claim(freeWashers[0])}
                      className="shrink-0 rounded-[18px] bg-success px-3.5 py-2 text-[13px] font-semibold text-white"
                    >
                      Claim now
                    </button>
                  </div>
                </GlassCard>
              </div>
            </div>
          ) : null}
        </div>

        <WhiteSheet grow={false} className="mt-auto h-[342px] shrink-0 overflow-y-auto px-5 pb-28 pt-5">
          <div className="flex items-baseline justify-between">
            <div className="text-[18px] font-bold tracking-[-0.01em]">Your bookings</div>
            <Link href="/bookings" className="text-[13px] text-navy/45">
              View all
            </Link>
          </div>
          <div className="mt-3 flex flex-col gap-2.5">
            {upcoming.length === 0 ? (
              <div className="rounded-[22px] border-[1.5px] border-dashed border-navy/16 px-[18px] py-[26px] text-center">
                <div className="text-[15px] font-[650]">Nothing booked yet</div>
                <div className="mt-[5px] text-[12.5px] leading-normal text-navy/50">
                  Three washes a week are yours.
                </div>
                <Link
                  href="/book"
                  className="mx-auto mt-3.5 flex h-11 w-[150px] items-center justify-center rounded-[22px] bg-success text-[14px] font-semibold text-white"
                >
                  Find a slot
                </Link>
              </div>
            ) : (
              upcoming.map((b) => {
                const today = b.dayLabel === "Today";
                const dryer = b.kind === "dryer";
                const minsOut = b.hour * 60 - istMinutesOfDay();
                const sub = today
                  ? dryer
                    ? `${kindLabel(b.kind)} · Today`
                    : minsOut > 0
                      ? `${kindLabel(b.kind)} · Today, in ${Math.floor(minsOut / 60)}h ${minsOut % 60}m`
                      : `${kindLabel(b.kind)} · Today`
                  : `${kindLabel(b.kind)} · ${b.dayLabel}`;
                return (
                  <Link
                    key={b.id}
                    href="/bookings"
                    className={`flex items-center gap-3 rounded-[18px] px-3.5 py-[13px] ${
                      today && !dryer
                        ? "border border-field-blue/14 bg-gradient-to-br from-field-blue/10 to-field-teal/12"
                        : "border border-transparent bg-navy/4"
                    }`}
                  >
                    <HourChip
                      hour={b.hour}
                      bg={
                        today && !dryer
                          ? "#0B5FA8"
                          : dryer
                            ? "rgba(224,138,22,0.16)"
                            : "rgba(10,21,51,0.08)"
                      }
                      fg={today && !dryer ? "#fff" : dryer ? "#8A4E05" : "#0A1533"}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14.5px] font-semibold">{b.machineName}</div>
                      <div className="mt-0.5 text-[12px] text-navy/50">{sub}</div>
                    </div>
                    <span className="rounded-[14px] bg-navy/5 px-[11px] py-1.5 text-[12px] font-semibold text-navy/50">
                      Manage
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </WhiteSheet>
      </div>
      <HostelSwitcher open={hostelOpen} onClose={() => setHostelOpen(false)} />
    </Phone>
  );
}
