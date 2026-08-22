"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BackChip,
  EmptyCard,
  FieldButton,
  Overlay,
  Phone,
  Sheet,
  WhiteSheet,
} from "@/components/ui";
import { kindLabel, padHour, timeRange } from "@/lib/format";
import type { Booking } from "@/lib/types";
import { useLundrii } from "@/store/lundrii-store";

function ProtoBackHeader({ title, backHref }: { title: string; backHref: string }) {
  return (
    <div className="flex items-center justify-between px-5 pt-14">
      <BackChip href={backHref} />
      <div className="text-[16px] font-semibold text-white">{title}</div>
      <div className="w-9" />
    </div>
  );
}

export function BookingsScreen() {
  const app = useLundrii();
  const router = useRouter();
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [openRequestId, setOpenRequestId] = useState<string | null>(null);
  const requests = app.exchanges;

  const subtitle = `${
    app.upcoming.length ? `${app.upcoming.length} upcoming` : "Nothing upcoming"
  } · ${app.quotaLeft} of ${app.quotaLimit} washes left this week`;

  function bookAgain(b: Booking) {
    const block = app.guardAction();
    if (block) {
      app.showToast(block.body, "warn");
      return;
    }
    router.push(`/confirm?machineId=${b.machineId}&hour=${b.hour}&day=0`);
  }

  return (
    <Phone variant="compact">
      <div className="flex min-h-full flex-col">
        <h1 className="px-[22px] pt-[58px] text-[30px] font-bold tracking-[-0.03em]">Bookings</h1>
        <div className="px-[22px] pt-[7px] text-[13.5px] text-white/60">{subtitle}</div>

        <WhiteSheet className="mt-4 px-[18px] pb-[120px] pt-5">
          {requests.length > 0 ? (
            <div className="mb-[18px]">
              <div className="text-[11px] font-bold tracking-[0.08em] text-navy/40">
                REQUESTS WAITING · {requests.length}
              </div>
              {requests.map((e) => {
                const open = openRequestId === e.id;
                return (
                  <div
                    key={e.id}
                    className="mt-[11px] rounded-[22px] border border-navy/10 p-[15px]"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center gap-[11px] text-left"
                      onClick={() => setOpenRequestId(open ? null : e.id)}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-[12px] font-bold text-white">
                        {e.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-[650]">{e.title}</div>
                        <div className="mt-0.5 text-[11.5px] text-navy/45">{e.timeLabel}</div>
                      </div>
                      <span
                        className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-navy/5 transition-transform duration-200 ${
                          open ? "rotate-180" : ""
                        }`}
                      >
                        <span className="mb-[3px] block h-1.5 w-1.5 rotate-45 border-r-[1.8px] border-b-[1.8px] border-navy/50" />
                      </span>
                    </button>
                    {open ? (
                      <div className="anim-rise">
                        <div className="mt-[13px] flex items-center gap-2.5">
                          <div className="flex-1 rounded-2xl bg-navy/5 px-3 py-2.5">
                            <div className="text-[10.5px] font-semibold text-navy/45">THEY TAKE</div>
                            <div className="mt-[3px] text-[13px] font-[650]">{e.theyTake}</div>
                            <div className="text-[11.5px] text-navy/50">{e.theyTakeSub}</div>
                          </div>
                          <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-navy/[0.07] text-[11px] text-navy/60">
                            ⇆
                          </div>
                          <div className="flex-1 rounded-2xl bg-success/10 px-3 py-2.5">
                            <div className="text-[10.5px] font-semibold text-success-dark">YOU GET</div>
                            <div className="mt-[3px] text-[13px] font-[650]">{e.youGet}</div>
                            <div className="text-[11.5px] text-navy/50">{e.youGetSub}</div>
                          </div>
                        </div>
                        {e.peerNote ? (
                          <div className="mt-[11px] rounded-[14px] bg-navy/4 px-[13px] py-[11px]">
                            <div className="text-[10px] font-bold tracking-[0.06em] text-navy/40">
                              THEIR REASON
                            </div>
                            <div className="mt-1 text-[12.5px] italic leading-[1.45] text-navy/[0.68]">
                              “{e.peerNote}”
                            </div>
                          </div>
                        ) : null}
                        <div className="mt-[13px] flex gap-[9px]">
                          <Link
                            href={`/exchanges/${e.id}`}
                            className="flex-1 rounded-[18px] bg-navy/6 py-[11px] text-center text-[13.5px] font-semibold"
                          >
                            Reject
                          </Link>
                          <Link
                            href={`/exchanges/${e.id}`}
                            className="flex-1 rounded-[18px] bg-success py-[11px] text-center text-[13.5px] font-semibold text-white"
                          >
                            {e.approveLabel}
                          </Link>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
              <div className="mx-0.5 mt-[18px] h-px bg-navy/10" />
            </div>
          ) : null}

          {app.upcoming.length === 0 ? (
            <div className="px-5 py-[60px] text-center">
              <div className="mx-auto flex h-[92px] w-[92px] items-center justify-center rounded-[30px] border-[1.5px] border-dashed border-navy/15 bg-navy/4">
                <div className="h-[38px] w-[38px] rounded-full border-[2.5px] border-navy/18" />
              </div>
              <div className="mt-5 text-[20px] font-bold">Nothing booked yet</div>
              <div className="mt-[7px] text-[13px] leading-[1.5] text-navy/50">
                Two washers are free right now on your floor.
              </div>
              <button
                type="button"
                onClick={() => router.push("/book")}
                className="mx-auto mt-5 flex h-12 w-40 items-center justify-center rounded-[24px] bg-success text-[15px] font-semibold text-white"
              >
                Find a slot
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {app.upcoming.map((b) => {
                const dryer = b.kind === "dryer";
                return (
                  <div
                    key={b.id}
                    className={`rounded-[22px] p-4 ${
                      dryer
                        ? "bg-gradient-to-br from-dryer-amber/15 to-dryer-cream/30 text-navy"
                        : "bg-gradient-to-br from-field-blue/10 to-field-teal/12 text-navy"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-[12px] opacity-65">{b.dayLabel}</div>
                      <div
                        className={`rounded-xl px-[9px] py-1 text-[11px] font-semibold ${
                          dryer ? "bg-dryer-amber/20 text-dryer-ink" : "bg-white/70 text-field-blue"
                        }`}
                      >
                        {kindLabel(b.kind)}
                      </div>
                    </div>
                    <div className="mt-2 text-[25px] font-bold tracking-[-0.02em]">
                      {timeRange(b.hour)}
                    </div>
                    <div className="mt-0.5 text-[13.5px] opacity-75">{b.machineName}</div>
                    <div className="mt-3.5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/bookings/move?id=${b.id}`)}
                        className="flex-1 rounded-2xl bg-white/70 py-2.5 text-center text-[13px] font-semibold"
                      >
                        Move
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/exchange?machineId=m1&hour=11&offerId=${b.id}&mode=swap`,
                          )
                        }
                        className="flex-1 rounded-2xl bg-white/70 py-2.5 text-center text-[13px] font-semibold"
                      >
                        Offer swap
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelTarget(b)}
                        className="flex-1 rounded-2xl bg-white/70 py-2.5 text-center text-[13px] font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {app.past[0] ? (
            <button
              type="button"
              onClick={() => bookAgain(app.past[0])}
              className="mt-4 flex w-full items-center justify-between rounded-[20px] border border-dashed border-navy/16 px-4 py-3.5 text-left"
            >
              <div>
                <div className="text-[13.5px] font-semibold">Repeat last week&apos;s wash</div>
                <div className="mt-0.5 text-[12px] text-navy/50">
                  {app.past[0].machineName} · {padHour(app.past[0].hour)}:00
                </div>
              </div>
              <span className="text-[12px] font-[650] text-success">Book again</span>
            </button>
          ) : null}
        </WhiteSheet>
      </div>
      <Overlay open={!!cancelTarget} onClose={() => setCancelTarget(null)}>
        {cancelTarget ? (
          <Sheet>
            {cancelTarget.isLateCancel ? (
              <>
                <h2 className="text-[22px] font-bold tracking-[-0.02em]">
                  This cancellation still counts
                </h2>
                <p className="mt-2 text-[13.5px] leading-relaxed text-navy/55">
                  Your slot starts in 3 hours. Free cancellation closed at 07:00, six hours
                  before the slot, so this wash stays on your weekly count.
                </p>
                <div className="mt-4 rounded-[20px] border border-danger/16 bg-danger/7 px-4 py-[15px]">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-navy/60">Washes used this week</span>
                    <span className="font-[650]">
                      {app.quotaUsed} of {app.quotaLimit}
                    </span>
                  </div>
                  <div className="mt-[7px] flex justify-between text-[13px]">
                    <span className="text-navy/60">After cancelling</span>
                    <span className="font-[650] text-danger">
                      still {app.quotaUsed} of {app.quotaLimit}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-[22px] font-bold tracking-[-0.02em]">Cancel this booking?</h2>
                <p className="mt-2 text-[13.5px] leading-relaxed text-navy/55">
                  {cancelTarget.machineName} · {cancelTarget.dayLabel}{" "}
                  {padHour(cancelTarget.hour)}:00. The hour goes back in the pool.
                </p>
                <div className="mt-4 rounded-[20px] border border-success/20 bg-success/7 px-4 py-[15px]">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-navy/60">Washes used this week</span>
                    <span className="font-[650]">
                      {app.quotaUsed} of {app.quotaLimit}
                    </span>
                  </div>
                  <div className="mt-[7px] flex justify-between text-[13px]">
                    <span className="text-navy/60">After cancelling</span>
                    <span className="font-[650] text-success-dark">
                      {cancelTarget.kind === "washer"
                        ? `${Math.max(0, app.quotaUsed - 1)} of ${app.quotaLimit}`
                        : `${app.quotaUsed} of ${app.quotaLimit}`}
                    </span>
                  </div>
                </div>
              </>
            )}
            <FieldButton
              variant="danger"
              className="mt-5 h-[52px] w-full rounded-[26px]"
              onClick={() => {
                app.cancelBooking(cancelTarget.id);
                app.showToast("Cancelled. The slot is back in the pool.", "warn");
                setCancelTarget(null);
              }}
            >
              Cancel the booking
            </FieldButton>
            <FieldButton
              variant="soft"
              className="mt-2 h-[52px] w-full rounded-[26px]"
              onClick={() => setCancelTarget(null)}
            >
              Keep it
            </FieldButton>
          </Sheet>
        ) : null}
      </Overlay>
    </Phone>
  );
}

export function MoveBookingScreen() {
  const app = useLundrii();
  const router = useRouter();
  const q = useSearchParams();
  const id = q.get("id") ?? "";
  const [booking, setBooking] = useState<Booking | null>(() =>
    app.upcoming.find((b) => b.id === id) ?? null,
  );
  const [options, setOptions] = useState<Awaited<ReturnType<typeof app.moveOptionsFor>>>(
    [],
  );
  const [optionsForId, setOptionsForId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cached = app.upcoming.find((b) => b.id === id) ?? app.past.find((b) => b.id === id);
    if (cached) setBooking(cached);
    void app.ensureBooking(id).then((next) => {
      if (!cancelled && next) setBooking(next);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!booking) return;
    const current = booking;
    let cancelled = false;
    void app.moveOptionsFor(current).then((opts) => {
      if (!cancelled) {
        setOptions(opts);
        setOptionsForId(current.id);
      }
    });
    return () => {
      cancelled = true;
    };
    // Options are fetched for this booking id; the store object is new each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.id]);

  const optionsReady = !booking || optionsForId === booking.id;
  const shownOptions = optionsForId === booking?.id ? options : [];

  if (!booking) {
    return (
      <Phone variant="compact">
        <ProtoBackHeader title="Move booking" backHref="/bookings" />
        <WhiteSheet className="mt-4 p-5">
          <EmptyCard title="Nothing to move" body="Pick a booking first." href="/bookings" cta="Bookings" />
        </WhiteSheet>
      </Phone>
    );
  }

  return (
    <Phone variant="compact">
      <div className="flex min-h-full flex-col">
        <ProtoBackHeader title="Move booking" backHref="/bookings" />
        <div className="mx-5 mt-5 rounded-[24px] border border-white/26 bg-white/16 px-[18px] py-4 backdrop-blur-[26px]">
          <div className="text-[11px] tracking-[0.06em] text-white/55">MOVING FROM</div>
          <div className="mt-[5px] text-[19px] font-[650]">
            {booking.dayLabel} {padHour(booking.hour)}:00 · {booking.machineName}
          </div>
          <div className="mt-1 text-[12.5px] text-white/60">
            Released the moment the new slot is confirmed.
          </div>
        </div>
        <WhiteSheet className="mt-4 px-[18px] pb-8 pt-5">
          <div className="text-[17px] font-bold">Move it to</div>
          <div className="mt-3.5 flex flex-col gap-2">
            {shownOptions.length === 0 ? (
              <p className="text-[13px] text-navy/50">
                {optionsReady ? "No free slots left today." : "Looking for free slots…"}
              </p>
            ) : (
              shownOptions.map((opt) => (
                <button
                  key={`${opt.machineId}-${opt.hour}`}
                  type="button"
                  onClick={async () => {
                    const block = app.guardAction();
                    if (block) {
                      app.showToast(block.body, "warn");
                      return;
                    }
                    const ok = await app.moveBooking(booking.id, opt);
                    if (!ok) return;
                    app.showToast(`Moved to ${padHour(opt.hour)}:00 · ${opt.machineName}.`);
                    router.push("/bookings");
                  }}
                  className="flex items-center gap-3 rounded-[18px] bg-navy/4 px-3.5 py-[13px] text-left"
                >
                  <div className="w-[54px] text-[13.5px] font-[650]">{padHour(opt.hour)}:00</div>
                  <div className="flex-1 text-[12.5px] text-navy/55">{opt.machineName}</div>
                  <span className="text-[12px] font-[650] text-success">Move here</span>
                </button>
              ))
            )}
          </div>
          <div className="mt-4 rounded-2xl bg-success/8 px-3.5 py-3 text-[12px] leading-[1.45] text-navy/60">
            Rules are checked again for the new time. A move doesn&apos;t use another wash.
          </div>
        </WhiteSheet>
      </div>
    </Phone>
  );
}
