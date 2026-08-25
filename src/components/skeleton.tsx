"use client";

import { Phone, WhiteSheet } from "@/components/ui";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cx("animate-pulse rounded-md bg-navy/8", className)}
    />
  );
}

export function SkeletonCircle({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cx("animate-pulse rounded-full bg-navy/8", className)}
    />
  );
}

/** Slot list row: time · label · CTA, matching SlotRow density. */
export function SkeletonSlotRow() {
  return (
    <div className="flex w-full items-center gap-3 rounded-2xl bg-navy/4 px-3.5 py-[11px]">
      <Skeleton className="h-[14px] w-[52px]" />
      <Skeleton className="h-[13px] flex-1" />
      <Skeleton className="h-[26px] w-[52px] rounded-[13px]" />
    </div>
  );
}

function HeaderBackSkeleton({ titleWidth = "w-24" }: { titleWidth?: string }) {
  return (
    <div className="flex items-center justify-between px-5 pt-14">
      <SkeletonCircle className="h-9 w-9 bg-white/20" />
      <Skeleton className={cx("h-4 bg-white/20", titleWidth)} />
      <div className="h-9 w-9 shrink-0" />
    </div>
  );
}

function SheetRowSkeleton({
  labelWidth = "w-[132px]",
  valueWidth = "w-[160px]",
}: {
  labelWidth?: string;
  valueWidth?: string;
}) {
  return (
    <div className="flex w-full items-center justify-between rounded-[20px] bg-navy/4 px-4 py-[15px]">
      <div className="space-y-1.5">
        <Skeleton className={cx("h-[15px]", labelWidth)} />
        <Skeleton className={cx("h-3", valueWidth)} />
      </div>
      <Skeleton className="h-4 w-4 rounded-full" />
    </div>
  );
}

function BookingCardSkeleton() {
  return (
    <div className="rounded-[22px] bg-navy/4 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-[22px] w-14 rounded-xl" />
      </div>
      <Skeleton className="mt-2 h-[25px] w-[180px]" />
      <Skeleton className="mt-1.5 h-[14px] w-[140px]" />
      <div className="mt-3.5 flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-2xl" />
        <Skeleton className="h-10 flex-1 rounded-2xl" />
        <Skeleton className="h-10 flex-1 rounded-2xl" />
      </div>
    </div>
  );
}

function HomeBookingRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-[18px] bg-navy/4 px-3.5 py-[13px]">
      <Skeleton className="h-11 w-11 rounded-[14px]" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-[15px] w-[55%]" />
        <Skeleton className="h-3 w-[42%]" />
      </div>
      <Skeleton className="h-7 w-[62px] rounded-[14px]" />
    </div>
  );
}

function TicketCardSkeleton() {
  return (
    <div className="rounded-[22px] border border-navy/10 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-[22px] w-[72px] rounded-xl" />
      </div>
      <Skeleton className="mt-[9px] h-[15px] w-[70%]" />
      <Skeleton className="mt-1 h-[13px] w-[58%]" />
      <div className="mt-3.5 ml-0.5 flex flex-col gap-[11px] border-l-2 border-navy/10 pl-3">
        <div className="space-y-1">
          <Skeleton className="h-[13px] w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-[13px] w-40" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-[13px] w-[72px]" />
          <Skeleton className="h-3 w-[56px]" />
        </div>
      </div>
    </div>
  );
}

function ExchangeCardSkeleton() {
  return (
    <div className="rounded-[20px] bg-navy/4 p-3.5">
      <div className="flex items-center gap-3">
        <SkeletonCircle className="h-11 w-11" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-[15px] w-[70%]" />
          <Skeleton className="h-3 w-[45%]" />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white px-3 py-2">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="mt-1.5 h-[14px] w-[80%]" />
          <Skeleton className="mt-1 h-3 w-[60%]" />
        </div>
        <div className="rounded-2xl bg-white px-3 py-2">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="mt-1.5 h-[14px] w-[80%]" />
          <Skeleton className="mt-1 h-3 w-[60%]" />
        </div>
      </div>
    </div>
  );
}

function QuotaColumnSkeleton() {
  return (
    <div className="min-w-0 flex-1">
      <Skeleton className="h-9 w-[88px] bg-white/20" />
      <Skeleton className="mt-1.5 h-[13px] w-[84px] bg-white/20" />
      <div className="mt-2.5 flex gap-1.5">
        <Skeleton className="h-[7px] flex-1 rounded bg-white/20" />
        <Skeleton className="h-[7px] flex-1 rounded bg-white/20" />
        <Skeleton className="h-[7px] flex-1 rounded bg-white/20" />
      </div>
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <Phone>
      <div className="flex min-h-full flex-col">
        <div className="flex-1 px-[22px] pt-[58px] pb-2">
          <div className="flex items-center gap-2.5">
            <SkeletonCircle className="h-[38px] w-[38px] bg-white/20" />
            <div className="space-y-1.5">
              <Skeleton className="h-[11px] w-[92px] bg-white/20" />
              <Skeleton className="h-[14px] w-[120px] bg-white/20" />
            </div>
          </div>
          <div className="flex flex-col items-center pt-[22px]">
            <Skeleton className="h-[14px] w-[148px] bg-white/20" />
            <Skeleton className="mt-1 h-[74px] w-[168px] rounded-2xl bg-white/20" />
          </div>
        </div>
        <WhiteSheet
          grow={false}
          className="mt-auto h-[342px] shrink-0 overflow-y-auto px-5 pb-28 pt-5"
        >
          <div className="flex items-baseline justify-between">
            <Skeleton className="h-[18px] w-[132px]" />
            <Skeleton className="h-[13px] w-[52px]" />
          </div>
          <div className="mt-3 flex flex-col gap-2.5">
            <HomeBookingRowSkeleton />
            <HomeBookingRowSkeleton />
          </div>
        </WhiteSheet>
      </div>
    </Phone>
  );
}

export function BookSkeleton() {
  return (
    <Phone>
      <div className="flex h-full min-h-full min-w-0 flex-col">
        <div className="px-[22px] pt-[56px]">
          <Skeleton className="h-8 w-[168px] bg-white/20" />
        </div>
        <div className="flex items-center gap-2 px-5 pt-4">
          <Skeleton className="h-[38px] w-[118px] rounded-[20px] bg-white/20" />
          <Skeleton className="h-[38px] w-[168px] rounded-[19px] bg-white/20" />
        </div>
        <div className="px-5 pt-2.5">
          <Skeleton className="h-[54px] w-full rounded-[18px] bg-white/20" />
        </div>
        <div className="flex gap-2 overflow-hidden px-5 pt-3">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton
              key={i}
              className="h-[52px] w-14 shrink-0 rounded-[18px] bg-white/20"
            />
          ))}
        </div>
        <WhiteSheet className="mt-3 px-[18px] pb-[var(--safe-bottom)] pt-4">
          <div className="mb-[11px] flex items-center justify-between">
            <Skeleton className="h-3 w-[140px]" />
            <Skeleton className="h-3 w-[108px]" />
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-[7px] overflow-y-auto pb-28">
            {Array.from({ length: 8 }, (_, i) => (
              <SkeletonSlotRow key={i} />
            ))}
          </div>
        </WhiteSheet>
      </div>
    </Phone>
  );
}

export function BookingsSkeleton() {
  return (
    <Phone variant="compact">
      <div className="flex min-h-full flex-col">
        <div className="px-[22px] pt-[58px]">
          <Skeleton className="h-[30px] w-[160px] bg-white/20" />
        </div>
        <div className="px-[22px] pt-[7px]">
          <Skeleton className="h-[14px] w-[220px] bg-white/20" />
        </div>
        <WhiteSheet className="mt-4 px-[18px] pb-[120px] pt-5">
          <div className="flex flex-col gap-3">
            <BookingCardSkeleton />
            <BookingCardSkeleton />
          </div>
        </WhiteSheet>
      </div>
    </Phone>
  );
}

export function ProfileSkeleton() {
  return (
    <Phone>
      <div className="flex min-h-full flex-col">
        <div className="flex items-center gap-3.5 px-[22px] pt-[62px]">
          <SkeletonCircle className="h-[58px] w-[58px] bg-white/20" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-[21px] w-[140px] bg-white/20" />
            <Skeleton className="h-[13px] w-[180px] bg-white/20" />
            <Skeleton className="h-[13px] w-[120px] bg-white/20" />
          </div>
        </div>
        <div className="mx-5 mt-[22px] rounded-[26px] border border-white/28 bg-white/18 p-[18px]">
          <div className="flex items-baseline justify-between">
            <Skeleton className="h-[11px] w-20 bg-white/20" />
            <Skeleton className="h-3 w-24 bg-white/20" />
          </div>
          <div className="mt-1.5 flex gap-5">
            <QuotaColumnSkeleton />
            <div className="w-px shrink-0 self-stretch bg-white/25" aria-hidden />
            <QuotaColumnSkeleton />
          </div>
        </div>
        <WhiteSheet className="mt-3 min-h-0 flex-1 overflow-hidden px-5 pb-28 pt-[22px]">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-[108px] rounded-[13px]" />
          </div>
          <Skeleton className="mt-[11px] h-3 w-full" />
          <Skeleton className="mt-1.5 h-3 w-[85%]" />
          <div className="mt-5 flex flex-col gap-2">
            <SheetRowSkeleton
              labelWidth="w-[96px]"
              valueWidth="w-[168px]"
            />
            <SheetRowSkeleton
              labelWidth="w-[108px]"
              valueWidth="w-[120px]"
            />
          </div>
          <div className="mt-8 flex flex-col gap-2">
            <SheetRowSkeleton
              labelWidth="w-[180px]"
              valueWidth="w-[128px]"
            />
            <SheetRowSkeleton
              labelWidth="w-[148px]"
              valueWidth="w-[140px]"
            />
            <Skeleton className="mt-[11px] h-[50px] w-full rounded-[25px]" />
          </div>
        </WhiteSheet>
      </div>
    </Phone>
  );
}

export function TicketsListSkeleton() {
  return (
    <Phone variant="compact">
      <HeaderBackSkeleton titleWidth="w-[108px]" />
      <WhiteSheet className="mt-4 px-[18px] pb-8 pt-5">
        <div className="flex flex-col gap-3">
          <TicketCardSkeleton />
          <TicketCardSkeleton />
        </div>
        <Skeleton className="mt-5 h-[50px] w-full rounded-[25px]" />
      </WhiteSheet>
    </Phone>
  );
}

export function TicketDetailSkeleton() {
  return (
    <Phone variant="compact">
      <HeaderBackSkeleton titleWidth="w-20" />
      <WhiteSheet className="mt-4 px-5 pb-8 pt-5">
        <Skeleton className="h-[22px] w-[76px] rounded-xl" />
        <Skeleton className="mt-[9px] h-[22px] w-[75%]" />
        <Skeleton className="mt-1 h-[13px] w-[62%]" />
        <Skeleton className="mt-4 h-[14px] w-full" />
        <Skeleton className="mt-1.5 h-[14px] w-[92%]" />
        <Skeleton className="mt-1.5 h-[14px] w-[70%]" />
        <div className="mt-3.5 flex flex-col gap-[11px] border-l-2 border-navy/10 pl-3">
          <div className="space-y-1">
            <Skeleton className="h-[13px] w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-[13px] w-44" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-[13px] w-[72px]" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
      </WhiteSheet>
    </Phone>
  );
}

export function ExchangesSkeleton() {
  return (
    <Phone variant="compact">
      <div className="flex min-h-full flex-col">
        <HeaderBackSkeleton titleWidth="w-[92px]" />
        <div className="px-5 pt-4">
          <Skeleton className="h-[46px] w-full rounded-[22px] bg-white/20" />
        </div>
        <WhiteSheet className="mt-4 px-5 pb-8 pt-5">
          <div className="flex flex-col gap-2.5">
            <ExchangeCardSkeleton />
            <ExchangeCardSkeleton />
          </div>
        </WhiteSheet>
      </div>
    </Phone>
  );
}

export function ConfirmSkeleton() {
  return (
    <Phone>
      <div className="relative flex min-h-full flex-col pb-[150px]">
        <HeaderBackSkeleton titleWidth="w-[72px]" />
        <div className="flex flex-col items-center px-6 pt-[26px]">
          <Skeleton className="h-[14px] w-[140px] bg-white/20" />
          <Skeleton className="mt-1 h-[46px] w-[240px] rounded-2xl bg-white/20" />
          <Skeleton className="mt-2 h-[15px] w-[160px] bg-white/20" />
        </div>
        <div className="mx-5 mt-[26px] rounded-[26px] border border-white/26 bg-white/16 p-[18px]">
          <div className="flex justify-between py-1">
            <Skeleton className="h-[13px] w-14 bg-white/20" />
            <Skeleton className="h-[13px] w-24 bg-white/20" />
          </div>
          <div className="flex justify-between py-1">
            <Skeleton className="h-[13px] w-16 bg-white/20" />
            <Skeleton className="h-[13px] w-14 bg-white/20" />
          </div>
          <div className="flex justify-between py-1">
            <Skeleton className="h-[13px] w-[148px] bg-white/20" />
            <Skeleton className="h-[13px] w-[88px] bg-white/20" />
          </div>
        </div>
        <div className="mx-5 mt-[11px] flex items-center gap-[13px] rounded-[24px] border border-white/20 bg-white/10 px-[17px] py-[15px]">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-[15px] w-[70%] bg-white/20" />
            <Skeleton className="h-[13px] w-[50%] bg-white/20" />
          </div>
          <Skeleton className="h-7 w-12 rounded-full bg-white/20" />
        </div>
        <div className="absolute inset-x-5 bottom-11">
          <Skeleton className="h-[70px] w-full rounded-[35px] bg-white/20" />
          <div className="mt-3 flex justify-center">
            <Skeleton className="h-3 w-28 bg-white/20" />
          </div>
        </div>
      </div>
    </Phone>
  );
}

function normalizePath(pathname: string): string {
  const raw = pathname.split("?")[0].split("#")[0];
  return raw.replace(/\/+$/, "") || "/";
}

export function RouteSkeleton({ pathname }: { pathname: string }) {
  const path = normalizePath(pathname);

  if (path === "/" || path === "/home") return <HomeSkeleton />;
  if (path === "/book" || path.startsWith("/book/")) return <BookSkeleton />;
  if (path === "/bookings" || path.startsWith("/bookings/")) {
    return <BookingsSkeleton />;
  }
  if (path === "/profile" || path.startsWith("/profile/")) {
    return <ProfileSkeleton />;
  }
  if (path === "/tickets") return <TicketsListSkeleton />;
  if (path.startsWith("/tickets/")) {
    const seg = path.slice("/tickets/".length).split("/")[0];
    if (seg === "report" || seg === "raised") return <TicketsListSkeleton />;
    return <TicketDetailSkeleton />;
  }
  if (path === "/exchanges" || path.startsWith("/exchanges/")) {
    return <ExchangesSkeleton />;
  }
  if (
    path === "/confirm" ||
    path === "/dryer" ||
    path === "/success" ||
    path === "/exchange"
  ) {
    return <ConfirmSkeleton />;
  }
  return <BookSkeleton />;
}
