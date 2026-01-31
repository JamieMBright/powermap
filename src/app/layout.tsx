import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PowerMap | Electricity Network Investment Strategy",
  description: "Interactive map visualizing an electricity distribution company's future investment strategy from 2025 to 2050. Explore planned network reinforcements, asset investments, and infrastructure developments.",
  keywords: ["electricity network", "investment", "infrastructure", "map", "DSO", "distribution", "power grid"],
  authors: [{ name: "PowerMap Team" }],
  openGraph: {
    title: "PowerMap | Electricity Network Investment Strategy",
    description: "Interactive map visualizing an electricity distribution company's future investment strategy from 2025 to 2050.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
