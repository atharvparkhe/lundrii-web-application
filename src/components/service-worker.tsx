"use client";

import { useEffect } from "react";

/**
 * Registers the app-shell worker. Skipped in development, where the worker
 * would sit in front of Next's dev server and serve stale chunks between
 * rebuilds.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {
          // An unregistrable worker costs offline support, nothing more —
          // the app is fully usable without it.
        });
    };

    // Registering competes with the first paint for bandwidth, so wait until
    // the page has settled.
    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
