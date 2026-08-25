"use client";

import { BookingsSkeleton } from "@/components/skeleton";
import { AwaitSearch } from "@/components/suspense";
import { MoveBookingScreen } from "@/features/bookings-screens";

export default function Page() {
  return (
    <AwaitSearch fallback={<BookingsSkeleton />}>
      <MoveBookingScreen />
    </AwaitSearch>
  );
}
