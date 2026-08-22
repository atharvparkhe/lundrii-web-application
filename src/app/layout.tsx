import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { ServiceWorker } from "@/components/service-worker";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lundrii",
  description: "Laundry slots at Goa Institute of Management",
  applicationName: "Lundrii",
  appleWebApp: {
    capable: true,
    title: "Lundrii",
    // The app paints its own gradient right up to the status bar.
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Let the gradient run under the notch and home indicator; screens pad
  // themselves back out with the --safe-* variables.
  viewportFit: "cover",
  themeColor: "#04102e",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-field-deep text-white">
        <Providers>{children}</Providers>
        <ServiceWorker />
      </body>
    </html>
  );
}
