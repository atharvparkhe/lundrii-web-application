"use client";

import { ConfirmSkeleton } from "@/components/skeleton";
import { AwaitSearch } from "@/components/suspense";
import { SuccessScreen } from "@/features/confirm-screens";

export default function Page() {
  return (
    <AwaitSearch fallback={<ConfirmSkeleton />}>
      <SuccessScreen />
    </AwaitSearch>
  );
}
