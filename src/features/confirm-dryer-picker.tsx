"use client";

import { useEffect, useRef, useState } from "react";
import { SkeletonSlotRow } from "@/components/skeleton";
import { SlotRow } from "@/components/slot-row";
import { WhiteSheet } from "@/components/ui";
import { machineFloor, padHour } from "@/lib/format";
import {
  hostelDryersForWasher,
  pickPairedDryer,
  recommendedDryerHour,
} from "@/lib/pairing";
import type { Machine, Slot } from "@/lib/types";
import { useLundrii } from "@/store/lundrii-store";
import { FloorPicker, FloorTrigger, SlotLegend } from "./schedule-chrome";

export function ConfirmDryerPicker({
  washer,
  dayIdx,
  washerHour,
  selectedDryerId,
  selectedHour,
  onChange,
}: {
  washer: Machine;
  dayIdx: number;
  washerHour: number;
  selectedDryerId: string | null;
  selectedHour: number | null;
  onChange: (next: { dryerId: string; hour: number }) => void;
}) {
  const app = useLundrii();
  const dryers = hostelDryersForWasher(app.getMachines(), washer);
  const defaultDryer = pickPairedDryer(app.getMachines(), washer);
  const recommended = recommendedDryerHour(washerHour);

  const [activeDryerId, setActiveDryerId] = useState<string | null>(
    () => selectedDryerId ?? defaultDryer?.id ?? null,
  );
  const [floorOpen, setFloorOpen] = useState(false);
  /** Prevents re-firing auto-select for the same dryer/day/hour. */
  const autoTriedRef = useRef<string>("");

  // Follow washer / external selection for which dryer is shown.
  useEffect(() => {
    if (selectedDryerId) {
      setActiveDryerId(selectedDryerId);
      return;
    }
    setActiveDryerId(pickPairedDryer(app.getMachines(), washer)?.id ?? null);
    autoTriedRef.current = "";
    // eslint-disable-next-line react-hooks/exhaustive-deps -- washer identity
  }, [washer.id, selectedDryerId]);

  const dryer =
    dryers.find((m) => m.id === activeDryerId) ??
    dryers.find((m) => m.id === selectedDryerId) ??
    defaultDryer ??
    null;

  const { loadSlots, getSlots, hasLoadedSlots } = app;
  const loadId = dryer?.id;
  useEffect(() => {
    if (loadId) void loadSlots(loadId, dayIdx);
  }, [loadSlots, loadId, dayIdx]);

  // Auto-select recommended hour when free; if taken, highlight only (no onChange)
  // unless the user switched dryers (keep parent dryer id in sync).
  useEffect(() => {
    if (!dryer) return;
    if (!hasLoadedSlots(dryer.id, dayIdx)) return;

    const alreadyCommitted =
      selectedDryerId === dryer.id &&
      selectedHour != null &&
      getSlots(dryer.id, dayIdx).find((s) => s.hour === selectedHour)?.state ===
        "free";
    if (alreadyCommitted) return;

    const key = `${dryer.id}:${dayIdx}:${recommended}`;
    if (autoTriedRef.current === key) return;
    autoTriedRef.current = key;

    const slot = getSlots(dryer.id, dayIdx).find((s) => s.hour === recommended);
    if (slot?.state === "free") {
      onChange({ dryerId: dryer.id, hour: recommended });
      return;
    }
    // Mount / first open with taken recommended: leave hour unset.
    // Dryer switch with taken recommended: still sync the machine id.
    if (selectedDryerId != null && selectedDryerId !== dryer.id) {
      onChange({ dryerId: dryer.id, hour: recommended });
    }
  }, [
    dryer,
    dayIdx,
    recommended,
    selectedDryerId,
    selectedHour,
    hasLoadedSlots,
    getSlots,
    onChange,
  ]);

  if (dryers.length === 0) {
    return (
      <div className="mt-3 rounded-[24px] bg-[#0A1533] px-4 py-4">
        <p className="text-[13px] leading-relaxed text-white/65">
          No dryer is available in this hostel right now. You can still book the
          washer alone.
        </p>
      </div>
    );
  }

  const slots = dryer ? getSlots(dryer.id, dayIdx) : [];
  const openCount = slots.filter((s) => s.state === "free").length;
  const pastCount = slots.filter((s) => s.state === "past").length;
  const slotsReady = dryer ? hasLoadedSlots(dryer.id, dayIdx) : false;

  function onSlot(slot: Slot) {
    if (!dryer || slot.state !== "free") return;
    onChange({ dryerId: dryer.id, hour: slot.hour });
  }

  return (
    <div className="mt-3 overflow-hidden rounded-[24px] bg-[#0A1533] p-2.5">
      <FloorTrigger
        machine={dryer}
        kind="dryer"
        onClick={() => setFloorOpen(true)}
      />
      <WhiteSheet className="mt-2 px-[14px] pb-3.5 pt-3">
        <SlotLegend
          openCount={openCount}
          pastCount={pastCount}
          accent="#E08A16"
        />
        <div className="flex max-h-[220px] flex-col gap-[7px] overflow-y-auto">
          {!dryer ? (
            <p className="py-6 text-center text-[13px] text-navy/45">
              No dryers in this hostel yet.
            </p>
          ) : !slotsReady ? (
            Array.from({ length: 8 }, (_, i) => <SkeletonSlotRow key={i} />)
          ) : slots.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-navy/45">
              No slots for this day yet.
            </p>
          ) : (
            slots.map((slot) => {
              const isRecommended = slot.hour === recommended;
              const isSelected =
                dryer.id === selectedDryerId &&
                slot.hour === selectedHour &&
                slot.state === "free";
              return (
                <div key={slot.hour}>
                  {isRecommended ? (
                    <div className="mb-1 flex items-center justify-between px-0.5">
                      <span className="text-[10px] font-bold tracking-[0.06em] text-dryer-ink/70">
                        RECOMMENDED · {padHour(recommended)}:00
                      </span>
                      {slot.state !== "free" &&
                      !(selectedDryerId === dryer.id && selectedHour != null) ? (
                        <span className="text-[10px] font-semibold text-navy/40">
                          Taken — pick another
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <div
                    className={
                      isSelected
                        ? "rounded-2xl ring-2 ring-dryer-amber ring-offset-1"
                        : isRecommended && slot.state === "free"
                          ? "rounded-2xl ring-1 ring-dryer-amber/40"
                          : undefined
                    }
                  >
                    <SlotRow
                      slot={slot}
                      kind="dryer"
                      canBook
                      onSelect={onSlot}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </WhiteSheet>
      <FloorPicker
        open={floorOpen}
        onClose={() => setFloorOpen(false)}
        hostelName={app.selectedHostelName}
        machines={dryers}
        selectedId={dryer?.id ?? null}
        kind="dryer"
        onPick={(m) => {
          app.setFloor(machineFloor(m.name));
          setActiveDryerId(m.id);
          autoTriedRef.current = "";
          setFloorOpen(false);
          if (hasLoadedSlots(m.id, dayIdx)) {
            // Sync parent to this dryer + recommended hour. If that slot is
            // taken, confirm/success treat it as incomplete until a free tap.
            autoTriedRef.current = `${m.id}:${dayIdx}:${recommended}`;
            onChange({ dryerId: m.id, hour: recommended });
          } else {
            void loadSlots(m.id, dayIdx);
          }
        }}
      />
    </div>
  );
}
