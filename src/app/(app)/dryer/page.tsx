"use client";

import { ConfirmSkeleton } from "@/components/skeleton";
import { AwaitSearch } from "@/components/suspense";
import { DryerScreen } from "@/features/confirm-screens";

export default function Page() {
  return (
    <AwaitSearch fallback={<ConfirmSkeleton />}>
      <DryerScreen />
    </AwaitSearch>
  );
}
