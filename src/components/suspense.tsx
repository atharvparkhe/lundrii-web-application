"use client";

import { Suspense, type ReactNode } from "react";

export function AwaitSearch({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
