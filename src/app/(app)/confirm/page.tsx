"use client";

import { AwaitSearch } from "@/components/suspense";
import { ConfirmScreen } from "@/features/confirm-screens";

export default function Page() {
  return (
    <AwaitSearch>
      <ConfirmScreen />
    </AwaitSearch>
  );
}
