"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { FullPageNotice } from "@/components/full-page-notice";
import { Button } from "@/components/ui/button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        <FullPageNotice
          badge="Application error"
          title="Critical error"
          description="Something failed outside the usual layout. You can reload or head back home."
        >
          <Button type="button" className="w-full sm:w-auto" onClick={reset}>
            Reload
          </Button>
          <Button variant="secondary" className="w-full sm:w-auto" asChild>
            <Link href="/">Return to dashboard</Link>
          </Button>
        </FullPageNotice>
      </body>
    </html>
  );
}
