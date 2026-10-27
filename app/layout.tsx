import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Open-source dashboard where Claude controls a sandboxed Linux desktop from plain-English tasks. Built with Next.js, AWS Bedrock, and Vercel Sandbox.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Vessel: an AI agent that uses a computer like you do",
    template: "%s | Vessel",
  },
  description: DESCRIPTION,
  applicationName: "Vessel",
  openGraph: {
    title: "Vessel: an AI agent that uses a computer like you do",
    description: "Describe a task. Watch an AI agent do it on a live Linux desktop.",
    siteName: "Vessel",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vessel: an AI agent that uses a computer like you do",
    description: "Describe a task. Watch an AI agent do it on a live Linux desktop.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}