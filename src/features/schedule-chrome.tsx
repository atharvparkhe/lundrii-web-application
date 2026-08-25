"use client";

import { Overlay, Sheet, SheetScroll } from "@/components/ui";
import type { MockDay } from "@/lib/days";
import { machineFloor } from "@/lib/format";
import type { Machine, MachineKind } from "@/lib/types";
import { useEffect, useRef } from "react";

export function scheduleAccent(kind: MachineKind): string {
  return kind === "dryer" ? "#E08A16" : "#12A45F";
}

export function HostelChip({
  name,
  onClick,
}: {
  name: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-[7px] rounded-[20px] border border-white/24 bg-white/16 px-3.5 py-[9px] text-[12.5px] font-semibold text-white"
    >
      {name.trim() || "Choose hostel"}
      <span className="text-[9px] opacity-60">▼</span>
    </button>
  );
}

export function KindToggle({
  kind,
  onChange,
}: {
  kind: MachineKind;
  onChange: (kind: MachineKind) => void;
}) {
  return (
    <div className="flex rounded-[19px] border border-white/20 bg-white/14 p-[3px]">
      {(["washer", "dryer"] as MachineKind[]).map((k) => {
        const on = kind === k;
        return (
          <button
            key={k}
            type="button"
            onClick={() => onChange(k)}
            className={`rounded-2xl px-[13px] py-[7px] text-[12.5px] font-semibold transition-colors ${
              on
                ? k === "dryer"
                  ? "bg-white text-dryer-ink"
                  : "bg-white text-navy"
                : "text-white/75"
            }`}
          >
            {k === "washer" ? "Washers" : "Dryers"}
          </button>
        );
      })}
    </div>
  );
}

export function FloorTrigger({
  machine,
  onClick,
}: {
  machine: Machine | null;
  kind: MachineKind;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!machine}
      className="flex w-full items-center justify-between rounded-[18px] border border-white/20 bg-white/14 px-[15px] py-[11px] text-left disabled:opacity-50"
    >
      <div>
        <div className="text-[10px] font-semibold tracking-[0.06em] text-white/55">
          MACHINE
        </div>
        <div className="mt-0.5 text-[14.5px] font-[650] text-white">
          {machine?.name ?? "No machines yet"}
        </div>
      </div>
      <span className="text-[9px] text-white opacity-60">▼</span>
    </button>
  );
}

export function FloorRow({
  machine,
  kind,
  selected,
  onClick,
}: {
  machine: Machine;
  kind: MachineKind;
  selected?: boolean;
  onClick: () => void;
}) {
  const selectedBg =
    kind === "dryer" ? "bg-dryer-amber/8" : "bg-success/8";
  const selectedBorder =
    kind === "dryer" ? "border-dryer-amber/42" : "border-success/42";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 rounded-[20px] border-[1.5px] px-4 py-[15px] text-left ${
        selected
          ? `${selectedBg} ${selectedBorder}`
          : "border-transparent bg-navy/4"
      } ${machine.status === "offline" ? "opacity-60" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold tracking-[0.06em] text-navy/45">
          FLOOR
        </div>
        <div className="mt-0.5 text-[15px] font-[650]">{machine.name}</div>
        <div className="mt-0.5 text-[12px] text-navy/50">{machine.subtitle}</div>
      </div>
    </button>
  );
}

export function FloorPicker({
  open,
  onClose,
  hostelName,
  machines,
  selectedId,
  kind,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  hostelName: string;
  machines: Machine[];
  selectedId: string | null;
  kind: MachineKind;
  onPick: (machine: Machine) => void;
}) {
  return (
    <Overlay open={open} onClose={onClose}>
      <Sheet>
        <div className="shrink-0">
          <div className="text-[20px] font-bold tracking-[-0.02em]">Choose a machine</div>
          <p className="mt-1.5 text-[13px] leading-snug text-navy/50">
            {hostelName} · only machines in this hostel.
          </p>
        </div>
        <SheetScroll className="mt-4">
          <div className="flex flex-col gap-[9px] pb-1">
            {machines.map((m) => (
              <FloorRow
                key={m.id}
                machine={m}
                kind={kind}
                selected={m.id === selectedId}
                onClick={() => onPick(m)}
              />
            ))}
          </div>
        </SheetScroll>
      </Sheet>
    </Overlay>
  );
}

export function DayStrip({
  days,
  dayIdx,
  onPick,
}: {
  days: Pick<MockDay, "dow" | "dd" | "fullLabel">[];
  dayIdx: number;
  onPick: (index: number) => void;
}) {
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, [dayIdx]);

  return (
    <div className="min-w-0 snap-x snap-mandatory overflow-x-auto overscroll-x-contain px-5 pt-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max gap-2">
        {days.map((d, i) => {
          const on = dayIdx === i;
          return (
            <button
              key={d.fullLabel}
              ref={on ? selectedRef : undefined}
              type="button"
              onClick={() => onPick(i)}
              className={`w-14 shrink-0 snap-start rounded-[18px] border py-2 text-center ${
                on
                  ? "border-white bg-white text-navy"
                  : "border-white/20 bg-white/14 text-white"
              }`}
            >
              <div
                className={`text-[10px] font-semibold ${
                  on ? "text-navy/50" : "text-white/60"
                }`}
              >
                {d.dow}
              </div>
              <div className="text-base font-bold tracking-[-0.02em]">{d.dd}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SlotLegend({
  openCount,
  pastCount,
  accent,
}: {
  openCount: number;
  pastCount: number;
  accent: string;
}) {
  const note = pastCount
    ? `${pastCount} earlier hours have passed`
    : "Full day ahead";
  return (
    <div className="mb-[11px] flex items-center justify-between gap-2 text-[12px] text-navy/45">
      <span>
        {openCount} open · {note}
      </span>
      <span className="flex gap-[9px] text-[10.5px]">
        <span className="flex items-center gap-1">
          <i
            className="inline-block h-2 w-2 rounded-[3px]"
            style={{ background: accent }}
          />
          Free
        </span>
        <span className="flex items-center gap-1">
          <i className="inline-block h-2 w-2 rounded-[3px] bg-navy/20" />
          Taken
        </span>
        <span className="flex items-center gap-1">
          <i className="inline-block h-2 w-2 rounded-[3px] bg-navy" />
          Yours
        </span>
      </span>
    </div>
  );
}

export function pickMachineForFloor(
  machines: Machine[],
  floor: string,
  preferredId?: string | null,
): Machine | null {
  const onFloor = floor
    ? machines.filter((m) => machineFloor(m.name) === floor)
    : machines;
  const pool = onFloor.length ? onFloor : machines;
  return pool.find((m) => m.id === preferredId) ?? pool[0] ?? null;
}
