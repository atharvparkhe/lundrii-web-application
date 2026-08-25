"use client";

import { AuthRouteTransition } from "@/components/auth-route-transition";
import { AuthGate } from "@/components/shell";
import { AwaitSearch } from "@/components/suspense";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <AuthRouteTransition>
        <AwaitSearch>{children}</AwaitSearch>
      </AuthRouteTransition>
    </AuthGate>
  );
}
