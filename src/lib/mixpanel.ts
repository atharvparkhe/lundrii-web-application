import mixpanel from "mixpanel-browser";

const TOKEN = "12178a9a83a2d09e3eb804c27da18a58";

let started = false;

/** Mixpanel is a browser SDK — never call this during SSR. */
export function startMixpanel() {
  if (started || typeof window === "undefined") return;
  mixpanel.init(TOKEN, {
    autocapture: true,
    record_sessions_percent: 100,
  });
  started = true;
}

export { mixpanel };
