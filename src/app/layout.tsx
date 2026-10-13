import { HexclaveProvider, HexclaveTheme } from "@hexclave/next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { hexclaveClientApp } from "../stack/client";
import "./globals.css";
import { NavBar } from "@/components/nav/nav-bar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wikimasters",
  description: "Learn how to build and scale Next.js apps with Brian Holt",
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
        <HexclaveProvider app={hexclaveClientApp}>
          <HexclaveTheme>
            <NavBar />
            {children}
            <Analytics />
            <SpeedInsights />
          </HexclaveTheme>
        </HexclaveProvider>
      </body>
    </html>
  );
}
