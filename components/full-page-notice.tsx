import type { ReactNode } from "react";
import Link from "next/link";
import { VesselLogo } from "@/components/brand/VesselLogo";
import { brandFont } from "@/lib/fonts";

type FullPageNoticeProps = {
  code?: string;
  badge: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function FullPageNotice({
  code,
  badge,
  title,
  description,
  children,
}: FullPageNoticeProps) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background text-foreground overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-black" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/20 via-background to-background"
        aria-hidden
      />

      <header className="relative z-10 shrink-0 bg-background/80 backdrop-blur-md px-6 py-4">
        <Link href="/" aria-label="Vessel home" className="inline-flex items-center gap-3 group">
          <VesselLogo className="size-8 transition-transform group-hover:scale-105" />
          <span
            className={`${brandFont.className} text-xl font-light uppercase tracking-[0.22em] bg-linear-to-r from-white via-blue-200 to-primary bg-clip-text text-transparent`}
          >
            VESSEL
          </span>
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-xl border border-border bg-card/60 backdrop-blur-xl p-8 text-center shadow-2xl shadow-primary/5">
          {code !== undefined ? (
            <p className="mb-3 font-mono text-6xl font-extrabold tracking-tight bg-linear-to-b from-foreground to-muted-foreground bg-clip-text text-transparent">
              {code}
            </p>
          ) : null}

          <div className="inline-flex items-center rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-xs font-mono uppercase tracking-wider text-primary mb-3">
            {badge}
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>

          {children ? (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {children}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}