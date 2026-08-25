"use client";

import { AuthRouteTransition } from "@/components/auth-route-transition";
import { AuthGate } from "@/components/shell";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <AuthRouteTransition>{children}</AuthRouteTransition>
    </AuthGate>
  );
}
