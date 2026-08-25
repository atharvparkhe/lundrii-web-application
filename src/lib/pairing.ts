import { machineFloor } from "./format";
import type { Machine } from "./types";

/** Same-hostel dryers that can be paired; same floor as the washer first. */
export function hostelDryersForWasher(
  machines: Machine[],
  washer: Machine,
): Machine[] {
  const washerFloor = machineFloor(washer.name);
  const sameFloor: Machine[] = [];
  const otherFloors: Machine[] = [];
  for (const machine of machines) {
    if (
      machine.hostelId !== washer.hostelId ||
      machine.kind !== "dryer" ||
      machine.status === "offline"
    ) {
      continue;
    }
    if (machineFloor(machine.name) === washerFloor) {
      sameFloor.push(machine);
    } else {
      otherFloors.push(machine);
    }
  }
  return [...sameFloor, ...otherFloors];
}

export function pickPairedDryer(
  machines: Machine[],
  washer: Machine,
): Machine | null {
  return hostelDryersForWasher(machines, washer)[0] ?? null;
}

export function recommendedDryerHour(washerHour: number): number {
  return (washerHour + 1) % 24;
}
