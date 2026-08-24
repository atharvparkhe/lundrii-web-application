"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconChevronDown } from "@/components/icons";
import {
  BackChip,
  CheckCircle,
  FieldButton,
  InkTextarea,
  Overlay,
  Phone,
  Sheet,
  WhiteSheet,
} from "@/components/ui";
import type { Machine, MachineKind, Ticket } from "@/lib/types";
import { useLundrii } from "@/store/lundrii-store";
import { HostelSwitcher } from "./home-screen";

function floorStatusLabel(status: Machine["status"]) {
  if (status === "offline") return "Offline";
  return status === "busy" ? "In use" : "Free now";
}

function floorStatusClass(status: Machine["status"], dryer: boolean) {
  if (status === "offline") return "text-danger";
  if (status === "free") return dryer ? "text-dryer-ink" : "text-success-dark";
  return "text-navy/55";
}

function optionStatusClass(status: Machine["status"], dryer: boolean) {
  if (status === "offline") return "bg-danger/10 text-danger";
  if (status === "free")
    return dryer ? "bg-dryer-amber/14 text-dryer-ink" : "bg-success/14 text-success-dark";
  return "bg-navy/5 text-navy/45";
}

function ticketSeen(t: Ticket) {
  if (t.status === "resolved") return true;
  if (t.committeeNote) return true;
  return Boolean(t.updatedAt && t.createdAt && t.updatedAt !== t.createdAt);
}

function ProtoHeader({ title, backHref }: { title: string; backHref: string }) {
  return (
    <div className="flex items-center justify-between px-5 pt-14">
      <BackChip href={backHref} />
      <div className="min-w-0 flex-1 px-2 text-center text-[16px] font-semibold text-white">
        {title}
      </div>
      <div className="h-9 w-9 shrink-0" />
    </div>
  );
}

export function TicketsListScreen() {
  const app = useLundrii();

  useEffect(() => {
    if (app.live) void app.loadTickets();
  }, [app.live, app.loadTickets]);
  return (
    <Phone variant="compact">
      <ProtoHeader title="Your tickets" backHref="/profile" />
      <WhiteSheet className="mt-4 px-[18px] pb-8 pt-5">
        {app.tickets.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-navy/45">No tickets yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {app.tickets.map((t) => {
              const open = t.status !== "resolved";
              const seen = open || ticketSeen(t);
              return (
                <Link
                  key={t.id}
                  href={`/tickets/${t.id}`}
                  className={`rounded-[22px] p-4 ${
                    open ? "border border-navy/10" : "bg-navy/4"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[11.5px] font-bold text-navy/40">
                      {t.number}
                    </div>
                    <span
                      className={`rounded-xl px-2.5 py-1 text-[11.5px] font-[650] ${
                        open
                          ? "bg-[rgba(201,138,18,.12)] text-[#8A5C05]"
                          : "bg-success/12 text-success-dark"
                      }`}
                    >
                      {open ? "In review" : "Resolved"}
                    </span>
                  </div>
                  <div className="mt-[9px] text-[15px] font-[650]">{t.title}</div>
                  <div className="mt-1 text-[12.5px] text-navy/50">
                    {t.machineName}
                    {t.machineName ? " · " : ""}
                    {open ? `raised ${t.timeLabel}` : `closed ${t.timeLabel}`}
                  </div>
                  {open ? (
                    <div className="mt-3.5 ml-0.5 flex flex-col gap-[11px] border-l-2 border-success/30 pl-3">
                      <div>
                        <div className="text-[12.5px] font-semibold">Raised</div>
                        <div className="text-[11.5px] text-navy/45">{t.timeLabel}</div>
                      </div>
                      <div className={seen ? "" : "opacity-40"}>
                        <div className="text-[12.5px] font-semibold">Seen by the committee</div>
                        <div className="text-[11.5px] text-navy/45">
                          {seen ? "In review" : "Pending"}
                        </div>
                      </div>
                      <div className="opacity-40">
                        <div className="text-[12.5px] font-semibold">Resolved</div>
                        <div className="text-[11.5px] text-navy/45">Pending</div>
                      </div>
                    </div>
                  ) : null}
                </Link>
              );
            })}
          </div>
        )}
        <Link
          href="/tickets/report"
          className="mt-5 flex h-[50px] items-center justify-center rounded-[25px] border-[1.5px] border-dashed border-navy/18 text-[14px] font-semibold text-navy/55"
        >
          Raise a new ticket
        </Link>
      </WhiteSheet>
    </Phone>
  );
}

export function MaintenanceReportScreen() {
  const app = useLundrii();
  const router = useRouter();
  const draft = app.ticketCompose.maintenanceDraft;
  const draftMachine = app.machineById(draft.machineId);
  const [kind, setKind] = useState<MachineKind>(draftMachine?.kind ?? "washer");
  const [machineId, setMachineId] = useState(draft.machineId);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [hostelOpen, setHostelOpen] = useState(false);
  const [floorOpen, setFloorOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const machines = app.getMachines().filter((m) => m.kind === kind);
  const selected =
    machines.find((m) => m.id === machineId) ?? machines[0] ?? draftMachine ?? null;
  const dryer = kind === "dryer";

  function pickKind(next: MachineKind) {
    setKind(next);
    const first = app.getMachines().find((m) => m.kind === next);
    if (first) {
      setMachineId(first.id);
      app.setFloor(first.name);
    }
  }

  function onPhoto(file: File | null) {
    setPhoto(file);
    setPhotoOpen(false);
    if (file) app.showToast("Photo attached. Tap it to remove.");
  }

  function submit() {
    const comment = note.trim();
    if (!comment) {
      app.showToast("Add a comment so the committee knows what's wrong.", "warn");
      return;
    }
    if (!selected) {
      app.showToast("Pick a machine first.", "warn");
      return;
    }
    void app
      .raiseTicket({
        note: comment,
        machineId: selected.id,
        photo,
      })
      .then(() => router.push("/tickets/raised"))
      .catch(() => {});
  }

  return (
    <Phone variant={dryer ? "dryer" : "field"}>
      <div className="relative flex min-h-full flex-col">
        <ProtoHeader title="Machine is broken" backHref="/tickets" />

        <div className="flex items-center gap-2 px-5 pt-4">
          <button
            type="button"
            onClick={() => setHostelOpen(true)}
            className="inline-flex items-center gap-[7px] rounded-[20px] border border-white/24 bg-white/16 px-3.5 py-[9px] text-[12.5px] font-semibold"
          >
            {app.selectedHostelName}
            <span className="text-[9px] opacity-60">▼</span>
          </button>
          <div className="flex rounded-[19px] border border-white/20 bg-white/14 p-[3px]">
            {(["washer", "dryer"] as MachineKind[]).map((k) => {
              const on = kind === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => pickKind(k)}
                  className={`rounded-2xl px-[13px] py-[7px] text-[12.5px] font-semibold transition-colors ${
                    on
                      ? k === "dryer"
                        ? "bg-white text-dryer-ink"
                        : "bg-white text-navy"
                      : "text-white/75"
                  }`}
                >
                  {k === "washer" ? "Washers" : "Dryers"}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-5 pt-2.5">
          <button
            type="button"
            onClick={() => setFloorOpen(true)}
            className="flex w-full items-center justify-between rounded-[18px] border border-white/20 bg-white/14 px-[15px] py-[11px] text-left"
          >
            <div>
              <div className="text-[10px] font-semibold tracking-[0.06em] text-white/55">
                MACHINE
              </div>
              <div className="mt-0.5 text-[14.5px] font-[650]">
                {selected?.name ?? "Pick a machine"}
              </div>
            </div>
            <div className="flex items-center gap-[9px]">
              {selected ? (
                <span
                  className={`rounded-[11px] bg-white/85 px-2.5 py-1 text-[11px] font-[650] ${floorStatusClass(selected.status, dryer)}`}
                >
                  {floorStatusLabel(selected.status)}
                </span>
              ) : null}
              <IconChevronDown className="text-white opacity-60" />
            </div>
          </button>
        </div>

        <WhiteSheet className="mt-4 overflow-y-auto px-[18px] pb-8 pt-5">
          <div className="text-[11px] font-bold tracking-[0.08em] text-navy/40">
            COMMENT
          </div>
          <div className="mt-[11px] flex gap-2.5">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's wrong with the machine?"
              className="h-[120px] flex-1 resize-none rounded-[18px] border-[1.5px] border-navy/12 bg-navy/[0.03] px-3.5 py-[13px] text-[13px] text-navy outline-none placeholder:text-navy/35"
            />
            <button
              type="button"
              onClick={() => setPhotoOpen(true)}
              className="flex h-[120px] w-[78px] flex-none flex-col items-center justify-center gap-1.5 rounded-[18px] border-[1.5px] border-dashed border-navy/20"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(10,21,51,.45)"
                strokeWidth="1.8"
                strokeLinejoin="round"
              >
                <path d="M3.4 8.6h3.2l1.5-2.2h7.8l1.5 2.2h3.2v10.2H3.4z" />
                <circle cx="12" cy="13.4" r="3.4" />
              </svg>
              <span className="text-[10.5px] font-semibold text-navy/45">Photo</span>
            </button>
          </div>

          {photo ? (
            <button
              type="button"
              onClick={() => setPhoto(null)}
              className="mt-[11px] flex h-[74px] w-[74px] items-end justify-center rounded-2xl border border-navy/10 bg-[repeating-linear-gradient(135deg,rgba(10,21,51,.08)_0_6px,rgba(10,21,51,.03)_6px_12px)] pb-[7px]"
            >
              <span className="font-mono text-[9.5px] font-semibold text-navy/50">
                {photo.name.slice(0, 12)}
              </span>
            </button>
          ) : null}

          <div className="mt-4 rounded-[18px] border border-[rgba(201,138,18,.2)] bg-[rgba(201,138,18,.08)] px-[15px] py-3.5 text-[12px] leading-relaxed text-navy/65">
            If the committee takes this {dryer ? "dryer" : "washer"} offline, every booking on it
            is cancelled automatically.
          </div>

          <FieldButton variant="navy" className="mt-4 mb-[30px] h-[54px] w-full" onClick={submit}>
            Raise ticket
          </FieldButton>
        </WhiteSheet>
      </div>

      <HostelSwitcher open={hostelOpen} onClose={() => setHostelOpen(false)} />

      <Overlay open={floorOpen} onClose={() => setFloorOpen(false)}>
        <Sheet>
          <div className="text-[20px] font-bold tracking-[-0.02em]">Choose a machine</div>
          <p className="mt-1.5 text-[13px] leading-snug text-navy/50">
            {app.selectedHostelName} · only machines in this hostel.
          </p>
          <div className="mt-4 flex flex-col gap-[9px]">
            {machines.map((m) => {
              const on = selected?.id === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMachineId(m.id);
                    app.setFloor(m.name);
                    setFloorOpen(false);
                  }}
                  className={`flex items-center justify-between gap-3 rounded-[20px] px-4 py-[15px] text-left ${
                    on
                      ? dryer
                        ? "border-[1.5px] border-dryer-amber/42 bg-dryer-amber/8"
                        : "border-[1.5px] border-success/42 bg-success/8"
                      : "border-[1.5px] border-transparent bg-navy/4"
                  } ${m.status === "offline" ? "opacity-60" : ""}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-[650]">{m.name}</div>
                    <div className="mt-0.5 text-[12px] text-navy/50">{m.subtitle}</div>
                  </div>
                  <span
                    className={`flex-none rounded-xl px-2.5 py-1 text-[11.5px] font-[650] ${optionStatusClass(m.status, dryer)}`}
                  >
                    {floorStatusLabel(m.status)}
                  </span>
                </button>
              );
            })}
          </div>
        </Sheet>
      </Overlay>

      <Overlay open={photoOpen} onClose={() => setPhotoOpen(false)}>
        <Sheet>
          <div className="text-[20px] font-bold tracking-[-0.02em]">Add a photo</div>
          <p className="mt-1.5 text-[13px] leading-snug text-navy/50">
            A picture of the fault gets the machine looked at faster.
          </p>
          <div className="mt-4 flex flex-col gap-[9px]">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex items-center gap-[13px] rounded-[20px] bg-navy/4 px-4 py-[15px] text-left"
            >
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[14px] bg-navy">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinejoin="round">
                  <path d="M3.4 8.6h3.2l1.5-2.2h7.8l1.5 2.2h3.2v10.2H3.4z" />
                  <circle cx="12" cy="13.4" r="3.2" />
                </svg>
              </div>
              <div>
                <div className="text-[15px] font-[650]">Take a photo</div>
                <div className="mt-0.5 text-[12px] text-navy/50">Opens the camera</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="flex items-center gap-[13px] rounded-[20px] bg-navy/4 px-4 py-[15px] text-left"
            >
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[14px] bg-navy/8">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A1533" strokeWidth="1.9" strokeLinejoin="round">
                  <rect x="3.4" y="5.4" width="17.2" height="13.2" rx="3" />
                  <path d="M4.6 16.4 9 11.8l3.2 3.2 2.6-2.4 4.4 3.8" />
                  <circle cx="9" cy="9.4" r="1.4" />
                </svg>
              </div>
              <div>
                <div className="text-[15px] font-[650]">Choose from gallery</div>
                <div className="mt-0.5 text-[12px] text-navy/50">Pick a shot you already took</div>
              </div>
            </button>
          </div>
        </Sheet>
      </Overlay>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onPhoto(e.target.files?.[0] ?? null)}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPhoto(e.target.files?.[0] ?? null)}
      />
    </Phone>
  );
}

export function TicketRaisedScreen() {
  const app = useLundrii();
  const ticket = app.lastRaisedTicket;
  const copy = app.ticketCompose.raisedResult;
  return (
    <Phone>
      <div className="flex min-h-dvh flex-col px-5 pb-8 pt-14">
        <CheckCircle />
        <h1 className="mt-5 text-center text-[28px] font-bold">
          Ticket {ticket?.number ?? copy.number} raised
        </h1>
        <p className="mt-2 text-center text-[14.5px] text-white/62">{copy.subtitle}</p>
        <ol className="mt-8 list-decimal space-y-2 pl-5 text-[13.5px] text-white/75">
          {copy.nextSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        {copy.bookingStayNote ? (
          <p className="mt-4 text-center text-[13px] text-white/60">{copy.bookingStayNote}</p>
        ) : null}
        <div className="mt-auto flex flex-col gap-2.5">
          <Link href="/tickets">
            <FieldButton variant="white" className="w-full">View tickets</FieldButton>
          </Link>
          <Link href="/home">
            <FieldButton variant="ghost" className="w-full">Home</FieldButton>
          </Link>
        </div>
      </div>
    </Phone>
  );
}

export function TicketDetailScreen() {
  const app = useLundrii();
  const params = useParams<{ ticketId: string }>();
  const id = params.ticketId ?? "";
  const [ticket, setTicket] = useState<Ticket | null>(() => app.ticketById(id) ?? null);
  const [loading, setLoading] = useState(() => !app.ticketById(id));

  useEffect(() => {
    let cancelled = false;
    const cached = app.ticketById(id);
    if (cached) {
      setTicket(cached);
      setLoading(false);
    }
    void app.ensureTicket(id).then((next) => {
      if (cancelled) return;
      if (next) setTicket(next);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // ensureTicket reads the latest store on each id change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const t = ticket;
  const seen = t ? ticketSeen(t) : false;
  if (loading && !t) {
    return (
      <Phone variant="compact">
        <ProtoHeader title="Ticket" backHref="/tickets" />
        <WhiteSheet className="mt-4 p-5 text-[14px] text-navy/45">Loading…</WhiteSheet>
      </Phone>
    );
  }
  if (!t) {
    return (
      <Phone variant="compact">
        <ProtoHeader title="Ticket" backHref="/tickets" />
        <WhiteSheet className="mt-4 p-5">Missing ticket.</WhiteSheet>
      </Phone>
    );
  }
  return (
    <Phone variant="compact">
      <ProtoHeader title={t.number} backHref="/tickets" />
      <WhiteSheet className="mt-4 px-5 pb-8 pt-5">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-xl px-2.5 py-1 text-[11.5px] font-[650] ${
              t.status === "resolved"
                ? "bg-success/12 text-success-dark"
                : "bg-[rgba(201,138,18,.12)] text-[#8A5C05]"
            }`}
          >
            {t.status === "resolved" ? "Resolved" : "In review"}
          </span>
        </div>
        <h1 className="mt-[9px] text-[22px] font-bold">{t.title}</h1>
        <p className="mt-1 text-[12.5px] text-navy/50">
          {t.machineName} · {t.statusDetail ?? (t.status === "resolved" ? "closed" : "raised")}{" "}
          {t.timeLabel}
        </p>
        <p className="mt-4 text-[14px] leading-relaxed">{t.note}</p>
        {t.photoUrl ? (
          t.photoUrl.startsWith("http") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={t.photoUrl}
              alt="Attached"
              className="mt-3 w-full rounded-[16px] object-cover"
            />
          ) : (
            <div className="mt-3 rounded-[16px] bg-navy/4 px-4 py-6 text-center text-[13px] text-navy/45">
              Photo attached
            </div>
          )
        ) : null}
        {t.committeeNote ? (
          <div className="mt-4 rounded-[18px] bg-success/8 px-4 py-3">
            <div className="text-[10.5px] font-semibold tracking-[0.5px] text-success-dark">
              COMMITTEE
            </div>
            <p className="mt-1 text-[13.5px] leading-relaxed">{t.committeeNote}</p>
          </div>
        ) : (
          <div className="mt-3.5 flex flex-col gap-[11px] border-l-2 border-success/30 pl-3">
            <div>
              <div className="text-[12.5px] font-semibold">Raised</div>
              <div className="text-[11.5px] text-navy/45">{t.timeLabel}</div>
            </div>
            <div className={seen ? "" : "opacity-40"}>
              <div className="text-[12.5px] font-semibold">Seen by the committee</div>
              <div className="text-[11.5px] text-navy/45">
                {seen ? t.statusDetail ?? "In review" : "Pending"}
              </div>
            </div>
            <div className="opacity-40">
              <div className="text-[12.5px] font-semibold">Resolved</div>
              <div className="text-[11.5px] text-navy/45">Pending</div>
            </div>
          </div>
        )}
      </WhiteSheet>
    </Phone>
  );
}
