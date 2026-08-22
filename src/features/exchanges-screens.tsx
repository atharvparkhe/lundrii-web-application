"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  BackChip,
  CheckCircle,
  FieldButton,
  HourChip,
  Overlay,
  Phone,
  Segmented,
  Sheet,
  WhiteSheet,
} from "@/components/ui";
import { padHour } from "@/lib/format";
import type { ExchangeRequest } from "@/lib/types";
import { useLundrii } from "@/store/lundrii-store";

function ProtoBackHeader({ title, backHref }: { title: string; backHref: string }) {
  return (
    <div className="flex items-center justify-between px-5 pt-14">
      <BackChip href={backHref} />
      <div className="text-[16px] font-semibold text-white">{title}</div>
      <div className="w-9" />
    </div>
  );
}

export function ExchangesInboxScreen() {
  const app = useLundrii();
  const router = useRouter();
  const q = useSearchParams();
  const tab = q.get("tab") === "sent" ? 1 : 0;

  function setTab(i: number) {
    if (i === 1) router.replace("/exchanges?tab=sent");
    else router.replace("/exchanges");
  }

  return (
    <Phone variant="compact">
      <div className="flex min-h-full flex-col">
        <ProtoBackHeader title="Exchanges" backHref="/bookings" />
        <div className="px-5 pt-4">
          <Segmented
            dark
            index={tab}
            onChange={setTab}
            options={[
              { label: "Received", badge: String(app.exchanges.length) },
              { label: "Sent", badge: String(app.sentExchanges.length) },
            ]}
          />
        </div>
        <WhiteSheet className="mt-4 px-5 pb-8 pt-5">
          {tab === 0 ? (
            app.exchanges.length === 0 ? (
              <p className="py-10 text-center text-[14px] text-navy/45">
                No incoming requests. When someone asks, they land here.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {app.exchanges.map((e) => (
                  <Link
                    key={e.id}
                    href={`/exchanges/${e.id}`}
                    className="rounded-[20px] bg-navy/4 p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-[13px] font-bold text-white">
                        {e.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14.5px] font-semibold">{e.title}</div>
                        <div className="text-[12px] text-navy/45">{e.timeLabel}</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                      <div className="rounded-2xl bg-white px-3 py-2">
                        <div className="text-navy/45">They take</div>
                        <div className="font-semibold">{e.theyTake}</div>
                        <div className="text-navy/45">{e.theyTakeSub}</div>
                      </div>
                      <div className="rounded-2xl bg-white px-3 py-2">
                        <div className="text-navy/45">You get</div>
                        <div className="font-semibold">{e.youGet}</div>
                        <div className="text-navy/45">{e.youGetSub}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : app.sentExchanges.length === 0 ? (
            <p className="py-10 text-center text-[14px] text-navy/45">
              Nothing waiting. Offers you send stay here until they&apos;re answered.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {app.sentExchanges.map((s) => (
                <Link
                  key={s.id}
                  href={`/exchanges/sent/${s.id}`}
                  className="rounded-[20px] bg-navy/4 p-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-[13px] font-bold text-white">
                      {s.peerInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14.5px] font-semibold">{s.waitingTitle}</div>
                      <div className="text-[12px] text-navy/45">{s.peerSlotSummary}</div>
                    </div>
                    <span className="rounded-full bg-warn-amber/20 px-2 py-1 text-[11px] font-semibold text-dryer-ink">
                      {s.statusLabel}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </WhiteSheet>
      </div>
    </Phone>
  );
}

export function ExchangeDetailScreen() {
  const app = useLundrii();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const ex = app.exchangeById(id);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState("need_slot");
  const [note, setNote] = useState("");

  if (!ex) {
    return (
      <Phone variant="compact">
        <ProtoBackHeader title="Exchange" backHref="/exchanges" />
        <WhiteSheet className="mt-4 p-5">
          <p className="text-navy/50">This request is no longer here.</p>
          <Link href="/exchanges" className="mt-4 inline-block text-field-blue font-semibold">
            Back to inbox
          </Link>
        </WhiteSheet>
      </Phone>
    );
  }

  const presets = app.rejectPresets.filter((p) => ex.rejectOptionIds.includes(p.id));

  return (
    <Phone variant="compact">
      <ProtoBackHeader title={ex.screenTitle ?? "Request"} backHref="/exchanges" />
      <WhiteSheet className="mt-4 px-5 pb-8 pt-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-white font-bold">
            {ex.initials}
          </div>
          <div>
            <div className="text-[16px] font-semibold">{ex.name}</div>
            <div className="text-[12px] text-navy/45">
              {ex.peerHostel} · {ex.askedAgoLabel}
            </div>
          </div>
        </div>
        {ex.expiresLabel ? (
          <p className="mt-2 text-[12.5px] text-dryer-ink">{ex.expiresLabel}</p>
        ) : null}
        <SlotCard title="They take" snap={ex.giveUp} fallback={`${ex.theyTake} · ${ex.theyTakeSub}`} />
        {ex.getSlot || ex.youGet !== "Nothing" ? (
          <SlotCard title="You get" snap={ex.getSlot} fallback={`${ex.youGet} · ${ex.youGetSub}`} />
        ) : (
          <p className="mt-3 rounded-[18px] bg-navy/4 px-4 py-3 text-[13px] text-navy/55">
            Straight request — you get nothing in return.
          </p>
        )}
        {ex.peerNote ? (
          <div className="mt-3 rounded-[18px] bg-navy/4 px-4 py-3">
            <div className="text-[10.5px] font-semibold tracking-[0.5px] text-navy/45">HER NOTE</div>
            <p className="mt-1 text-[13px] leading-relaxed">{ex.peerNote}</p>
          </div>
        ) : null}
        {ex.ruleChecks.length > 0 ? (
          <div className="mt-4 rounded-[20px] bg-navy/4 px-4 py-3">
            {ex.ruleChecks.map((r) => (
              <div key={r.label} className="flex gap-2 py-1 text-[13px]">
                <span>{r.passed ? "✓" : "✕"}</span>
                <span className={r.passed ? "" : "text-danger"}>{r.label}</span>
              </div>
            ))}
            {ex.ruleChecksFooter ? (
              <p className="mt-2 text-[12px] text-navy/45">{ex.ruleChecksFooter}</p>
            ) : null}
          </div>
        ) : null}
        {ex.irreversibleNotes.length > 0 ? (
          <ul className="mt-3 list-disc pl-5 text-[12.5px] text-navy/55">
            {ex.irreversibleNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        ) : null}
        <div className="mt-5 flex gap-2.5">
          <FieldButton variant="soft" className="flex-1" onClick={() => setRejectOpen(true)}>
            Reject
          </FieldButton>
          <FieldButton variant="navy" className="flex-1" onClick={() => setApproveOpen(true)}>
            {ex.approveLabel}
          </FieldButton>
        </div>
      </WhiteSheet>
      <Overlay open={approveOpen} onClose={() => setApproveOpen(false)}>
        <Sheet>
          <h2 className="text-[20px] font-bold">{ex.approveConfirmTitle}</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-navy/55">{ex.approveConfirmBody}</p>
          <FieldButton
            variant="navy"
            className="mt-5 w-full"
            onClick={async () => {
              const res = await app.approveExchange(ex.id);
              if (!res.ok) {
                router.push("/demo/exchange-failed");
                return;
              }
              if (ex.kind === "swap") router.push("/exchanges/swap-done");
              else {
                app.showToast("Slot handed over.");
                router.push("/exchanges");
              }
            }}
          >
            Confirm
          </FieldButton>
          <FieldButton variant="soft" className="mt-2 w-full" onClick={() => setApproveOpen(false)}>
            Not now
          </FieldButton>
        </Sheet>
      </Overlay>
      <Overlay open={rejectOpen} onClose={() => setRejectOpen(false)}>
        <Sheet>
          <h2 className="text-[20px] font-bold">{ex.rejectTitle}</h2>
          <p className="mt-2 text-[13.5px] text-navy/55">{ex.rejectBody}</p>
          <div className="mt-3 flex flex-col gap-2">
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setRejectId(p.id)}
                className={`rounded-[16px] px-3.5 py-3 text-left text-[14px] ${
                  rejectId === p.id ? "border-[1.5px] border-navy bg-navy/5" : "bg-navy/4"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {presets.find((p) => p.id === rejectId)?.allowsCustomNote ? (
            <textarea
              className="mt-2 w-full rounded-[16px] border border-navy/10 bg-navy/4 p-3 text-[14px] outline-none"
              rows={3}
              placeholder="Optional note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          ) : null}
          <FieldButton
            variant="danger"
            className="mt-4 w-full"
            onClick={() => {
              void app.rejectExchange(ex.id, rejectId, note);
              app.showToast("Rejected. They won't see a reason unless you wrote one.", "neutral");
              router.push("/exchanges");
            }}
          >
            Reject request
          </FieldButton>
        </Sheet>
      </Overlay>
    </Phone>
  );
}

function SlotCard({
  title,
  snap,
  fallback,
}: {
  title: string;
  snap: ExchangeRequest["giveUp"];
  fallback: string;
}) {
  return (
    <div className="mt-3 rounded-[18px] bg-navy/4 p-3.5">
      <div className="text-[10.5px] font-semibold tracking-[0.5px] text-navy/45">{title}</div>
      {snap ? (
        <div className="mt-2 flex items-center gap-3">
          <HourChip hour={snap.hour} bg="#0B5FA8" fg="#fff" />
          <div>
            <div className="font-semibold">{snap.dayLabel} {padHour(snap.hour)}:00</div>
            <div className="text-[12.5px] text-navy/50">{snap.location}</div>
          </div>
        </div>
      ) : (
        <div className="mt-1 text-[14px]">{fallback}</div>
      )}
    </div>
  );
}

export function SentExchangeScreen() {
  const app = useLundrii();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const sent = app.sentById(id);
  const [open, setOpen] = useState(false);

  if (!sent) {
    return (
      <Phone variant="compact">
        <ProtoBackHeader title="Sent request" backHref="/exchanges" />
        <WhiteSheet className="mt-4 p-5">
          <p className="text-navy/50">Withdrawn or missing.</p>
        </WhiteSheet>
      </Phone>
    );
  }

  return (
    <Phone variant="compact">
      <ProtoBackHeader title="Sent request" backHref="/exchanges?tab=sent" />
      <WhiteSheet className="mt-4 px-5 pb-8 pt-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy font-bold text-white">
            {sent.peerInitials}
          </div>
          <div>
            <div className="text-[18px] font-bold">{sent.waitingTitle}</div>
            <div className="text-[13px] text-navy/50">{sent.waitingBody}</div>
          </div>
        </div>
        <p className="mt-4 text-[13px] font-semibold">{sent.peerSlotSummary}</p>
        <div className="mt-4 space-y-2">
          {sent.timeline.map((t) => (
            <div key={t.title} className="flex gap-3">
              <span className={`mt-1 h-2.5 w-2.5 rounded-full ${t.pending ? "bg-warn-amber" : "bg-success"}`} />
              <div>
                <div className="text-[14px] font-semibold">{t.title}</div>
                <div className="text-[12px] text-navy/45">{t.timeLabel}</div>
              </div>
            </div>
          ))}
        </div>
        {sent.canWithdraw ? (
          <>
            <p className="mt-5 text-[12.5px] text-navy/50">{sent.withdrawHint}</p>
            <FieldButton variant="soft" className="mt-3 w-full" onClick={() => setOpen(true)}>
              Withdraw request
            </FieldButton>
          </>
        ) : null}
      </WhiteSheet>
      <Overlay open={open} onClose={() => setOpen(false)}>
        <Sheet>
          <h2 className="text-[20px] font-bold">Withdraw this request?</h2>
          <p className="mt-2 text-[13.5px] text-navy/55">{sent.withdrawHint}</p>
          <FieldButton
            variant="navy"
            className="mt-5 w-full"
            onClick={() => {
              void app.withdrawSent(sent.id);
              app.showToast("Request withdrawn.", "neutral");
              router.push("/exchanges?tab=sent");
            }}
          >
            Withdraw
          </FieldButton>
          <FieldButton variant="soft" className="mt-2 w-full" onClick={() => setOpen(false)}>
            Keep waiting
          </FieldButton>
        </Sheet>
      </Overlay>
    </Phone>
  );
}

export function SwapDoneScreen() {
  const app = useLundrii();
  const result = app.lastSwapDone;
  if (!result) {
    return (
      <Phone>
        <div className="p-8">Nothing to show.</div>
      </Phone>
    );
  }
  return (
    <Phone>
      <div className="flex min-h-dvh flex-col px-5 pb-8 pt-14">
        <CheckCircle />
        <h1 className="mt-5 text-center text-[30px] font-bold tracking-[-0.75px]">
          {result.headline}
        </h1>
        <p className="mt-2 text-center text-[14.5px] text-white/62">{result.subtitle}</p>
        <div className="mt-8 space-y-2.5">
          {[result.gained, result.lost].map((s) => (
            <div
              key={`${s.location}-${s.hour}-${s.footnote}`}
              className="flex items-center gap-3 rounded-[20px] border border-white/22 bg-white/14 px-4 py-3.5"
            >
              <HourChip hour={s.hour} bg="rgba(255,255,255,0.22)" fg="#fff" />
              <div>
                <div className="font-semibold">{s.location}</div>
                <div className="text-[12.5px] text-white/65">
                  {s.dayLabel} {padHour(s.hour)}:00 · {s.footnote}
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[13px] text-white/60">{result.quotaNote}</p>
        <div className="mt-auto flex flex-col gap-2.5">
          <Link href="/bookings">
            <FieldButton variant="white" className="w-full">View bookings</FieldButton>
          </Link>
          <Link href="/exchanges">
            <FieldButton variant="ghost" className="w-full">Inbox</FieldButton>
          </Link>
        </div>
      </div>
    </Phone>
  );
}
