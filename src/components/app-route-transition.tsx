"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

type Family = "home" | "book" | "bookings" | "profile" | "demo";

type RouteInfo = {
  family: Family | null;
  depth: number;
  tabRoot: boolean;
};

const TAB_ROOTS = new Set(["/", "/book", "/bookings", "/profile"]);

function normalize(path: string): string {
  return path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;
}

function routeInfo(pathname: string): RouteInfo {
  const p = normalize(pathname);
  const tabRoot = TAB_ROOTS.has(p);

  if (p === "/") return { family: "home", depth: 0, tabRoot };

  if (p === "/book") return { family: "book", depth: 0, tabRoot };
  if (/^\/book\/[^/]+\/day$/.test(p)) return { family: "book", depth: 1, tabRoot };
  if (p === "/confirm") return { family: "book", depth: 2, tabRoot };
  if (p === "/dryer") return { family: "book", depth: 3, tabRoot };
  if (p === "/success") return { family: "book", depth: 4, tabRoot };
  if (p === "/exchange") return { family: "book", depth: 2, tabRoot };

  if (p === "/bookings") return { family: "bookings", depth: 0, tabRoot };
  if (p === "/bookings/move") return { family: "bookings", depth: 1, tabRoot };
  if (p === "/exchanges") return { family: "bookings", depth: 1, tabRoot };
  if (p === "/exchanges/swap-done") return { family: "bookings", depth: 3, tabRoot };
  if (p === "/exchanges/failed") return { family: "bookings", depth: 2, tabRoot };
  if (/^\/exchanges\/sent\/[^/]+$/.test(p)) {
    return { family: "bookings", depth: 2, tabRoot };
  }
  if (/^\/exchanges\/[^/]+$/.test(p)) {
    return { family: "bookings", depth: 2, tabRoot };
  }

  if (p === "/profile") return { family: "profile", depth: 0, tabRoot };
  if (p === "/profile/edit") return { family: "profile", depth: 1, tabRoot };
  if (p === "/tickets") return { family: "profile", depth: 1, tabRoot };
  if (p === "/tickets/report") return { family: "profile", depth: 2, tabRoot };
  if (p === "/tickets/raised") return { family: "profile", depth: 3, tabRoot };
  if (/^\/tickets\/[^/]+$/.test(p)) return { family: "profile", depth: 2, tabRoot };

  if (p === "/demo") return { family: "demo", depth: 0, tabRoot: false };
  if (p.startsWith("/demo/")) return { family: "demo", depth: 1, tabRoot: false };

  return { family: null, depth: 0, tabRoot };
}

function enterClass(fromPath: string, toPath: string): string {
  const from = routeInfo(fromPath);
  const to = routeInfo(toPath);

  if (from.tabRoot && to.tabRoot) return "anim-tab-fade";
  if (!from.family || !to.family || from.family !== to.family) {
    return "anim-tab-fade";
  }
  if (to.depth > from.depth) return "anim-auth-enter-forward";
  if (to.depth < from.depth) return "anim-auth-enter-back";
  return "anim-tab-fade";
}

export function AppRouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);
  const [animation, setAnimation] = useState("anim-tab-fade");

  useLayoutEffect(() => {
    if (prevPathRef.current === pathname) return;
    setAnimation(enterClass(prevPathRef.current, pathname));
    prevPathRef.current = pathname;
  }, [pathname]);

  return (
    <div key={pathname} className={`min-h-full ${animation}`}>
      {children}
    </div>
  );
}
