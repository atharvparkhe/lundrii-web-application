"use client";

import { ConfirmSkeleton } from "@/components/skeleton";
import { AwaitSearch } from "@/components/suspense";
import { ExchangeComposeScreen } from "@/features/confirm-screens";

export default function Page() {
  return (
    <AwaitSearch fallback={<ConfirmSkeleton />}>
      <ExchangeComposeScreen />
    </AwaitSearch>
  );
}
