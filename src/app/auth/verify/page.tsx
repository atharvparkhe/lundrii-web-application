"use client";

import { AwaitSearch } from "@/components/suspense";
import { VerifyEmailScreen } from "@/features/auth-screens";

export default function Page() {
  return (
    <AwaitSearch>
      <VerifyEmailScreen />
    </AwaitSearch>
  );
}
