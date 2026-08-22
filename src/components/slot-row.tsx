"use client";

import { padHour, slotStateLabel } from "@/lib/format";
import type { MachineKind, Slot, SlotState } from "@/lib/types";

export function slotChrome(state: SlotState, kind: MachineKind = "washer"): string {
  const free =
    kind === "dryer"
      ? "border-[1.5px] border-dryer-amber/34 bg-dryer-amber/8 text-navy"
      : "border-[1.5px] border-success/34 bg-success/8 text-navy";
  const running =
    kind === "dryer"
      ? "border-[1.5px] border-dryer-amber bg-dryer-amber text-white"
      : "border-[1.5px] border-success bg-success text-white";
  switch (state) {
    case "free":
      return free;
    case "mine":
      return "border-[1.5px] border-navy bg-navy text-white";
    case "taken":
      return "border-[1.5px] border-transparent bg-navy/4 text-navy";
    case "running":
      return running;
    case "blocked":
      return "border-[1.5px] border-warn-amber/25 bg-[rgba(201,138,18,.08)] text-navy";
    case "offline":
      return "border-[1.5px] border-transparent bg-navy/[0.03] text-navy opacity-50";
    case "past":
      return "border-[1.5px] border-transparent bg-navy/[0.03] text-navy opacity-45";
    default:
      return "border-[1.5px] border-transparent bg-navy/4 text-navy";
  }
}

/** Action chips only when the student can book. Guests just read the schedule. */
export function slotCta(
  state: SlotState,
  kind: MachineKind = "washer",
): { label: string; fg: string; bg: string } | null {
  const ac = kind === "dryer" ? "#E08A16" : "#12A45F";
  switch (state) {
    case "free":
      return { label: "Book", fg: "#fff", bg: ac };
    case "mine":
      return { label: "Manage", fg: "#fff", bg: "rgba(255,255,255,.2)" };
    case "taken":
    case "running":
      return {
        label: "Ask for it",
        fg: state === "running" ? ac : "#0A1533",
        bg: state === "running" ? "#fff" : "rgba(10,21,51,.07)",
      };
    case "blocked":
      return { label: "Why?", fg: "#8A5C05", bg: "rgba(201,138,18,.14)" };
    default:
      return null;
  }
}

function displayLabel(slot: Slot): string {
  if (slot.state === "taken") {
    if (slot.label && slot.label !== "Reserved") return slot.label;
    return "Taken";
  }
  return slot.label ?? slotStateLabel(slot.state);
}

export function SlotRow({
  slot,
  kind = "washer",
  canBook = false,
  onSelect,
}: {
  slot: Slot;
  kind?: MachineKind;
  canBook?: boolean;
  onSelect?: (slot: Slot) => void;
}) {
  const cta = canBook ? slotCta(slot.state, kind) : null;
  const rowClass = `flex w-full items-center gap-3 rounded-2xl px-3.5 py-[11px] text-left ${slotChrome(slot.state, kind)}`;
  const body = (
    <>
      {slot.state === "running" ? (
        <span
          className="h-[7px] w-[7px] flex-none rounded-full bg-white"
          style={{ animation: "breathe 1.4s ease-in-out infinite" }}
        />
      ) : null}
      <div className="w-[52px] text-[13.5px] font-[650] tabular-nums">
        {padHour(slot.hour)}:00
      </div>
      <div className="flex-1 text-[12.5px] opacity-70">{displayLabel(slot)}</div>
      {cta ? (
        <span
          className="rounded-[13px] px-[11px] py-[5px] text-[12px] font-[650]"
          style={{ color: cta.fg, background: cta.bg }}
        >
          {cta.label}
        </span>
      ) : null}
    </>
  );

  if (!canBook || !onSelect) {
    return <div className={rowClass}>{body}</div>;
  }

  return (
    <button type="button" onClick={() => onSelect(slot)} className={rowClass}>
      {body}
    </button>
  );
}
