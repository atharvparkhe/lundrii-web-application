import type { Metadata } from "next";
import { DeviceFrame } from "@/components/shell";
import { Phone } from "@/components/ui";

export const metadata: Metadata = {
  title: "Offline · Lundrii",
};

/**
 * Served by the service worker when a navigation fails and nothing for that
 * URL is cached. Deliberately static — it has to render with no network and
 * no store behind it.
 */
export default function OfflinePage() {
  return (
    <DeviceFrame>
      <Phone>
        <div className="flex min-h-full flex-col px-6 pb-8 pt-[76px]">
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-white">
            You&apos;re offline
          </h1>
          <p className="mt-2.5 text-[14px] leading-relaxed text-white/60">
            Lundrii needs a connection to show live machine status. Your booked
            slots are still yours — they&apos;ll be here when you reconnect.
          </p>
        </div>
      </Phone>
    </DeviceFrame>
  );
}
