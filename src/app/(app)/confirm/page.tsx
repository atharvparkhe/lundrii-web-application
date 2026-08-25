"use client";

import { ConfirmSkeleton } from "@/components/skeleton";
import { AwaitSearch } from "@/components/suspense";
import { ConfirmScreen } from "@/features/confirm-screens";

export default function Page() {
  return (
    <AwaitSearch fallback={<ConfirmSkeleton />}>
      <ConfirmScreen />
    </AwaitSearch>
  );
}
