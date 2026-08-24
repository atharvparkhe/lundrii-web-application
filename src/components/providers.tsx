"use client";

import { type ReactNode } from "react";
import { Mixpanel } from "@/components/mixpanel";
import { LundriiProvider } from "@/store/lundrii-store";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LundriiProvider>
      {children}
      <Mixpanel />
    </LundriiProvider>
  );
}
