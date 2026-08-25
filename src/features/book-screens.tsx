"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BookSkeleton, SkeletonSlotRow } from "@/components/skeleton";
import { SlotRow } from "@/components/slot-row";
import { FieldButton, Overlay, Phone, Sheet, StatusChip, WhiteSheet } from "@/components/ui";
import { machineFloor } from "@/lib/format";
import { istHour, liveDays } from "@/lib/live";
import type { MachineKind, Slot } from "@/lib/types";
import { useLundrii } from "@/store/lundrii-store";
import { HostelSwitcher } from "./home-screen";
import {
  DayStrip,
  FloorPicker,
  FloorTrigger,
  HostelChip,
  KindToggle,
  SlotLegend,
  pickMachineForFloor,
  scheduleAccent,
} from "./schedule-chrome";

/**
 * One Book page. Guests can browse the schedule; tapping a slot opens
 * sign-in. Signed-in students can book. The tab bar is shell chrome,
 * not a second screen.
 */
export function BookScreen() {
  const app = useLundrii();
  const router = useRouter();
  const searchParams = useSearchParams();
  const deepMachineId = searchParams.get("machineId");
  const { setFloor, machineById } = app;
  const canBook = app.signedIn;

  const [kind, setKind] = useState<MachineKind>("washer");
  const [machineId, setMachineId] = useState<string | null>(null);
  const [dayIdx, setDayIdx] = useState(0);
  const [hostelOpen, setHostelOpen] = useState(false);
  const [floorOpen, setFloorOpen] = useState(false);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [showPreviousSlots, setShowPreviousSlots] = useState(false);

  useEffect(() => {
    if (!deepMachineId) return;
    const routed = machineById(deepMachineId);
    if (!routed) return;
    setKind(routed.kind);
    setMachineId(routed.id);
    setFloor(machineFloor(routed.name));
    router.replace("/book");
  }, [deepMachineId, machineById, setFloor, router]);

  const machines = app.getMachines().filter((m) => m.kind === kind);
  const machine = pickMachineForFloor(machines, app.selectedFloor, machineId);
  const days = liveDays();

  const { loadSlots } = app;
  const loadMachineId = machine?.id;
  useEffect(() => {
    if (loadMachineId) void loadSlots(loadMachineId, dayIdx);
  }, [loadSlots, loadMachineId, dayIdx]);

  useEffect(() => {
    setShowPreviousSlots(false);
  }, [dayIdx]);

  const allSlots = machine ? app.getSlots(machine.id, dayIdx) : [];
  const openCount = allSlots.filter((s) => s.state === "free").length;
  const pastCount = allSlots.filter((s) => s.state === "past").length;
  const accent = scheduleAccent(kind);
  const isToday = dayIdx === 0;
  const currentHour = istHour();
  const previousSlots = isToday
    ? allSlots.filter((s) => s.hour < currentHour)
    : [];
  const listedSlots =
    isToday && !showPreviousSlots
      ? allSlots.filter((s) => s.hour >= currentHour)
      : allSlots;

  function pickKind(next: MachineKind) {
    setKind(next);
    setMachineId(null);
  }

  function onSlot(slot: Slot) {
    if (!canBook) {
      app.setPending(null);
      router.push("/auth/sign-in");
      return;
    }
    if (!machine) return;
    if (slot.state === "past" || (isToday && slot.hour < currentHour)) return;
    if (slot.state === "offline") {
      app.showToast("That machine is out of service.", "warn");
      return;
    }
    if (slot.state === "mine") {
      router.push("/bookings");
      return;
    }
    if (slot.state === "blocked") {
      setRuleOpen(true);
      return;
    }

    const block = app.guardAction();
    if (block) {
      app.showToast(block.body, "warn");
      return;
    }

    const wantsExchange = slot.state === "taken" || slot.state === "running";
    router.push(
      wantsExchange
        ? `/exchange?machineId=${machine.id}&hour=${slot.hour}`
        : `/confirm?machineId=${machine.id}&hour=${slot.hour}&day=${dayIdx}`,
    );
  }

  if (!machine && app.loading) {
    return <BookSkeleton />;
  }

  const slotsPending = Boolean(machine && !app.hasLoadedSlots(machine.id, dayIdx));

  return (
    <Phone variant={kind === "dryer" ? "dryer" : "field"}>
      <div className="flex h-full min-h-full min-w-0 flex-col">
        <div className="flex items-end justify-between px-[22px] pt-[56px]">
          <h1 className="text-[28px] font-bold tracking-[-0.03em]">Book a slot</h1>
          {canBook ? null : (
            <button
              type="button"
              onClick={() => {
                app.setPending(null);
                router.push("/auth/sign-in");
              }}
              className="flex-none rounded-[20px] bg-white px-[15px] py-[9px] text-[13px] font-[650] text-navy"
            >
              Sign in
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 px-5 pt-4">
          <HostelChip
            name={app.selectedHostelName}
            onClick={() => setHostelOpen(true)}
          />
          <KindToggle kind={kind} onChange={pickKind} />
        </div>

        <div className="px-5 pt-2.5">
          <FloorTrigger
            machine={machine}
            kind={kind}
            onClick={() => setFloorOpen(true)}
          />
        </div>

        <DayStrip
          days={days}
          dayIdx={dayIdx}
          onPick={(i) => setDayIdx(i)}
        />

        <WhiteSheet className="mt-3 px-[18px] pb-[var(--safe-bottom)] pt-4">
          <SlotLegend openCount={openCount} pastCount={pastCount} accent={accent} />
          <div
            className={`flex min-h-0 flex-1 flex-col gap-[7px] overflow-y-auto ${
              canBook ? "pb-28" : "pb-[calc(12px+var(--safe-bottom))]"
            }`}
          >
            {app.scheduleError ? (
              <p className="py-10 text-center text-[13px] text-navy/45">
                {app.scheduleError}
              </p>
            ) : machine ? (
              <>
                {previousSlots.length > 0 ? (
                  <button
                    type="button"
                    aria-expanded={showPreviousSlots}
                    onClick={() => setShowPreviousSlots((open) => !open)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-navy/4 px-3.5 py-[11px] text-[12.5px] font-semibold text-navy/50"
                  >
                    {showPreviousSlots ? "Hide previous slots" : "View previous slots"}
                    <span
                      className={`text-[9px] opacity-60 transition-transform ${
                        showPreviousSlots ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </span>
                  </button>
                ) : null}
                {slotsPending ? (
                  Array.from({ length: 8 }, (_, i) => (
                    <SkeletonSlotRow key={i} />
                  ))
                ) : listedSlots.length === 0 ? (
                  <p className="py-10 text-center text-[13px] text-navy/45">
                    No slots for this day yet.
                  </p>
                ) : (
                  listedSlots.map((slot) => (
                    <SlotRow
                      key={slot.hour}
                      slot={slot}
                      kind={kind}
                      canBook={canBook}
                      onSelect={onSlot}
                    />
                  ))
                )}
              </>
            ) : (
              <p className="py-10 text-center text-[13px] text-navy/45">
                No {kind === "dryer" ? "dryers" : "washers"} in this hostel yet.
              </p>
            )}
          </div>
        </WhiteSheet>
      </div>

      <HostelSwitcher open={hostelOpen} onClose={() => setHostelOpen(false)} />
      <FloorPicker
        open={floorOpen}
        onClose={() => setFloorOpen(false)}
        hostelName={app.selectedHostelName}
        machines={machines}
        selectedId={machine?.id ?? null}
        kind={kind}
        onPick={(m) => {
          app.setFloor(machineFloor(m.name));
          setMachineId(m.id);
          setFloorOpen(false);
        }}
      />

      <Overlay open={ruleOpen} onClose={() => setRuleOpen(false)}>
        <Sheet>
          <StatusChip label="QUOTA" />
          <h2 className="mt-3 text-[22px] font-bold tracking-[-0.02em] text-pretty">
            You&apos;ve used this week&apos;s washes
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-navy/55">
            Your institute caps washer slots <strong className="text-navy">Monday to Sunday</strong>.
            Cancel a booking this week, or book again from Monday.
          </p>
          <FieldButton
            variant="soft"
            className="mt-5 h-[52px] w-full rounded-[26px] text-[15px]"
            onClick={() => setRuleOpen(false)}
          >
            Back to the day
          </FieldButton>
        </Sheet>
      </Overlay>
    </Phone>
  );
}

/** Deep link: remember this machine, then open the Book schedule. */
export function DayScreen() {
  const app = useLundrii();
  const router = useRouter();
  const params = useParams<{ machineId: string }>();
  const machineId = params.machineId;
  const { setFloor, machineById } = app;

  useEffect(() => {
    const routed = machineId ? machineById(machineId) : undefined;
    if (routed) {
      setFloor(machineFloor(routed.name));
      router.replace(`/book?machineId=${encodeURIComponent(routed.id)}`);
      return;
    }
    router.replace("/book");
  }, [machineById, machineId, router, setFloor]);

  return <BookSkeleton />;
}
