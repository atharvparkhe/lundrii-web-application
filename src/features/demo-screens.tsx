"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FieldButton,
  GlassCard,
  Phone,
  ScreenHeader,
  StatusChip,
  WhiteSheet,
} from "@/components/ui";
import { useLundrii } from "@/store/lundrii-store";

type Entry = { title: string; blurb: string; path: string };

const RACES: Entry[] = [
  { title: "Confirm race · 2nd Floor A · 10:00", blurb: "Prototype: confirm m2 hour 10 → slot lost modal", path: "/demo/slot-lost" },
  { title: "Dryer race · book both at 14:00", blurb: "Washer sticks · 15:00 dryer taken first", path: "/demo/partial-success" },
  { title: "Cooldown · book 15:00 today", blurb: "Prototype: blocked hours → rule sheet", path: "/demo/rule-blocked" },
  { title: "Late cancel · today 13:00", blurb: "Free window closed · still counts", path: "/demo/late-cancel" },
  { title: "Swap collapsed · Priya cancelled", blurb: "Approve after their slot is gone", path: "/demo/exchange-failed" },
  { title: "Machine released · 4th Floor offline", blurb: "Committee took it out · booking dropped", path: "/demo/machine-offline" },
];

const SHEETS: Entry[] = [
  { title: "Rule blocked", blurb: "Cooldown sheet — which rule, when it lifts", path: "/demo/rule-blocked" },
  { title: "Late cancel", blurb: "Still counts against weekly quota", path: "/demo/late-cancel" },
  { title: "Slot lost", blurb: "Someone booked first", path: "/demo/slot-lost" },
  { title: "Exchange failed", blurb: "Swap collapsed — their slot is gone", path: "/demo/exchange-failed" },
];

const FULL: Entry[] = [
  { title: "All busy", blurb: "0/5 free · record the hour you wanted", path: "/demo/all-busy" },
  { title: "Machine offline", blurb: "Released booking · closest replacements", path: "/demo/machine-offline" },
  { title: "Suspended", blurb: "Desaturated field · browse-only", path: "/demo/suspended" },
  { title: "Partial success", blurb: "Washer booked, dryer taken first", path: "/demo/partial-success" },
  { title: "Offline", blurb: "Stale cache from 09:12", path: "/demo/offline" },
];

const EMPTY: Entry[] = [
  { title: "Empty bookings", blurb: "Nothing booked yet · find a slot", path: "/demo/empty-bookings" },
];

function Section({ label, entries }: { label: string; entries: Entry[] }) {
  return (
    <div className="mb-5">
      <div className="mb-2 text-[11px] font-bold tracking-[0.88px] text-white/50">{label}</div>
      <div className="flex flex-col gap-2">
        {entries.map((e) => (
          <Link key={e.path + e.title} href={e.path} className="rounded-[18px] border border-white/18 bg-white/12 px-4 py-3">
            <div className="text-[14.5px] font-semibold">{e.title}</div>
            <div className="text-[12px] text-white/60">{e.blurb}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function DemoGalleryScreen() {
  return (
    <Phone>
      <ScreenHeader title="Demo edges" backHref="/profile" />
      <div className="px-5 pb-10 pt-4">
        <p className="mb-5 text-[14px] leading-relaxed text-white/70">
          Gallery edge states for UI QA — no backend. CTAs jump into real app routes.
        </p>
        <Section label="RACE TRIGGERS" entries={RACES} />
        <Section label="SHEETS & MODAL" entries={SHEETS} />
        <Section label="FULL-SCREEN STATES" entries={FULL} />
        <Section label="EMPTY" entries={EMPTY} />
      </div>
    </Phone>
  );
}

function EdgeSheet({
  children,
  cta,
  href,
  secondary,
}: {
  children: React.ReactNode;
  cta: string;
  href: string;
  secondary?: { label: string; href: string };
}) {
  return (
    <Phone variant="compact">
      <ScreenHeader title="" backHref="/demo" />
      <div className="mt-auto p-2.5">
        <div className="rounded-[36px] bg-white p-[22px] text-navy">
          {children}
          <Link href={href}>
            <FieldButton variant="navy" className="mt-5 h-[52px] w-full rounded-[26px]">{cta}</FieldButton>
          </Link>
          {secondary ? (
            <Link href={secondary.href}>
              <FieldButton variant="soft" className="mt-2 h-[52px] w-full rounded-[26px]">{secondary.label}</FieldButton>
            </Link>
          ) : null}
        </div>
      </div>
    </Phone>
  );
}

export function RuleBlockedDemo() {
  const app = useLundrii();
  return (
    <EdgeSheet cta="Show open slots" href="/book/m1/day" secondary={{ label: "Not now", href: "/demo" }}>
      <StatusChip label="QUOTA" />
      <h1 className="mt-3 text-[22px] font-bold tracking-[-0.44px]">You&apos;ve used this week&apos;s washes</h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-navy/55">
        Your institute caps washer slots Monday to Sunday. Cancel a booking
        this week, or book again from Monday.
      </p>
      <div className="mt-4 space-y-2 rounded-[20px] bg-navy/4 px-4 py-3 text-[13px]">
        <div className="flex justify-between"><span className="text-navy/50">Weekly quota</span><span className="font-semibold text-dryer-ink">{app.quotaUsed} of {app.quotaLimit} used</span></div>
        <div className="flex justify-between"><span className="text-navy/50">Advance window</span><span className="font-semibold">7 days · fine</span></div>
      </div>
    </EdgeSheet>
  );
}

export function LateCancelDemo() {
  const app = useLundrii();
  return (
    <EdgeSheet cta="Cancel anyway" href="/bookings" secondary={{ label: "Keep the slot", href: "/demo" }}>
      <h1 className="text-[22px] font-bold">This cancellation still counts</h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-navy/55">
        Your slot starts in 3 hours. Free cancellation closed at 07:00, six hours before the slot, so this wash stays on your weekly count.
      </p>
      <div className="mt-4 rounded-[20px] border border-danger/16 bg-danger/7 px-4 py-3.5 text-[13px]">
        <div className="flex justify-between">
          <span className="text-navy/60">Washes used this week</span>
          <span className="font-semibold">{app.quotaUsed} of {app.quotaLimit}</span>
        </div>
        <div className="mt-1 text-danger">Booking cancelled. Still {app.quotaUsed} of {app.quotaLimit} this week.</div>
      </div>
    </EdgeSheet>
  );
}

export function SlotLostDemo() {
  return (
    <EdgeSheet cta="Find another hour" href="/book/m2/day" secondary={{ label: "Ask Rohan for it", href: "/exchange?machineId=m2&hour=10" }}>
      <StatusChip label="TAKEN" tone="danger" />
      <h1 className="mt-3 text-[22px] font-bold">That hour went to someone else</h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-navy/55">
        2nd Floor · A Wing at 10:00 was free when you opened it. Rohan booked it first. You can pick another hour or ask him to swap.
      </p>
    </EdgeSheet>
  );
}

export function ExchangeFailedDemo() {
  return (
    <EdgeSheet cta="Back to inbox" href="/exchanges" secondary={{ label: "Find another slot", href: "/book" }}>
      <StatusChip label="FAILED" tone="danger" />
      <h1 className="mt-3 text-[22px] font-bold">The swap couldn&apos;t go through</h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-navy/55">
        Priya cancelled Friday 18:00 before you approved. Your today 13:00 is unchanged. Both of you were told.
      </p>
    </EdgeSheet>
  );
}

export function AllBusyDemo() {
  return (
    <Phone>
      <ScreenHeader title="Book" backHref="/demo" />
      <div className="px-5 pt-8 text-center">
        <div className="text-[14px] text-white/62">Washers free right now</div>
        <div className="text-[64px] font-bold leading-none">0<span className="text-white/45">/5</span></div>
        <p className="mt-2 text-[14px] text-white/65">Next machine frees at 11:00.</p>
      </div>
      <WhiteSheet className="mt-8 px-5 pb-8 pt-5 text-center">
        <p className="text-[14px] text-navy/55">
          Every washer in this hostel is busy or offline. Record the hour you wanted, or try another hall.
        </p>
        <Link href="/book">
          <FieldButton variant="navy" className="mt-5 w-full">Browse schedule</FieldButton>
        </Link>
      </WhiteSheet>
    </Phone>
  );
}

export function MachineOfflineDemo() {
  return (
    <Phone>
      <ScreenHeader title="4th Floor · B Wing" backHref="/demo" />
      <div className="px-5 pt-6">
        <GlassCard className="p-4">
          <StatusChip label="OFFLINE" tone="coral" />
          <h1 className="mt-3 text-[22px] font-bold">Taken out of service</h1>
          <p className="mt-2 text-[13.5px] text-white/65">
            The committee took this machine offline. Your Fri 19:00 wash was released and the quota was returned.
          </p>
        </GlassCard>
      </div>
      <WhiteSheet className="mt-6 px-5 pb-8 pt-5">
        <div className="text-[15px] font-semibold">Closest replacements</div>
        <Link href="/book/m1/day" className="mt-3 block rounded-[18px] bg-navy/4 px-4 py-3">
          3rd Floor · A Wing · 9 slots open today
        </Link>
        <Link href="/book/m4/day" className="mt-2 block rounded-[18px] bg-navy/4 px-4 py-3">
          Ground Floor · B Wing · 11 slots open today
        </Link>
      </WhiteSheet>
    </Phone>
  );
}

export function SuspendedDemo() {
  const app = useLundrii();
  const router = useRouter();
  return (
    <Phone variant="suspended">
      <ScreenHeader title="Profile" backHref="/demo" />
      <div className="px-5 pt-4">
        <GlassCard className="p-5">
          <StatusChip label="SUSPENDED" tone="coral" />
          <h1 className="mt-3 text-[24px] font-bold leading-snug">Booking is paused until 6 Aug</h1>
          <p className="mt-2 text-[13.5px] text-white/65">
            Applied by the hostel committee after ticket #427. You can still browse history.
          </p>
        </GlassCard>
      </div>
      <WhiteSheet className="mt-6 px-5 pb-8 pt-5">
        <p className="text-[13.5px] text-navy/55">
          Book, move, cancel and exchange are locked. Tickets and past bookings stay available.
        </p>
        <FieldButton
          variant="navy"
          className="mt-5 w-full"
          onClick={() => {
            app.setDemoMode("suspended");
            router.push("/profile");
          }}
        >
          Open profile in this mode
        </FieldButton>
      </WhiteSheet>
    </Phone>
  );
}

export function PartialSuccessDemo() {
  return (
    <Phone>
      <div className="flex min-h-dvh flex-col px-5 pb-8 pt-14">
        <h1 className="text-center text-[28px] font-bold">Washer booked. Dryer taken first.</h1>
        <p className="mt-2 text-center text-[14.5px] text-white/62">
          Your 14:00 wash on 3rd Floor · A Wing is confirmed. The 15:00 dryer went to someone else.
        </p>
        <div className="mt-8 rounded-[20px] border border-white/22 bg-white/14 p-4">
          <div className="font-semibold">Washer · 14:00 · confirmed</div>
          <div className="mt-2 text-white/65">Dryer · 15:00 · lost</div>
        </div>
        <div className="mt-auto flex flex-col gap-2.5">
          <Link href="/book/d1/day"><FieldButton variant="white" className="w-full">Find another dryer</FieldButton></Link>
          <Link href="/bookings"><FieldButton variant="ghost" className="w-full">View bookings</FieldButton></Link>
        </div>
      </div>
    </Phone>
  );
}

export function OfflineDemo() {
  const app = useLundrii();
  const router = useRouter();
  return (
    <Phone>
      <ScreenHeader title="" backHref="/demo" />
      <div className="px-6 pt-8 text-center">
        <h1 className="text-[26px] font-bold">You&apos;re offline</h1>
        <p className="mt-2 text-[14px] text-white/65">
          Showing what we knew at 09:12. Slots may already be gone. Booking needs a connection.
        </p>
      </div>
      <div className="mt-auto px-5 pb-8">
        <FieldButton
          variant="white"
          className="w-full"
          onClick={() => {
            app.setDemoMode("offline");
            router.push("/home");
          }}
        >
          Open home stale
        </FieldButton>
      </div>
    </Phone>
  );
}

export function EmptyBookingsDemo() {
  return (
    <Phone variant="compact">
      <h1 className="px-[22px] pt-3 text-[30px] font-bold">My Bookings</h1>
      <WhiteSheet className="mt-6 px-5 pb-8 pt-8">
        <div className="rounded-[22px] border-[1.5px] border-navy/16 px-[18px] py-[26px] text-center">
          <div className="text-[15px] font-semibold">Nothing booked yet</div>
          <div className="mt-1 text-[12.5px] text-navy/50">Three washes a week are yours.</div>
          <Link href="/book" className="mt-3.5 inline-flex h-11 items-center rounded-full bg-success px-5 text-[14px] font-semibold text-white">
            Find a slot
          </Link>
        </div>
      </WhiteSheet>
    </Phone>
  );
}
