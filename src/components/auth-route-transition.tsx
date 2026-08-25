"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

const AUTH_ROUTE_ORDER: Record<string, number> = {
  "/auth/sign-in": 0,
  "/auth/sign-up": 1,
  "/auth/verify": 2,
  "/auth/forgot": 3,
  "/auth/reset": 4,
  "/auth/domain-rejected": 5,
};

function routeIndex(pathname: string): number {
  return AUTH_ROUTE_ORDER[pathname] ?? 0;
}

export function AuthRouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  useLayoutEffect(() => {
    if (prevPathRef.current === pathname) return;
    const prevIdx = routeIndex(prevPathRef.current);
    const currIdx = routeIndex(pathname);
    setDirection(currIdx >= prevIdx ? "forward" : "back");
    prevPathRef.current = pathname;
  }, [pathname]);

  const enterClass =
    direction === "forward"
      ? "anim-auth-enter-forward"
      : "anim-auth-enter-back";

  return (
    <div key={pathname} className={`min-h-full ${enterClass}`}>
      {children}
    </div>
  );
}
