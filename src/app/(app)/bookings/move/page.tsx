"use client";

import { AwaitSearch } from "@/components/suspense";
import { MoveBookingScreen } from "@/features/bookings-screens";

export default function Page() {
  return (
    <AwaitSearch>
      <MoveBookingScreen />
    </AwaitSearch>
  );
}
