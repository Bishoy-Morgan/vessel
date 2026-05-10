"use client";

import { AISDKLogo } from "@/components/icons";
import type { ReactNode } from "react";

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
    <div className="flex min-h-dvh flex-col bg-black text-white">
      <header className="shrink-0 border-b border-[#1a1a1a] bg-black px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <AISDKLogo />
          <span className="text-xs font-mono text-[#71717a]">
            AI Agent Dashboard
          </span>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center bg-[#0a0a0a] px-4 py-12">
        <div className="w-full max-w-md rounded-lg border border-[#1a1a1a] bg-black p-8 text-center">
          {code !== undefined ? (
            <p className="mb-4 font-mono text-5xl font-semibold tracking-tight text-[#71717a]">
              {code}
            </p>
          ) : null}
          <p className="text-xs font-mono uppercase tracking-wider text-[#71717a]">
            {badge}
          </p>
          <h1 className="mt-2 text-xl font-semibold text-white">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#71717a]">
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
