"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BackChip,
  FieldButton,
  InkField,
  InkSelect,
  Phone,
  ToggleIndicator,
  WhiteSheet,
} from "@/components/ui";
import { ApiError, api, type SignupHostelDto } from "@/lib/api";
import { useLundrii } from "@/store/lundrii-store";

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

export function EditProfileScreen() {
  const app = useLundrii();
  const router = useRouter();
  const profile = app.profile;

  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [hostelId, setHostelId] = useState(profile.hostelId);
  const [whatsapp, setWhatsapp] = useState(profile.whatsappOptIn);
  const [hostels, setHostels] = useState<SignupHostelDto[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);

  const nameMissing = !name.trim();
  const phoneMissing = !phone.trim();
  const hostelMissing = !hostelId;

  useEffect(() => {
    let cancelled = false;
    api.auth
      .signupOptions(profile.email.trim() || undefined)
      .then((data) => {
        if (!cancelled) setHostels(data.hostels);
      })
      .catch(() => {
        if (!cancelled) setHostels([]);
      });
    return () => {
      cancelled = true;
    };
  }, [profile.email]);

  useEffect(() => {
    if (hostelId && hostels.length > 0 && !hostels.some((h) => h.id === hostelId)) {
      setHostelId("");
    }
  }, [hostels, hostelId]);

  async function save() {
    setShowErrors(true);
    if (nameMissing) {
      app.showToast("Fill in your name.", "warn");
      return;
    }
    if (phoneMissing) {
      app.showToast("Add a phone number.", "warn");
      return;
    }
    if (hostelMissing) {
      app.showToast("Select your hostel.", "warn");
      return;
    }

    setSaving(true);
    try {
      const updated = await api.me.patch({
        name: name.trim(),
        phone: phone.trim(),
        whatsappOptIn: whatsapp,
        hostelId,
      });
      app.applyMe(updated);
      const homeChanged = hostelId !== profile.hostelId;
      await app.refresh(homeChanged ? updated.hostelId ?? undefined : undefined);
      app.showToast("Profile saved.");
      setShowErrors(false);
      router.push("/profile");
    } catch (err) {
      app.showToast(
        err instanceof ApiError ? err.message : "Couldn't save your profile.",
        "danger",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Phone variant="compact">
      <ProtoHeader title="Edit profile" backHref="/profile" />
      <WhiteSheet className="mt-4 flex flex-1 flex-col px-5 pb-28 pt-5">
        <p className="text-[12.5px] leading-relaxed text-navy/50">
          Update how Lundrii reaches you and where you live. To book in another
          hostel, use Switch hostel — home hostel is not the only place you can
          book.
        </p>
        <div className="mt-[18px] flex flex-col gap-2.5">
          <InkField
            label="FULL NAME"
            value={name}
            status={showErrors && nameMissing ? "bad" : "plain"}
            onChange={(e) => setName(e.target.value)}
          />
          <InkField
            label="INSTITUTE EMAIL"
            type="email"
            value={profile.email}
            readOnly
            disabled
            className="opacity-80"
          />
          <p className="pl-1 text-[12px] leading-snug text-navy/45">
            Institute email can&apos;t be changed here.
          </p>
          <InkField
            label="PHONE"
            type="tel"
            value={phone}
            placeholder="+91 98765 43210"
            status={showErrors && phoneMissing ? "bad" : "plain"}
            onChange={(e) => setPhone(e.target.value)}
          />
          <InkSelect
            label="HOME HOSTEL"
            value={hostelId}
            status={showErrors && hostelMissing ? "bad" : "plain"}
            onChange={(e) => {
              setHostelId(e.target.value);
            }}
          >
            <option value="">Select hostel</option>
            {hostels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </InkSelect>
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
          variant="navy"
          className="mt-4 w-full"
          disabled={saving}
          onClick={save}
        >
          {saving ? "Saving…" : "Save changes"}
        </FieldButton>
      </WhiteSheet>
    </Phone>
  );
}
