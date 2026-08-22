"use client";

import { AwaitSearch } from "@/components/suspense";
import { ResetPasswordScreen } from "@/features/auth-screens";

export default function Page() {
  return (
    <AwaitSearch>
      <ResetPasswordScreen />
    </AwaitSearch>
  );
}
