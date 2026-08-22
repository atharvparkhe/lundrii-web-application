"use client";

import { AwaitSearch } from "@/components/suspense";
import { DryerScreen } from "@/features/confirm-screens";

export default function Page() {
  return (
    <AwaitSearch>
      <DryerScreen />
    </AwaitSearch>
  );
}
