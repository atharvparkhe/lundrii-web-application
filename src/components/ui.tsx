"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { IconBack, IconCheck } from "./icons";
import { useLundrii } from "@/store/lundrii-store";

export function Phone({
  children,
  variant = "field",
  className = "",
  exiting = false,
}: {
  children: ReactNode;
  variant?: "field" | "compact" | "dryer" | "suspended" | "success";
  className?: string;
  exiting?: boolean;
}) {
  const cls =
    variant === "dryer"
      ? "dryer-gradient"
      : variant === "suspended"
        ? "suspended-gradient"
        : variant === "success"
          ? "success-gradient"
          : variant === "compact"
            ? "field-compact"
            : "field-gradient";
  return (
    <div className={`app-surface ${cls}`}>
      <div
        className={`phone-screen flex flex-col${exiting ? " anim-auth-exit" : ""} ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

export function Wordmark() {
  return (
    <div className="flex items-baseline gap-1.5">
      <div className="text-[34px] leading-[normal] font-bold tracking-[-0.04em] text-white">
        Lundrii
      </div>
      <div className="h-[9px] w-[9px] rounded-full bg-success-dot" />
    </div>
  );
}

export function GlassCard({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`glass w-full rounded-[24px] text-left ${className}`}
    >
      {children}
    </Tag>
  );
}

export function WhiteSheet({
  children,
  className = "",
  grow = true,
}: {
  children: ReactNode;
  className?: string;
  /** Screens that pin the sheet to a fixed design height opt out of growing. */
  grow?: boolean;
}) {
  return (
    <div
      className={`flex min-h-0 flex-col rounded-t-[32px] bg-white text-navy ${
        grow ? "flex-1" : "flex-none"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function BackChip({
  href,
  onClick,
}: {
  href?: string;
  onClick?: () => void;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (onClick) onClick();
        else if (href) router.push(href);
        else if (typeof window !== "undefined" && window.history.length > 1)
          router.back();
        else router.push("/home");
      }}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/26 bg-white/16 text-white"
      aria-label="Back"
    >
      <IconBack />
    </button>
  );
}

export function FieldButton({
  children,
  variant = "navy",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?:
    | "navy"
    | "white"
    | "ghost"
    | "success"
    | "dryer"
    | "danger"
    | "soft"
    | "soft-strong"
    | "on-field";
}) {
  const styles: Record<string, string> = {
    navy: "bg-navy text-white",
    white: "bg-white text-navy",
    ghost: "bg-white/16 text-white border border-white/28",
    success: "bg-success text-white",
    dryer: "bg-dryer-ink text-white",
    danger: "bg-danger text-white",
    soft: "bg-navy/[0.07] text-navy",
    "soft-strong": "bg-navy/25 text-white",
    "on-field": "bg-white/18 text-white",
  };
  return (
    <button
      type="button"
      className={`h-[54px] rounded-[27px] px-5 text-[15.5px] font-[650] disabled:opacity-40 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function AuthField({
  label,
  status = "plain",
  trailing,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  status?: "plain" | "focus" | "ok" | "bad";
  trailing?: ReactNode;
}) {
  const ring =
    status === "bad"
      ? "border-danger/50 bg-danger/8"
      : status === "ok"
        ? "border-success/50 bg-success/8"
        : status === "focus"
          ? "border-white/45 bg-white/18"
          : "border-white/22 bg-white/14";
  const labelColor =
    status === "bad"
      ? "text-coral"
      : status === "ok"
        ? "text-success-dot"
        : "text-white/50";
  return (
    <label className={`block rounded-[20px] border-[1.5px] px-[17px] py-[13px] ${ring}`}>
      <span
        className={`block text-[11px] tracking-[0.05em] ${labelColor}`}
      >
        {label}
      </span>
      <span className="mt-1 flex items-center gap-2">
        <input
          className="min-w-0 flex-1 bg-transparent text-[15.5px] font-medium text-white outline-none placeholder:text-white/35"
          {...props}
        />
        {trailing}
      </span>
    </label>
  );
}

export function InkField({
  label,
  trailing,
  status = "plain",
  variant = "flat",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  trailing?: ReactNode;
  status?: "plain" | "ok" | "bad";
  /** Sign-up fields sit flat on the sheet; reset fields carry a hairline. */
  variant?: "flat" | "outlined";
}) {
  const ring =
    status === "bad"
      ? "border-danger/35 bg-danger/6"
      : status === "ok"
        ? "border-success/35 bg-success/[0.07]"
        : variant === "outlined"
          ? "border-navy/14 bg-navy/4"
          : "border-transparent bg-navy/4";
  const labelColor =
    status === "bad"
      ? "text-danger"
      : status === "ok"
        ? variant === "outlined"
          ? "text-success-dark"
          : "text-success"
        : "text-navy/45";
  return (
    <label className={`block rounded-[18px] border-[1.5px] px-[15px] py-3 ${ring}`}>
      <span className={`flex items-center justify-between text-[10.5px] font-semibold tracking-[0.05em] ${labelColor}`}>
        {label}
        {trailing}
      </span>
      <input
        className="mt-0.5 w-full bg-transparent text-[14.5px] font-medium text-navy outline-none"
        {...props}
      />
    </label>
  );
}

export function InkSelect({
  label,
  children,
  status = "plain",
  value,
  disabled,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: ReactNode;
  status?: "plain" | "bad";
}) {
  const empty = value === "" || value == null;
  const ring =
    status === "bad"
      ? "border-danger/35 bg-danger/6"
      : "border-transparent bg-navy/4";
  const labelColor = status === "bad" ? "text-danger" : "text-navy/45";
  const selectColor = disabled || empty ? "text-navy/35" : "text-navy";
  return (
    <label
      className={`block rounded-[18px] border-[1.5px] px-[15px] py-3 ${ring} ${
        disabled ? "opacity-70" : ""
      } ${className}`}
    >
      <span
        className={`block text-[10.5px] font-semibold tracking-[0.05em] ${labelColor}`}
      >
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        className={`mt-0.5 w-full bg-transparent text-[14.5px] font-medium outline-none disabled:cursor-not-allowed ${selectColor}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function InkTextarea({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block rounded-[18px] border border-navy/10 bg-navy/4 px-4 py-2.5">
      <span className="block text-[10.5px] font-semibold tracking-[0.05em] text-navy/45">
        {label}
      </span>
      <textarea
        className="mt-1 w-full resize-none bg-transparent text-[15px] text-navy outline-none"
        rows={4}
        {...props}
      />
    </label>
  );
}

export function Segmented({
  options,
  index,
  onChange,
  dark = false,
}: {
  options: { label: string; badge?: string; dryer?: boolean }[];
  index: number;
  onChange: (i: number) => void;
  dark?: boolean;
}) {
  return (
    <div
      className={`flex rounded-[22px] p-1 ${
        dark
          ? "border border-white/20 bg-white/14"
          : "bg-navy/6"
      }`}
    >
      {options.map((opt, i) => {
        const on = i === index;
        return (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(i)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-[18px] py-2.5 text-[13.5px] font-semibold transition-all ${
              on
                ? opt.dryer
                  ? "bg-dryer-light text-dryer-ink"
                  : "bg-white text-navy"
                : dark
                  ? opt.dryer
                    ? "text-dryer-light"
                    : "text-white/75"
                  : "text-navy/50"
            }`}
          >
            {opt.label}
            {opt.badge ? (
              <span className={`opacity-70`}>· {opt.badge}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function HourChip({
  hour,
  fg,
  bg,
}: {
  hour: number;
  fg: string;
  bg: string;
}) {
  return (
    <div
      className="flex h-11 w-11 flex-col items-center justify-center rounded-[14px]"
      style={{ background: bg, color: fg }}
    >
      <span className="text-[15px] font-bold leading-none">
        {hour.toString().padStart(2, "0")}
      </span>
      <span className="text-[8.5px] tracking-[0.5px] opacity-70">:00</span>
    </div>
  );
}

export function StatusChip({
  label,
  tone = "warn",
}: {
  label: string;
  tone?: "warn" | "danger" | "ok" | "coral";
}) {
  const map = {
    warn: "bg-[rgba(201,138,18,.14)] text-[#8A5C05]",
    danger: "bg-danger/12 text-danger",
    ok: "bg-success/14 text-success-dark",
    coral: "bg-coral-strong/16 text-coral",
  };
  return (
    <span
      className={`inline-block rounded-[14px] px-3 py-1.5 text-[11.5px] font-bold tracking-[0.04em] ${map[tone]}`}
    >
      {label}
    </span>
  );
}

export function Overlay({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
}) {
  const [host, setHost] = useState<Element | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    setHost(document.querySelector(".app-frame") ?? document.body);
  }, []);

  useEffect(() => {
    if (!open) return;

    const frame = document.querySelector(".app-frame");
    const screens = Array.from(
      document.querySelectorAll<HTMLElement>(".phone-screen"),
    );
    frame?.classList.add("is-overlay-open");

    const prevBody = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const locked: { el: HTMLElement; overflow: string; overflowY: string }[] =
      [];
    const freeze = (el: HTMLElement) => {
      locked.push({
        el,
        overflow: el.style.overflow,
        overflowY: el.style.overflowY,
      });
      el.style.overflow = "hidden";
      el.style.overflowY = "hidden";
    };
    screens.forEach((screen) => {
      freeze(screen);
      screen.querySelectorAll<HTMLElement>("*").forEach((node) => {
        const oy = window.getComputedStyle(node).overflowY;
        if (oy === "auto" || oy === "scroll") freeze(node);
      });
    });

    const allowedScroller = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null;
      const area = target.closest("[data-scroll-lock-allow]");
      return area instanceof HTMLElement ? area : null;
    };

    const blockBackgroundScroll = (e: Event) => {
      const area = allowedScroller(e.target);
      if (area && area.scrollHeight > area.clientHeight + 1) return;
      e.preventDefault();
    };

    document.addEventListener("touchmove", blockBackgroundScroll, {
      passive: false,
    });
    document.addEventListener("wheel", blockBackgroundScroll, {
      passive: false,
    });

    const closeIfBackgroundScrolls = () => {
      onCloseRef.current?.();
    };
    screens.forEach((screen) => {
      screen.addEventListener("scroll", closeIfBackgroundScrolls);
    });

    return () => {
      frame?.classList.remove("is-overlay-open");
      document.body.style.overflow = prevBody;
      locked.forEach(({ el, overflow, overflowY }) => {
        el.style.overflow = overflow;
        el.style.overflowY = overflowY;
      });
      document.removeEventListener("touchmove", blockBackgroundScroll);
      document.removeEventListener("wheel", blockBackgroundScroll);
      screens.forEach((screen) => {
        screen.removeEventListener("scroll", closeIfBackgroundScrolls);
      });
    };
  }, [open]);

  if (!open || !host) return null;

  // Portal into .app-frame (not .phone-screen): the column scrolls, so an
  // overlay left inside it would drift with the page.
  return createPortal(
    <div className="app-column-inset absolute inset-y-0 z-50 flex items-end justify-center overflow-hidden overscroll-none">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 touch-none bg-[rgba(3,10,30,.55)] backdrop-blur-[2px] animate-[fadeIn_.22s_ease]"
        onClick={onClose}
        onTouchMove={(event) => {
          event.preventDefault();
          onClose?.();
        }}
        onWheel={() => onClose?.()}
      />
      {/* Cap height so tall sheets (hostel list, machine picker) scroll inside
          the sheet instead of spilling past the phone viewport. */}
      <div className="pointer-events-none relative z-10 flex max-h-full w-full items-end p-2.5 pb-[calc(0.625rem+var(--safe-bottom))]">
        <div className="pointer-events-auto max-h-full w-full anim-sheet-up">
          {children}
        </div>
      </div>
    </div>,
    host,
  );
}

export function Sheet({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex max-h-[min(92dvh,100%)] flex-col overflow-hidden rounded-[36px] border border-white/70 bg-white/94 px-[22px] pb-[26px] pt-[22px] text-navy shadow-[0_-10px_50px_rgba(2,10,34,0.35)] backdrop-blur-[34px] backdrop-saturate-[180%] ${className}`}
    >
      <div className="mx-auto mb-[18px] h-1 w-[38px] shrink-0 rounded-sm bg-navy/18" />
      {children}
    </div>
  );
}

/** Scroll region for long option lists inside a Sheet (hostels, machines). */
export function SheetScroll({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-scroll-lock-allow
      className={`-mx-1 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 touch-pan-y [scrollbar-width:thin] ${className}`}
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {children}
    </div>
  );
}

export function ToastHost() {
  const { toast, clearToast } = useLundrii();
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(clearToast, 2800);
    return () => window.clearTimeout(t);
  }, [toast, clearToast]);
  if (!toast) return null;
  const tone =
    toast.kind === "warn"
      ? "bg-[#3a2a08] text-warn-amber"
      : toast.kind === "danger"
        ? "bg-[#3a120c] text-coral"
        : "bg-navy text-white";
  return (
    <div className="app-column-inset pointer-events-none absolute top-[calc(1rem+var(--safe-top))] z-[70] flex justify-center px-4">
      <div
        className={`max-w-[340px] rounded-full px-4 py-2.5 text-[13px] font-medium shadow-lg ${tone}`}
      >
        {toast.message}
      </div>
    </div>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  backHref,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
}) {
  return (
    <div className="flex items-center px-5 pt-14">
      <BackChip href={backHref} />
      <div className="min-w-0 flex-1 px-2 text-center">
        <div className="truncate text-[16px] font-semibold text-white">
          {title}
        </div>
        {subtitle ? (
          <div className="mt-1 inline-flex items-center gap-1.5 rounded-xl border border-white/28 bg-white/20 px-2.5 py-0.5 text-[10.5px] font-[650] tracking-[0.05em] text-white">
            {subtitle}
          </div>
        ) : null}
      </div>
      <div className="h-9 w-9" />
    </div>
  );
}

export function InlineLink({
  prefix,
  action,
  href,
}: {
  prefix: string;
  action: string;
  href: string;
}) {
  return (
    <p className="text-center text-[13.5px] text-white/65">
      {prefix}
      <Link href={href} className="font-[650] text-white">
        {action}
      </Link>
    </p>
  );
}

export function EmptyCard({
  title,
  body,
  cta,
  href,
}: {
  title: string;
  body: string;
  cta?: string;
  href?: string;
}) {
  return (
    <div className="rounded-[22px] border-[1.5px] border-dashed border-navy/16 px-[18px] py-[26px] text-center">
      <div className="text-[15px] font-[650] text-navy">{title}</div>
      <div className="mt-1 text-[12.5px] text-navy/50">{body}</div>
      {cta && href ? (
        <Link
          href={href}
          className="mt-3.5 inline-flex h-11 items-center rounded-full bg-success px-5 text-[14px] font-semibold text-white"
        >
          {cta}
        </Link>
      ) : null}
    </div>
  );
}

export function CheckCircle({ size = 82 }: { size?: number }) {
  return (
    <div
      className="mx-auto flex items-center justify-center rounded-full border border-white/35 bg-white/20 anim-pop-in"
      style={{ width: size, height: size }}
    >
      <IconCheck className="text-white" />
    </div>
  );
}

function toggleTrackClass(on: boolean, ink: boolean) {
  return `h-7 w-[46px] shrink-0 rounded-[15px] p-[3px] transition-colors ${
    on ? "bg-success" : ink ? "bg-navy/18" : "bg-white/28"
  }`;
}

function toggleKnobClass(on: boolean) {
  return `block h-[22px] w-[22px] rounded-full bg-white transition-transform duration-200 ${
    on ? "translate-x-[18px]" : "translate-x-0"
  }`;
}

// The switch face with no control of its own, for rows where the whole card is
// already the button. A <button> nested in a <button> is invalid HTML and
// React refuses to hydrate it, so those rows use this and let the card toggle.
export function ToggleIndicator({
  on,
  ink = false,
}: {
  on: boolean;
  ink?: boolean;
}) {
  return (
    <span className={`block ${toggleTrackClass(on, ink)}`}>
      <span className={toggleKnobClass(on)} />
    </span>
  );
}

export function ToggleSwitch({
  on,
  onToggle,
  ink = false,
}: {
  on: boolean;
  onToggle: () => void;
  ink?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={toggleTrackClass(on, ink)}
      aria-pressed={on}
    >
      <span className={toggleKnobClass(on)} />
    </button>
  );
}
