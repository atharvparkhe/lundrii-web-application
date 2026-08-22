"use client";

import { Suspense, type ReactNode } from "react";

export function AwaitSearch({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
