import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lundrii — Laundry slots at GIM",
    short_name: "Lundrii",
    description: "Book a washer or dryer at Goa Institute of Management.",
    // Today's schedule is the one screen a signed-out visitor can read, so a
    // cold launch from the home screen always lands somewhere useful.
    start_url: "/today",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#04102e",
    theme_color: "#04102e",
    categories: ["utilities", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
