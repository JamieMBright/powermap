import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "PowerMap | UK Power Networks Investment Strategy",
  description: "Interactive map visualizing UK Power Networks' future investment strategy from 2025 to 2050. Explore planned network reinforcements, asset investments, and infrastructure developments.",
  keywords: ["UK Power Networks", "electricity network", "investment", "infrastructure", "map", "DSO", "distribution"],
  authors: [{ name: "UK Power Networks" }],
  openGraph: {
    title: "PowerMap | UK Power Networks Investment Strategy",
    description: "Interactive map visualizing UK Power Networks' future investment strategy from 2025 to 2050.",
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
        {children}
      </body>
    </html>
  );
}
