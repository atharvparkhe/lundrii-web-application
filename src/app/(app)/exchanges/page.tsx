"use client";

import { AwaitSearch } from "@/components/suspense";
import { ExchangesInboxScreen } from "@/features/exchanges-screens";

export default function Page() {
  return (
    <AwaitSearch>
      <ExchangesInboxScreen />
    </AwaitSearch>
  );
}
