"use client";

import { type ReactNode } from "react";
import { LundriiProvider } from "@/store/lundrii-store";

export function Providers({ children }: { children: ReactNode }) {
  return <LundriiProvider>{children}</LundriiProvider>;
}
