"use client";

import { AwaitSearch } from "@/components/suspense";
import { ExchangeComposeScreen } from "@/features/confirm-screens";

export default function Page() {
  return (
    <AwaitSearch>
      <ExchangeComposeScreen />
    </AwaitSearch>
  );
}
