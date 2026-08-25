"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AppRouteTransition } from "./app-route-transition";
import { IconBook, IconBookings, IconHome, IconProfile } from "./icons";
import { RouteSkeleton } from "@/components/skeleton";
import { ToastHost } from "./ui";
import { useLundrii } from "@/store/lundrii-store";

const TABS = [
  { href: "/", label: "Home", icon: IconHome },
  { href: "/book", label: "Book", icon: IconBook },
  { href: "/bookings", label: "Bookings", icon: IconBookings },
  { href: "/profile", label: "Profile", icon: IconProfile },
] as const;

/**
 * The schedule is readable by anyone — looking is open, booking is not.
 * Guests land on /book with no tab bar. Signed-in students get the 4 tabs.
 */
const PUBLIC_PATHS = ["/book"];

function normalize(path: string): string {
  return path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;
}

export function isPublicPath(path: string): boolean {
  const p = normalize(path);
  return PUBLIC_PATHS.includes(p) || p.startsWith("/book/");
}

function isTabRoute(path: string, href: string): boolean {
  if (href === "/") return path === "/";
  return path === href || path.startsWith(`${href}/`);
}

/** Tab bar is signed-in chrome on the four root screens. */
export function shouldShowTabs(path: string, signedIn = false): boolean {
  if (!signedIn) return false;
  const p = normalize(path);
  return TABS.some((t) => isTabRoute(p, t.href));
}

function tabIndex(path: string): number {
  if (path.startsWith("/bookings")) return 2;
  if (path.startsWith("/book")) return 1;
  if (path.startsWith("/profile")) return 3;
  return 0;
}

export function DeviceFrame({ children }: { children: ReactNode }) {
  return <div className="app-frame">{children}</div>;
}

function TabBar({ active }: { active: number }) {
  const { signedIn, setPending } = useLundrii();
  const router = useRouter();

  function open(href: string) {
    if (signedIn || isPublicPath(href)) {
      router.push(href);
      return;
    }
    setPending({ kind: "screen", href });
    router.push("/auth/sign-in");
  }

  return (
    <div className="app-column-inset pointer-events-none absolute bottom-[calc(30px+var(--safe-bottom))] z-20 px-4">
      <nav className="frost-tab pointer-events-auto flex h-16 items-stretch rounded-[32px]">
        {TABS.map((tab, i) => {
          const Icon = tab.icon;
          const on = active === i;
          return (
            <button
              key={tab.href}
              type="button"
              onClick={() => open(tab.href)}
              className="flex flex-1 flex-col items-center justify-center gap-[5px]"
            >
              <Icon selected={on} />
              <span
                className={`text-[9.5px] font-semibold ${
                  on ? "text-navy" : "text-navy/42"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { signedIn, hydrated } = useLundrii();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = isPublicPath(pathname);
  const showTabs = shouldShowTabs(pathname, signedIn);
  const active = tabIndex(pathname);

  // A signed-out visitor sitting on a gated screen either followed a stale
  // link or just signed out. Both belong on the public schedule rather than at
  // a sign-in wall — the deliberate routes to sign-in set a pending intent and
  // go there themselves.
  useEffect(() => {
    if (!hydrated || signedIn || isPublic) return;
    router.replace("/book");
  }, [hydrated, signedIn, isPublic, router]);

  if (!hydrated || (!signedIn && !isPublic)) {
    return (
      <DeviceFrame>
        <RouteSkeleton pathname={pathname} />
      </DeviceFrame>
    );
  }

  return (
    <DeviceFrame>
      <AppRouteTransition>{children}</AppRouteTransition>
      {showTabs ? <TabBar active={active} /> : null}
      <ToastHost />
    </DeviceFrame>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  return (
    <DeviceFrame>
      {children}
      <ToastHost />
    </DeviceFrame>
  );
}
