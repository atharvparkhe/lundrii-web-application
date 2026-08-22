"use client";

import { AwaitSearch } from "@/components/suspense";
import { SuccessScreen } from "@/features/confirm-screens";

export default function Page() {
  return (
    <AwaitSearch>
      <SuccessScreen />
    </AwaitSearch>
  );
}
