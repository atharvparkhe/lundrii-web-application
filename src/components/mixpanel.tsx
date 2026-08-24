"use client";

import { useEffect, useRef } from "react";
import { mixpanel, startMixpanel } from "@/lib/mixpanel";
import { useLundrii } from "@/store/lundrii-store";

/**
 * Loads Mixpanel once on the client. Autocapture records clicks, submits, and
 * page views; session replay records 100% of sessions. Signed-in students are
 * identified so those events attach to a person rather than an anonymous id.
 */
export function Mixpanel() {
  const { hydrated, signedIn, profile } = useLundrii();
  const wasSignedIn = useRef(false);

  useEffect(() => {
    startMixpanel();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    startMixpanel();

    if (signedIn && profile.email) {
      mixpanel.identify(profile.email);
      mixpanel.people.set({
        $name: profile.name,
        $email: profile.email,
        hostel: profile.hostelName,
        floor: profile.floor,
      });
      wasSignedIn.current = true;
      return;
    }

    if (wasSignedIn.current) {
      mixpanel.reset();
      wasSignedIn.current = false;
    }
  }, [
    hydrated,
    signedIn,
    profile.email,
    profile.name,
    profile.hostelName,
    profile.floor,
  ]);

  return null;
}
