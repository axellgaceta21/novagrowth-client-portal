import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Client Onboarding | NovaGrowth",
  description: "Your first step with NovaGrowth. Share your business, contact, and project details in one place.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
