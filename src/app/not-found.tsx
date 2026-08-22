"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DeviceFrame } from "@/components/shell";
import { FieldButton, Phone } from "@/components/ui";

export default function NotFound() {
  const path = usePathname();
  return (
    <DeviceFrame>
      <Phone>
        <div className="flex min-h-full flex-col px-6 pb-8 pt-[76px]">
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-white">
            That page is not here
          </h1>
          <p className="mt-2.5 font-mono text-[13px] text-white/55">{path}</p>
          <div className="mt-auto flex flex-col gap-2.5">
            <Link href="/home">
              <FieldButton variant="white" className="w-full">
                Home
              </FieldButton>
            </Link>
            <Link href="/demo">
              <FieldButton variant="ghost" className="w-full">
                Demo gallery
              </FieldButton>
            </Link>
          </div>
        </div>
      </Phone>
    </DeviceFrame>
  );
}
