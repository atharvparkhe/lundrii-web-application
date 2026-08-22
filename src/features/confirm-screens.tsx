"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconDryerMini, IconSwipeArrow } from "@/components/icons";
import {
  BackChip,
  CheckCircle,
  FieldButton,
  HourChip,
  Phone,
  ToggleIndicator,
  WhiteSheet,
} from "@/components/ui";
import { clampDayIdx } from "@/lib/days";
import { liveDays } from "@/lib/live";
import { initials, kindLabel, padHour, timeRange } from "@/lib/format";
import { useLundrii } from "@/store/lundrii-store";

const DRYER_NAME = "Ground Floor · B Wing";
/** Knob width plus the 4px it insets from either end of the track. */
const KNOB_SPAN = 70;

function ProtoBackHeader({ title, backHref }: { title: string; backHref: string }) {
  return (
    <div className="flex items-center justify-between px-5 pt-14">
      <BackChip href={backHref} />
      <div className="text-[16px] font-semibold text-white">{title}</div>
      <div className="w-9" />
    </div>
  );
}

export function ConfirmScreen() {
  const app = useLundrii();
  const router = useRouter();
  const q = useSearchParams();
  const machineId = q.get("machineId") ?? "";
  const hour = Number.parseInt(q.get("hour") ?? "13", 10) || 13;
  const dayIdx = clampDayIdx(q.get("day"));
  const machine = app.machineById(machineId);
  const isDryer = machine?.kind === "dryer";
  const [addDryer, setAddDryer] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const startX = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxDrag, setMaxDrag] = useState(0);
  const day = liveDays()[dayIdx] ?? liveDays()[0];
  const dryerHour = (hour + 1) % 24;
  const quotaAfter = Math.min(
    app.quotaLimit,
    app.quotaUsed + (isDryer ? 0 : 1),
  );
  const dragPct = maxDrag > 0 ? Math.min(1, dragX / maxDrag) : 0;

  // The track flexes with the column now, so the travel has to be measured.
  // A hardcoded distance overshoots the end of the track on a narrow phone
  // and leaves the knob stranded short of it on a wide one.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () =>
      setMaxDrag(Math.max(0, el.clientWidth - KNOB_SPAN));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  async function finish() {
    if (finishing || !machine) return;
    const block = app.guardAction();
    if (block) {
      app.showToast(block.body, "warn");
      return;
    }
    setFinishing(true);
    const result = await app.createBooking({
      machineId: machine.id,
      hour,
      dayIdx,
      addDryer: !isDryer && addDryer,
    });
    if (!result.ok) {
      setFinishing(false);
      app.showToast(result.block.body, "warn");
      return;
    }
    const dryerFlag = !isDryer && addDryer ? 1 : 0;
    router.replace(
      `/success?machineId=${machineId}&hour=${hour}&addDryer=${dryerFlag}&day=${dayIdx}`,
    );
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    startX.current = e.clientX - dragX;
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const x = Math.max(0, Math.min(maxDrag, e.clientX - startX.current));
    setDragX(x);
  }

  function onPointerUp() {
    if (!dragging) return;
    if (dragX > maxDrag * 0.75) {
      setDragX(maxDrag);
      setDragging(false);
      window.setTimeout(finish, 160);
    } else {
      setDragX(0);
      setDragging(false);
    }
  }

  const trackFill = isDryer
    ? "linear-gradient(90deg,rgba(224,138,22,.8),rgba(245,192,101,.95))"
    : "linear-gradient(90deg,rgba(18,164,95,.75),rgba(55,211,146,.9))";

  return (
    <Phone variant={isDryer ? "dryer" : "field"}>
      {/* The swipe bar is pinned and so contributes no height. Without this
          padding it lands on top of the content on a short viewport instead of
          pushing the column into a scroll. */}
      <div className="relative flex min-h-full flex-col pb-[150px]">
        <ProtoBackHeader title="Confirm" backHref="/book" />
        <div className="px-6 pt-[26px] text-center">
          <div className="text-[13.5px] tracking-[0.02em] text-white/60">{day.fullLabel}</div>
          <div className="mt-1 text-[46px] font-[650] leading-[1.1] tracking-[-0.035em]">
            {padHour(hour)}:00 – {padHour((hour + 1) % 24)}:00
          </div>
          <div className="mt-1 text-[15px] text-white/72">{machine?.name ?? "Washer"}</div>
        </div>

        <div className="mx-5 mt-[26px] rounded-[26px] border border-white/26 bg-white/16 p-[18px] backdrop-blur-[26px] backdrop-saturate-180">
          <div className="flex justify-between py-1 text-[13px]">
            <span className="text-white/60">Hostel</span>
            <span className="font-semibold">{app.selectedHostelName}</span>
          </div>
          <div className="flex justify-between py-1 text-[13px]">
            <span className="text-white/60">Length</span>
            <span className="font-semibold">1 hour</span>
          </div>
          <div className="flex justify-between py-1 text-[13px]">
            <span className="text-white/60">Weekly quota after this</span>
            <span className="font-semibold">
              {quotaAfter} of {app.quotaLimit} used
            </span>
          </div>
        </div>

        {!isDryer ? (
          <>
            <button
              type="button"
              onClick={() => setAddDryer((v) => !v)}
              aria-pressed={addDryer}
              className={`mx-5 mt-[11px] flex items-center gap-[13px] rounded-[24px] border-[1.5px] px-[17px] py-[15px] text-left transition-colors ${
                addDryer
                  ? "border-[rgba(63,214,208,.5)] bg-[rgba(18,164,95,.18)]"
                  : "border-white/20 bg-white/10"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-[650]">Add the dryer right after</div>
                <div className="mt-[3px] text-[12.5px] text-white/60">
                  {addDryer
                    ? `${DRYER_NAME} · ${padHour(dryerHour)}:00`
                    : "Skipped — washer only"}
                </div>
              </div>
              <ToggleIndicator on={addDryer} />
            </button>
            <p className="px-6 pt-[9px] text-[11.5px] leading-[1.45] text-white/45">
              Two separate bookings. Dryers don&apos;t count against your washer quota.
            </p>
          </>
        ) : (
          <div className="mx-5 mt-[11px] flex items-center gap-3 rounded-[24px] border border-white/24 bg-white/14 px-[17px] py-[15px]">
            <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl bg-white/90">
              <IconDryerMini />
            </div>
            <div>
              <div className="text-[14.5px] font-[650]">You&apos;re booking a dryer</div>
              <div className="mt-0.5 text-[12.5px] text-white/65">
                It doesn&apos;t use one of your 3 weekly washes.
              </div>
            </div>
          </div>
        )}

        <div className="absolute inset-x-5 bottom-11">
          <div
            ref={trackRef}
            className="relative h-[70px] overflow-hidden rounded-[35px] border border-white/25 bg-white/15 backdrop-blur-[20px]"
          >
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: 46 + dragX,
                background: trackFill,
                transition: dragging ? "none" : "width .28s cubic-bezier(.22,1,.36,1)",
              }}
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span
                className="pl-10 text-[15px] font-semibold tracking-[0.01em]"
                style={{
                  color: `rgba(255,255,255,${0.85 - dragPct * 0.8})`,
                  transition: dragging ? "none" : "color .25s",
                }}
              >
                Swipe to confirm
              </span>
            </div>
            <div
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className={`absolute top-1 left-1 flex h-[62px] w-[62px] cursor-grab items-center justify-center rounded-full bg-white shadow-[0_6px_18px_-6px_rgba(2,10,34,.5)] touch-none ${
                dragX === 0 && !dragging ? "anim-nudge" : ""
              }`}
              style={{
                transform: `translateX(${dragX}px)`,
                transition: dragging ? "none" : "transform .3s cubic-bezier(.22,1,.36,1)",
                animation: dragX === 0 && !dragging ? undefined : "none",
              }}
            >
              <IconSwipeArrow />
            </div>
          </div>
          <div className="mt-3 text-center text-[12px] text-white/50">Hold and drag right</div>
        </div>
      </div>
    </Phone>
  );
}

export function DryerScreen() {
  const app = useLundrii();
  const router = useRouter();
  const q = useSearchParams();
  const machineId = q.get("machineId") ?? "m1";
  const hour = Number.parseInt(q.get("hour") ?? "13", 10) || 13;
  const dayIdx = clampDayIdx(q.get("day"));
  const machine = app.machineById(machineId);
  const dryerHour = (hour + 1) % 24;
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (machine?.kind === "dryer" && !finishing) {
      finish(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [machine?.kind]);

  async function finish(addDryer: boolean) {
    if (finishing) return;
    const block = app.guardAction();
    if (block) {
      app.showToast(block.body, "warn");
      return;
    }
    if (!machine) return;
    setFinishing(true);
    const result = await app.createBooking({
      machineId: machine.id,
      hour,
      dayIdx,
      addDryer: machine.kind === "washer" && addDryer,
    });
    if (!result.ok) {
      setFinishing(false);
      app.showToast(result.block.body, "warn");
      return;
    }
    const dryerFlag = machine.kind === "washer" && addDryer ? 1 : 0;
    router.replace(
      `/success?machineId=${machineId}&hour=${hour}&addDryer=${dryerFlag}&day=${dayIdx}`,
    );
  }

  return (
    <Phone variant="dryer">
      <div className="relative flex min-h-full flex-col">
        <div className="pointer-events-none px-5 pt-14 opacity-55 blur-[1.5px]">
          <div className="text-center text-[16px] font-semibold">
            {machine?.name ?? "3rd Floor · A Wing"}
          </div>
          <div className="mt-6 space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-11 rounded-2xl bg-white/14" />
            ))}
          </div>
        </div>
        <div className="absolute inset-0 bg-[rgba(3,10,30,.55)]" onClick={() => router.back()} />
        <div className="relative mt-auto p-2.5">
          <div className="rounded-[36px] border border-white/70 bg-white/90 p-[22px] text-navy backdrop-blur-[34px]">
            <div className="mx-auto mb-4 h-1 w-[38px] rounded-sm bg-navy/18" />
            <h1 className="text-[22px] font-bold leading-snug tracking-[-0.02em]">
              Add a dryer after the wash?
            </h1>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-navy/55">
              Two separate bookings — you can keep one and drop the other at any time.
            </p>
            <div className="mt-4 rounded-[20px] bg-navy/5 p-3.5">
              <div className="flex items-center gap-3">
                <HourChip hour={hour} bg="#0A1533" fg="#fff" />
                <div>
                  <div className="text-[14.5px] font-semibold">
                    {machine?.name ?? "3rd Floor · A Wing"}
                  </div>
                  <div className="text-[12px] text-navy/50">
                    Washer · {timeRange(hour)} · selected
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2 rounded-[20px] border-[1.5px] border-dryer-amber bg-dryer-amber/9 p-3.5">
              <div className="flex items-center gap-3">
                <HourChip hour={dryerHour} bg="#E08A16" fg="#fff" />
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-semibold">{DRYER_NAME}</div>
                  <div className="text-[12px] text-dryer-ink">Starts right after your wash · free</div>
                </div>
                <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-dryer-amber text-[12px] text-white">
                  ✓
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-dryer-ink">
              Dryers run on their own colour and don&apos;t count against your 3-wash weekly quota.
            </p>
            <div className="mt-5 flex gap-2.5">
              <FieldButton variant="soft" className="h-[52px] rounded-[26px]" onClick={() => finish(false)}>
                Skip
              </FieldButton>
              <FieldButton variant="dryer" className="h-[52px] flex-1 rounded-[26px]" onClick={() => finish(true)}>
                Book both
              </FieldButton>
            </div>
          </div>
        </div>
      </div>
    </Phone>
  );
}

export function SuccessScreen() {
  const app = useLundrii();
  const q = useSearchParams();
  const machineId = q.get("machineId") ?? "m1";
  const hour = Number.parseInt(q.get("hour") ?? "13", 10) || 13;
  const addDryer = q.get("addDryer") === "1";
  const dayIdx = clampDayIdx(q.get("day"));
  const machine = app.machineById(machineId);
  const isDryer = machine?.kind === "dryer";
  const name = machine?.name ?? "3rd Floor · A Wing";
  const day = liveDays()[dayIdx] ?? liveDays()[0];
  const items = useMemo(() => {
    const list = [
      {
        hour,
        machine: name,
        sub: `${isDryer ? "Dryer" : "Washer"} · ${timeRange(hour)}`,
        isDryer,
      },
    ];
    if (!isDryer && addDryer) {
      list.push({
        hour: (hour + 1) % 24,
        machine: DRYER_NAME,
        sub: `Dryer · ${timeRange((hour + 1) % 24)}`,
        isDryer: true,
      });
    }
    return list;
  }, [hour, name, isDryer, addDryer]);

  return (
    <Phone variant="success">
      <div className="relative flex min-h-full flex-col pb-10 pt-24">
        <div className="px-8 text-center">
          <CheckCircle size={82} />
          <h1 className="mt-6 text-[30px] font-bold tracking-[-0.025em] anim-rise">
            {items.length > 1 ? "Both slots are yours" : "Slot confirmed"}
          </h1>
          <p className="mt-2 text-[14.5px] leading-[1.45] text-white/65 anim-rise">
            {day.fullLabel}. We&apos;ll remind you 30 minutes before.
          </p>
        </div>
        <div className="mt-8 space-y-[11px] px-5">
          {items.map((item) => (
            <div
              key={`${item.machine}-${item.hour}`}
              className="flex items-center gap-3.5 rounded-[24px] border border-white/28 bg-white/18 px-[18px] py-4 backdrop-blur-[26px] backdrop-saturate-180"
            >
              <div className="flex h-12 w-12 flex-col items-center justify-center rounded-2xl bg-white/90 text-navy">
                <span className="text-[16px] font-bold leading-none">{padHour(item.hour)}</span>
                <span className="text-[8.5px] opacity-60">:00</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15.5px] font-[650]">{item.machine}</div>
                <div className="mt-[3px] text-[12.5px] text-white/60">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="absolute inset-x-5 bottom-[104px] text-center text-[13px] text-white/70">
          {app.quotaLeft} of {app.quotaLimit} washes left this week
          {app.profile.quota.resetLabel ? ` · ${app.profile.quota.resetLabel}` : ""}
        </p>
        <div className="absolute inset-x-5 bottom-[38px] flex gap-[9px]">
          <Link
            href="/bookings"
            className="flex h-[52px] shrink-0 items-center justify-center rounded-[26px] border border-white/30 bg-white/18 px-[22px] text-[15px] font-semibold"
          >
            See bookings
          </Link>
          <Link
            href="/home"
            className="flex h-[52px] flex-1 items-center justify-center rounded-[26px] bg-white text-[15px] font-semibold text-navy"
          >
            Done
          </Link>
        </div>
      </div>
    </Phone>
  );
}

export function ExchangeComposeScreen() {
  const app = useLundrii();
  const router = useRouter();
  const q = useSearchParams();
  const machineId = q.get("machineId") ?? "";
  const hour = Number.parseInt(q.get("hour") ?? "11", 10) || 11;
  const initialSwap = (q.get("mode") ?? "swap") !== "request";
  const offerFromQuery = q.get("offerId") ?? "";
  const [swapMode, setSwapMode] = useState(initialSwap);
  const [offerId, setOfferId] = useState<string | null>(
    offerFromQuery || app.upcoming[0]?.id || null,
  );
  const machine = app.machineById(machineId);
  const hourLabel = padHour(hour);
  const { loadSlots } = app;
  useEffect(() => {
    if (machineId) void loadSlots(machineId, 0);
  }, [loadSlots, machineId]);
  const slot = app.getSlots(machineId, 0).find((s) => s.hour === hour);
  const peerName = slot?.holder || "Someone";
  const peerInitials = initials(peerName);
  const peerFirst = peerName.trim().split(/\s+/)[0] || peerName;

  async function send() {
    const block = app.guardAction();
    if (block) {
      app.showToast(block.body, "warn");
      return;
    }
    const res = await app.sendExchange({
      machineId,
      hour,
      isSwap: swapMode,
      offerId: offerId ?? undefined,
    });
    if (!res.ok) return;
    app.showToast(`Sent to ${peerFirst}. They have until the slot starts.`);
    router.push("/exchanges?tab=sent");
  }

  return (
    <Phone variant="compact">
      <div className="flex min-h-full flex-col">
        <ProtoBackHeader title="Ask for this slot" backHref="/book" />
        <div className="mx-5 mt-5 flex items-center gap-3.5 rounded-[26px] border border-white/28 bg-white/18 p-[18px] backdrop-blur-[26px]">
          <div className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full bg-white/90 text-[14px] font-bold text-navy">
            {peerInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15.5px] font-[650]">{peerName}</div>
            <div className="mt-0.5 text-[12.5px] text-white/62">
              Today {hourLabel}:00 · {machine?.name ?? "Washer"}
            </div>
          </div>
        </div>
        <p className="px-[22px] pt-[9px] text-[11.5px] text-white/50">
          Full name shown because you&apos;re asking to take this slot.
        </p>
        <WhiteSheet className="relative mt-4 px-[18px] pb-8 pt-5">
          <div className="flex gap-[9px]">
            <button
              type="button"
              onClick={() => setSwapMode(false)}
              className={`flex-1 rounded-[20px] border-[1.5px] p-3.5 text-left ${
                !swapMode
                  ? "border-success bg-success/[0.07]"
                  : "border-transparent bg-navy/5"
              }`}
            >
              <div className="text-[14.5px] font-[650]">Just ask</div>
              <div className="mt-1 text-[12px] leading-[1.4] text-navy/50">Offer nothing back.</div>
            </button>
            <button
              type="button"
              onClick={() => setSwapMode(true)}
              className={`flex-1 rounded-[20px] border-[1.5px] p-3.5 text-left ${
                swapMode
                  ? "border-success bg-success/[0.07]"
                  : "border-transparent bg-navy/5"
              }`}
            >
              <div className="text-[14.5px] font-[650]">Offer a swap</div>
              <div className="mt-1 text-[12px] leading-[1.4] text-navy/50">Trade one of yours.</div>
            </button>
          </div>
          {swapMode ? (
            <div className="mt-5">
              <div className="text-[11px] font-bold tracking-[0.08em] text-navy/40">
                WHICH OF YOURS DO YOU OFFER?
              </div>
              <div className="mt-[11px] flex flex-col gap-2">
                {app.upcoming.length === 0 ? (
                  <p className="text-[13px] text-navy/50">
                    You need an upcoming booking to swap. Send a straight request instead.
                  </p>
                ) : (
                  app.upcoming.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setOfferId(b.id)}
                      className={`flex items-center gap-3 rounded-[18px] px-3.5 py-[13px] text-left ${
                        offerId === b.id
                          ? "border-[1.5px] border-success bg-success/[0.06]"
                          : "border-[1.5px] border-transparent bg-navy/4"
                      }`}
                    >
                      <HourChip
                        hour={b.hour}
                        bg={offerId === b.id ? "#12A45F" : "rgba(10,21,51,0.08)"}
                        fg={offerId === b.id ? "#fff" : "#0A1533"}
                      />
                      <div>
                        <div className="text-[14px] font-[650]">{b.machineName}</div>
                        <div className="mt-0.5 text-[12px] text-navy/50">
                          {kindLabel(b.kind)} · {b.dayLabel}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : null}
          <p className="mt-[18px] rounded-2xl bg-navy/4 px-3.5 py-3 text-[12px] leading-snug text-navy/60">
            {peerFirst} has to approve. Rules are checked at that moment, not now.
          </p>
          <FieldButton
            variant="navy"
            className="mt-6 h-[52px] w-full rounded-[26px] text-[15px]"
            onClick={send}
            disabled={swapMode && !offerId}
          >
            {swapMode ? "Send swap offer" : "Send request"}
          </FieldButton>
        </WhiteSheet>
      </div>
    </Phone>
  );
}
