"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { IconMail } from "@/components/icons";
import {
  AuthField,
  BackChip,
  FieldButton,
  InlineLink,
  InkField,
  InkSelect,
  Phone,
  ToggleIndicator,
  Wordmark,
} from "@/components/ui";
import { isAllowedDomain, rejectionLine } from "@/lib/domain";
import { padHour } from "@/lib/format";
import { ApiError, api, type SignupHostelDto } from "@/lib/api";
import { useLundrii } from "@/store/lundrii-store";

// Mirrors the Prototype meter: four bars, filled purely by length, and three
// labels. Filled bars are always the same green — the design never grades the
// colour by strength.
function strengthBars(password: string) {
  const filled = Math.min(4, Math.floor(password.length / 2.6));
  const colors = [0, 1, 2, 3].map((i) =>
    i < filled ? "#12A45F" : "rgba(10,21,51,.1)"
  );
  const label =
    password.length >= 10
      ? "Very strong"
      : password.length >= 8
        ? "Strong enough"
        : "Too short";
  return { colors, label, ok: password.length >= 8 };
}

export function SignInScreen() {
  const app = useLundrii();
  const router = useRouter();
  const [email, setEmail] = useState(app.auth.email);
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [obscure, setObscure] = useState(true);
  const [showDomainError, setShowDomainError] = useState(false);
  const [busy, setBusy] = useState(false);
  const domainOk = isAllowedDomain(email);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = window.setTimeout(() => setOtpCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [otpCooldown]);

  // Set when a signed-out visitor tapped a slot on the Book schedule.
  const pending = app.pending;
  const slotLabel =
    pending && pending.hour !== undefined && pending.machineName
      ? `${padHour(pending.hour)}:00 · ${pending.machineName}`
      : null;
  const subtitle =
    pending?.kind === "confirm" && slotLabel
      ? `Sign in to take ${slotLabel}`
      : pending?.kind === "exchange" && slotLabel
        ? `Sign in to ask for ${slotLabel}`
        : "Looking is open to everyone. Sign in to book.";

  function finishSignIn() {
    const destination = pending?.href ?? "/home";
    app.showToast(
      pending?.kind === "confirm"
        ? "Signed in. That slot is still free."
        : "Signed in. Welcome back.",
    );
    router.push(destination);
  }

  async function submitPassword() {
    app.rememberDraft({ email: email.trim() });
    if (!domainOk) {
      setShowDomainError(true);
      app.showToast("Use your institute address.", "warn");
      router.push("/auth/domain-rejected");
      return;
    }
    if (!password) {
      app.showToast("Enter your password.", "warn");
      return;
    }
    if (busy) return;
    setBusy(true);
    const res = await app.signIn(email.trim(), password);
    setBusy(false);
    if (!res.ok) {
      app.showToast(res.error, "danger");
      return;
    }
    finishSignIn();
  }

  async function sendLoginOtp() {
    app.rememberDraft({ email: email.trim() });
    if (!domainOk) {
      setShowDomainError(true);
      app.showToast("Use your institute address.", "warn");
      router.push("/auth/domain-rejected");
      return;
    }
    if (otpCooldown > 0 || busy) return;
    setBusy(true);
    try {
      await api.auth.requestLoginOtp(email.trim());
      setOtpSent(true);
      setOtpCooldown(60);
      app.showToast("Sign-in code sent. Check your inbox.");
    } catch (err) {
      app.showToast(
        err instanceof ApiError ? err.message : "Couldn't send a code.",
        "danger",
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp() {
    if (!otpSent) {
      app.showToast("Send a code to your email first.", "warn");
      return;
    }
    if (otp.length !== 6 || busy) return;
    if (busy) return;
    setBusy(true);
    const res = await app.signInWithOtp(email.trim(), otp);
    setBusy(false);
    if (!res.ok) {
      app.showToast(res.error, "danger");
      return;
    }
    finishSignIn();
  }

  return (
    <Phone>
      <div className="relative min-h-full">
        <div className="px-7 pt-[104px]">
          <Wordmark />
          <p className="mt-2 text-[14.5px] leading-[1.5] text-white/60">{subtitle}</p>
        </div>
        <div className="mt-10 flex flex-col gap-[11px] px-6">
          <AuthField
            label="INSTITUTE EMAIL"
            type="email"
            value={email}
            autoComplete="email"
            status={showDomainError && !domainOk ? "bad" : "plain"}
            onChange={(e) => {
              setEmail(e.target.value);
              if (isAllowedDomain(e.target.value)) setShowDomainError(false);
              app.rememberDraft({ email: e.target.value.trim() });
            }}
          />
          {showDomainError && !domainOk ? (
            <p className="px-1 text-[12.5px] leading-snug text-coral anim-rise">
              {rejectionLine(email, true)}
            </p>
          ) : null}
          {loginMode === "password" ? (
            <>
              <AuthField
                label="PASSWORD"
                type={obscure ? "password" : "text"}
                value={password}
                autoComplete="current-password"
                status="focus"
                onChange={(e) => setPassword(e.target.value)}
                trailing={
                  <button
                    type="button"
                    onClick={() => setObscure((v) => !v)}
                    className="text-[12.5px] font-semibold text-white/70"
                  >
                    {obscure ? "Show" : "Hide"}
                  </button>
                }
              />
              <Link
                href="/auth/forgot"
                className="block px-1 pt-0.5 text-right text-[13px] font-medium text-white/70"
              >
                Forgot password?
              </Link>
            </>
          ) : (
            <>
              <AuthField
                label="6-DIGIT CODE"
                value={otp}
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              <button
                type="button"
                disabled={otpCooldown > 0 || busy}
                onClick={() => void sendLoginOtp()}
                className="px-1 text-left text-[13px] font-medium text-white/70 disabled:opacity-50"
              >
                {otpSent
                  ? otpCooldown > 0
                    ? `Resend code in ${otpCooldown}s`
                    : "Resend code"
                  : "Send sign-in code"}
              </button>
            </>
          )}
        </div>
        <FieldButton
          variant="white"
          onClick={() => void (loginMode === "password" ? submitPassword() : submitOtp())}
          className="absolute right-6 bottom-[186px] left-6 w-auto"
        >
          {loginMode === "password" ? "Sign in" : "Sign in with code"}
        </FieldButton>
        <button
          type="button"
          onClick={() => {
            setLoginMode((m) => (m === "password" ? "otp" : "password"));
            setOtpSent(false);
            setOtp("");
          }}
          className="absolute right-6 bottom-[150px] left-6 text-center text-[13px] font-semibold text-white/75"
        >
          {loginMode === "password" ? "Sign in with email code instead" : "Use password instead"}
        </button>
        <div className="absolute right-6 bottom-[96px] left-6">
          <InlineLink prefix="New here? " action="Create an account" href="/auth/sign-up" />
        </div>
        <button
          type="button"
          onClick={() => {
            app.setPending(null);
            router.push("/book");
          }}
          className="absolute right-6 bottom-12 left-6 text-center text-[13px] font-semibold text-white/60"
        >
          Back to browsing
        </button>
      </div>
    </Phone>
  );
}

export function SignUpScreen() {
  const app = useLundrii();
  const router = useRouter();
  const [name, setName] = useState(app.auth.name);
  const [email, setEmail] = useState(app.auth.email);
  const [phone, setPhone] = useState(app.auth.phone);
  const [password, setPassword] = useState("");
  const [whatsapp, setWhatsapp] = useState(app.auth.whatsappOptIn);
  const [hostelId, setHostelId] = useState("");
  const [floor, setFloor] = useState("");
  const [hostels, setHostels] = useState<SignupHostelDto[]>([]);
  const [busy, setBusy] = useState(false);
  const domainOk = isAllowedDomain(email);
  const emailStatus = email.trim() ? (domainOk ? "ok" : "bad") : "plain";
  const strength = useMemo(() => strengthBars(password), [password]);
  const selectedHostel = hostels.find((h) => h.id === hostelId) ?? null;
  const floors = selectedHostel?.floors ?? [];

  useEffect(() => {
    let cancelled = false;
    const query = domainOk ? email.trim() : undefined;
    api.auth
      .signupOptions(query)
      .then((data) => {
        if (cancelled) return;
        setHostels(data.hostels);
      })
      .catch(() => {
        if (!cancelled) setHostels([]);
      });
    return () => {
      cancelled = true;
    };
  }, [domainOk, email]);

  useEffect(() => {
    if (hostelId && !hostels.some((h) => h.id === hostelId)) {
      setHostelId("");
      setFloor("");
    }
  }, [hostels, hostelId]);

  useEffect(() => {
    if (floor && !floors.includes(floor)) setFloor("");
  }, [floors, floor]);

  function persist() {
    app.rememberDraft({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      whatsappOptIn: whatsapp,
    });
  }

  async function submit() {
    persist();
    if (!name.trim()) {
      app.showToast("Fill in your name.", "warn");
      return;
    }
    if (!domainOk) {
      app.showToast("Use your institute address.", "warn");
      router.push("/auth/domain-rejected");
      return;
    }
    if (!phone.trim()) {
      app.showToast("Add a phone number.", "warn");
      return;
    }
    if (!strength.ok) {
      app.showToast("Choose a stronger password.", "warn");
      return;
    }
    if (!hostelId) {
      app.showToast("Select your hostel.", "warn");
      return;
    }
    if (!floor) {
      app.showToast("Select your floor.", "warn");
      return;
    }
    if (busy) return;
    setBusy(true);
    const res = await app.signUp({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      hostelId,
      floor,
      whatsappOptIn: whatsapp,
    });
    setBusy(false);
    if (!res.ok) {
      app.showToast(res.error, "danger");
      return;
    }
    app.showToast("Account created. Enter the code we emailed you.");
    router.push("/auth/verify");
  }

  return (
    <Phone variant="compact">
      <div className="flex min-h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-[58px]">
        <BackChip href="/auth/sign-in" />
        <div className="text-[16px] font-semibold">Create account</div>
        <div className="w-9" />
      </div>
      <div className="mt-8 flex flex-1 flex-col rounded-t-[32px] bg-white px-5 pb-[calc(32px+var(--safe-bottom))] pt-6 text-navy">
        <h1 className="text-[21px] font-bold tracking-[-0.02em] text-pretty">
          Create your Lundrii account
        </h1>
        <p className="mt-[7px] text-[12.5px] leading-relaxed text-navy/50">
          Pick the hostel and floor you live on so Book opens on your machines.
        </p>
        <div className="mt-[18px] flex flex-col gap-2.5">
          <InkField label="FULL NAME" value={name} onChange={(e) => setName(e.target.value)} />
          <InkField
            label="INSTITUTE EMAIL"
            type="email"
            value={email}
            status={emailStatus}
            onChange={(e) => setEmail(e.target.value)}
            trailing={
              email.trim() ? (
                <span
                  className={`flex h-[18px] w-[18px] items-center justify-center rounded-full text-[11px] font-bold text-white ${
                    domainOk ? "bg-success" : "bg-danger"
                  }`}
                >
                  {domainOk ? "✓" : "!"}
                </span>
              ) : null
            }
          />
          {!domainOk && email.trim() ? (
            <p className="pl-1 text-[12.5px] leading-snug text-danger anim-rise">
              {rejectionLine(email, true)}
            </p>
          ) : null}
          <InkField
            label="PHONE"
            type="tel"
            value={phone}
            placeholder="+91 98765 43210"
            onChange={(e) => setPhone(e.target.value)}
          />
          <InkSelect
            label="HOSTEL"
            value={hostelId}
            onChange={(e) => {
              setHostelId(e.target.value);
              setFloor("");
            }}
          >
            <option value="">Select hostel</option>
            {hostels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </InkSelect>
          <InkSelect
            label="FLOOR"
            value={floor}
            disabled={!hostelId}
            onChange={(e) => setFloor(e.target.value)}
          >
            <option value="">{hostelId ? "Select floor" : "Pick a hostel first"}</option>
            {floors.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </InkSelect>
          <div className="rounded-[18px] bg-navy/4 px-[15px] py-3">
            <div className="text-[10.5px] font-semibold tracking-[0.05em] text-navy/45">
              PASSWORD
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full bg-transparent text-[14.5px] font-medium text-navy outline-none"
            />
            <div className="mt-2.5 flex gap-[5px]">
              {strength.colors.map((bg, i) => (
                <div key={i} className="h-1 flex-1 rounded-sm" style={{ background: bg }} />
              ))}
            </div>
            <div className="mt-1.5 text-[11px] text-navy/45">{strength.label}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setWhatsapp((v) => !v)}
          aria-pressed={whatsapp}
          className="mt-[13px] flex w-full items-center gap-3 rounded-[18px] bg-navy/4 px-[15px] py-[13px] text-left"
        >
          <ToggleIndicator ink on={whatsapp} />
          <span className="text-[12.5px] leading-snug text-navy/60">
            Send me slot reminders on WhatsApp
          </span>
        </button>
        <FieldButton
          variant={domainOk ? "navy" : "soft-strong"}
          className="mt-4 w-full"
          onClick={submit}
        >
          Create account
        </FieldButton>
      </div>
      </div>
    </Phone>
  );
}

export function DomainRejectedScreen() {
  const app = useLundrii();
  const router = useRouter();
  const email = isAllowedDomain(app.auth.email)
    ? "aarav.mehta@gmail.com"
    : app.auth.email.trim() || "aarav.mehta@gmail.com";
  return (
    <Phone variant="compact">
      <div className="flex min-h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-[58px]">
        <BackChip href="/auth/sign-up" />
        <div className="text-[16px] font-semibold">Create account</div>
        <div className="w-9" />
      </div>
      <div className="mt-8 flex flex-1 flex-col rounded-t-[32px] bg-white px-5 pb-[calc(32px+var(--safe-bottom))] pt-6 text-navy">
        <h1 className="text-[21px] font-bold tracking-[-0.02em]">
          That address won&apos;t work here
        </h1>
        <p className="mt-2 text-[12.5px] leading-relaxed text-navy/50">
          Lundrii only accepts addresses your institute has approved.
        </p>
        <div className="mt-5 rounded-[18px] border-[1.5px] border-danger/35 bg-danger/6 px-4 py-3">
          <div className="text-[10.5px] font-semibold tracking-[0.05em] text-danger">
            INSTITUTE EMAIL
          </div>
          <div className="mt-1 text-[15px] font-semibold">{email}</div>
          <p className="mt-2 text-[12.5px] leading-snug text-danger">
            {rejectionLine(email, true)}
          </p>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-navy/55">
          Use @gim.ac.in or @student.gim.ac.in. Personal Gmail, Outlook and other domains are
          rejected.
        </p>
        <div className="mt-auto flex flex-col gap-2.5 pt-8">
          <FieldButton variant="navy" className="w-full" onClick={() => router.push("/auth/sign-up")}>
            Try a different email
          </FieldButton>
          <FieldButton variant="soft" className="w-full" onClick={() => router.push("/auth/sign-in")}>
            Sign in instead
          </FieldButton>
        </div>
      </div>
      </div>
    </Phone>
  );
}

export function VerifyEmailScreen() {
  const app = useLundrii();
  const router = useRouter();
  const email =
    app.auth.email.trim() && isAllowedDomain(app.auth.email)
      ? app.auth.email.trim()
      : app.profile.email;
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  /** The code is printed by the dev server; in production it arrives by email. */
  async function verifyCode() {
    if (otp.length !== 6 || busy) return;
    setBusy(true);
    try {
      await api.auth.verifyEmail({ email, otp });
      app.setDemoMode("normal");
      app.showToast("Email confirmed. Sign in to book.");
      router.push("/auth/sign-in");
    } catch (err) {
      app.showToast(
        err instanceof ApiError ? err.message : "That code didn't work.",
        "danger",
      );
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    try {
      await api.auth.resendVerification(email);
      app.showToast("New code sent.");
    } catch (err) {
      app.showToast(
        err instanceof ApiError ? err.message : "Couldn't resend the code.",
        "danger",
      );
    }
  }

  return (
    <Phone>
      <div className="flex min-h-full flex-col pb-[calc(40px+var(--safe-bottom))]">
        <div className="px-[30px] pt-[88px] text-center">
          <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-[24px] border border-white/30 bg-white/18 anim-pop-in">
            <IconMail className="text-white" />
          </div>
          <h1 className="mt-[22px] text-[27px] font-bold leading-[1.2] tracking-[-0.025em]">
            Confirm your GIM email
          </h1>
          <p className="mt-2.5 text-[14px] leading-[1.55] text-white/62">
            We sent a link to <strong className="font-semibold text-white">{email}</strong>. Booking
            opens the moment you tap it.
          </p>
        </div>
        <div className="mx-5 mt-7 rounded-[26px] border border-white/26 bg-white/16 p-[18px] backdrop-blur-[26px]">
          <div className="text-[11px] tracking-[0.06em] text-white/60">MEANWHILE YOU CAN</div>
          <div className="mt-[9px] text-[14px] leading-[1.6] text-white">
            See what&apos;s free · browse any day in the next 7 · check which hostels you&apos;re
            allowed to use
          </div>
        </div>
        <div className="mx-5 mt-auto flex flex-col gap-2.5 pt-8">
          <AuthField
            label="6-DIGIT CODE"
            value={otp}
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            status={otp.length === 6 ? "ok" : "plain"}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <button
            type="button"
            onClick={verifyCode}
            className="flex h-[52px] items-center justify-center rounded-[26px] bg-white text-[15px] font-semibold text-navy disabled:opacity-50"
            disabled={busy || otp.length !== 6}
          >
            {busy ? "Confirming…" : "Confirm email"}
          </button>
          <button
            type="button"
            onClick={resend}
            className="flex h-[52px] items-center justify-center rounded-[26px] border border-white/28 bg-white/16 text-[15px] font-semibold text-white"
          >
            Resend code
          </button>
          <FieldButton
            variant="ghost"
            className="h-[52px] w-full rounded-[26px] text-[15px] font-semibold"
            onClick={() => router.push("/book")}
          >
            Browse without booking
          </FieldButton>
        </div>
        <p className="mt-4 px-[30px] text-center text-[12.5px] leading-[1.5] text-white/50">
          Wrong address? Only emails on your institute&apos;s list work.
        </p>
      </div>
    </Phone>
  );
}

export function ForgotPasswordScreen() {
  const app = useLundrii();
  const router = useRouter();
  const [email, setEmail] = useState(app.auth.email);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  async function send() {
    app.rememberDraft({ email: email.trim() });
    if (!isAllowedDomain(email)) {
      app.showToast("Use your institute address.", "warn");
      router.push("/auth/domain-rejected");
      return;
    }
    if (cooldown > 0) return;
    try {
      await api.auth.forgotPassword(email.trim());
      setSent(true);
      setCooldown(60);
      app.showToast("If that address is on file, reset instructions were sent.");
    } catch (err) {
      app.showToast(
        err instanceof ApiError ? err.message : "Couldn't send reset instructions.",
        "danger",
      );
    }
  }

  return (
    <Phone variant="compact">
      <div className="flex min-h-full flex-col pb-[calc(40px+var(--safe-bottom))]">
        <div className="flex items-center justify-between px-5 pt-[58px]">
          <BackChip href="/auth/sign-in" />
          <div className="text-[16px] font-semibold">Reset password</div>
          <div className="w-9" />
        </div>
        <div className="px-[26px] pt-12">
          <h1 className="text-[28px] font-bold leading-[1.2] tracking-[-0.03em] text-pretty">
            We&apos;ll email you a reset link
          </h1>
          <p className="mt-2.5 text-[14px] leading-[1.5] text-white/60">
            Enter the institute address you signed up with. The link works once and expires in an
            hour.
          </p>
        </div>
        <div className="mt-8 px-6">
          <AuthField
            label="INSTITUTE EMAIL"
            type="email"
            value={email}
            status="focus"
            onChange={(e) => setEmail(e.target.value)}
          />
          <FieldButton
            variant={cooldown > 0 && sent ? "on-field" : "white"}
            className="mt-3.5 w-full"
            onClick={() => void send()}
          >
            {cooldown > 0 && sent ? `Resend in ${cooldown}s` : "Send reset link"}
          </FieldButton>
        </div>
        {sent ? (
          <>
            <div className="mx-6 mt-7 anim-rise flex items-center gap-[13px] rounded-[24px] border border-white/22 bg-white/14 px-[18px] py-4 backdrop-blur-[24px]">
              <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-success-dot">
                <span className="text-[11px] font-bold text-field-deep">✓</span>
              </div>
              <div className="flex-1">
                <div className="text-[13.5px] font-[650]">Link sent</div>
                <div className="mt-0.5 text-[12.5px] leading-[1.4] text-white/60">
                  Check your inbox. You can ask again in 60 seconds.
                </div>
              </div>
            </div>
            <button
              type="button"
              className="mx-6 mt-3 text-center text-[13px] font-semibold text-white/75"
              onClick={() => router.push("/auth/reset")}
            >
              Open the link →
            </button>
          </>
        ) : null}
        <div className="mt-auto px-6 pt-10">
          <InlineLink prefix="Remembered it? " action="Back to sign in" href="/auth/sign-in" />
        </div>
      </div>
    </Phone>
  );
}

export function ResetPasswordScreen() {
  const app = useLundrii();
  const router = useRouter();
  const resetToken = useSearchParams().get("token") ?? "";
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const longEnough = next.length >= 8;
  const hasSymbol = /[0-9]|[^A-Za-z0-9]/.test(next);
  const matches = next.length > 0 && next === confirm && longEnough;
  const canSave = longEnough && hasSymbol && matches;
  const rules = [
    { ok: longEnough, label: "At least 8 characters" },
    { ok: hasSymbol, label: "A number or symbol" },
    { ok: matches, label: "Both entries match" },
  ];

  async function save() {
    if (!canSave) {
      app.showToast("Both entries must match.", "warn");
      return;
    }
    const email = app.auth.email || app.profile.email;
    try {
      // Token/OTP arrives by email; the screen carries whichever it was given.
      await api.auth.resetPassword({ email, password: next, token: resetToken || undefined });
    } catch (err) {
      app.showToast(
        err instanceof ApiError ? err.message : "Couldn't save that password.",
        "danger",
      );
      return;
    }
    app.setDemoMode("normal");
    const res = await app.signIn(email, next);
    if (!res.ok) {
      app.showToast("Password saved. Sign in with your new password.");
      router.push("/auth/sign-in");
      return;
    }
    app.showToast("Password saved. You are signed in.");
    router.push("/home");
  }

  return (
    <Phone variant="compact">
      <div className="flex min-h-full flex-col">
      <div className="px-[26px] pt-[76px]">
        <h1 className="text-[28px] font-bold leading-[1.2] tracking-[-0.03em]">
          Choose a new password
        </h1>
        <p className="mt-[9px] text-[14px] leading-[1.5] text-white/60">
          Opened from the link in your email. Other devices stay signed in.
        </p>
      </div>
      <div className="mt-8 flex flex-1 flex-col rounded-t-[32px] bg-white px-5 pb-[calc(32px+var(--safe-bottom))] pt-6 text-navy">
        <div className="flex flex-col gap-2.5">
          <InkField
            label="NEW PASSWORD"
            variant="outlined"
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
          <InkField
            label="CONFIRM PASSWORD"
            variant="outlined"
            type="password"
            value={confirm}
            status={matches ? "ok" : "plain"}
            onChange={(e) => setConfirm(e.target.value)}
            trailing={
              matches ? (
                <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-success text-[10px] text-white">
                  ✓
                </span>
              ) : null
            }
          />
        </div>
        <div className="mt-[18px] flex flex-col gap-[9px] rounded-[20px] bg-navy/4 p-4">
          {rules.map((r) => (
            <div key={r.label} className="flex items-center gap-[9px]">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] text-white ${
                  r.ok ? "bg-success" : "bg-navy/16"
                }`}
              >
                ✓
              </span>
              <span className="text-[12.5px] text-navy/60">{r.label}</span>
            </div>
          ))}
        </div>
        <FieldButton
          variant={canSave ? "success" : "soft-strong"}
          className="mt-5 w-full"
          onClick={save}
        >
          Save and sign in
        </FieldButton>
        <p className="mt-3.5 text-center text-[12px] leading-relaxed text-navy/40">
          This link stops working once you save.
        </p>
      </div>
      </div>
    </Phone>
  );
}
