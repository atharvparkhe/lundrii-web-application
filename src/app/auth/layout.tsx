"use client";

import { AuthGate } from "@/components/shell";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
