"use client";

import { ExchangesSkeleton } from "@/components/skeleton";
import { AwaitSearch } from "@/components/suspense";
import { ExchangesInboxScreen } from "@/features/exchanges-screens";

export default function Page() {
  return (
    <AwaitSearch fallback={<ExchangesSkeleton />}>
      <ExchangesInboxScreen />
    </AwaitSearch>
  );
}
