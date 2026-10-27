"use client";

import React, { useState } from "react";
import { Monitor, Check, Terminal, MousePointer } from "lucide-react";

const TASKS = [
  {
    id: "browser",
    title: "Browser Navigation & Extraction",
    desc: "Opens Chrome on Linux desktop, navigates to target URL, takes screenshot, and extracts data.",
    prompt: "Open Chrome on the desktop, go to Github trends, find top TypeScript repos, and save a summary to desktop.",
    logs: [
      { type: "info", text: "✓ Vercel Sandbox provisioned • Xfce desktop online" },
      { type: "info", text: "✓ computerExecute({ action: 'screenshot' }) → 1920x1080 captured" },
      { type: "info", text: "✓ computerExecute({ action: 'mouse_move', coordinate: [420, 180] })" },
      { type: "info", text: "✓ computerExecute({ action: 'left_click' }) → Chrome address bar focused" },
      { type: "success", text: "✓ bashExecute({ command: 'cat ~/Desktop/summary.txt' }) → Task Complete" },
    ],
    lastScreen: "Chrome Browser • GitHub Trending Page",
  },
  {
    id: "terminal",
    title: "Repository Clone & Test Suite",
    desc: "Runs bash commands in terminal, installs dependencies with pnpm, and runs unit tests.",
    prompt: "Clone the repo, install packages using pnpm, run tests, and fix any broken assertion.",
    logs: [
      { type: "info", text: "✓ bashExecute({ command: 'git clone https://...' })" },
      { type: "info", text: "✓ bashExecute({ command: 'pnpm install' }) → 739 packages added" },
      { type: "info", text: "✓ bashExecute({ command: 'pnpm test' }) → Fail on test_auth.ts:42" },
      { type: "success", text: "✓ computerExecute({ action: 'type', text: 'vim src/auth.ts' }) → Fix applied" },
    ],
    lastScreen: "Xfce Terminal • All 42 Tests Passing",
  },
];

export function AgentWorkspace() {
  const [activeTask, setActiveTask] = useState("browser");
  const currentTask = TASKS.find((t) => t.id === activeTask) || TASKS[0];

  return (
    <section id="workspace" className="py-20 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Watch the Agent Control the Computer
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Vessel executes an autonomous server-side loop: capturing screenshots, calculating coordinates, and streaming real-time desktop state back via noVNC.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
          {/* Top Control Bar */}
          <div className="bg-muted px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-border" />
              <div className="w-3 h-3 rounded-full bg-border" />
              <div className="w-3 h-3 rounded-full bg-border" />
              <span className="text-xs font-mono text-muted-foreground ml-2">
                vessel-vnc-session :: sandbox_id: sbx_89f4a12
              </span>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="flex items-center text-emerald-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                VNC Live Stream
              </span>
              <span className="bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 rounded">
                Claude Sonnet 4.5
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-130">
            {/* Left Sidebar: Routine Selector */}
            <div className="lg:col-span-4 border-r border-border bg-card p-4 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                Sample Instructions
              </div>
              {TASKS.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setActiveTask(task.id)}
                  className={`w-full text-left p-3.5 rounded-md border transition-all ${
                    activeTask === task.id
                      ? "bg-secondary border-primary text-foreground shadow-sm"
                      : "bg-background/50 border-border text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-foreground flex items-center">
                      <Monitor className="w-4 h-4 mr-2 text-primary" />
                      {task.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {task.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* Right Panel: Simulated VNC Window & Telemetry Stream */}
            <div className="lg:col-span-8 p-6 flex flex-col justify-between bg-background">
              <div>
                {/* User Instruction Box */}
                <div className="bg-card border border-border rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5 font-mono">
                    <span>USER PROMPT</span>
                    <span className="text-primary">AGENT LOOP: RUNNING</span>
                  </div>
                  <p className="text-sm text-foreground font-mono">
                    &quot;{currentTask.prompt}&quot;
                  </p>
                </div>

                {/* Agent Execution Logs */}
                <div className="space-y-2 mb-6 font-mono text-xs">
                  <div className="text-muted-foreground mb-1">
                    {"// "}Server-Side Tool Telemetry Stream
                  </div>
                  {currentTask.logs.map((log, index) => (
                    <div
                      key={index}
                      className="bg-card border border-border p-2.5 rounded text-card-foreground flex items-center justify-between"
                    >
                      <span>{log.text}</span>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                  ))}
                </div>

                {/* Mock noVNC Desktop Screen View */}
                <div className="bg-muted/40 border border-border rounded-lg p-4 flex flex-col items-center justify-center min-h-35 relative overflow-hidden">
                  <div className="absolute top-2 left-3 text-[10px] font-mono text-muted-foreground flex items-center">
                    <MousePointer className="w-3 h-3 text-primary mr-1 animate-bounce" />
                    <span>Active Screen State: {currentTask.lastScreen}</span>
                  </div>
                  <div className="text-center py-6">
                    <Monitor className="w-10 h-10 text-primary/70 mx-auto mb-2" />
                    <span className="text-xs font-mono text-muted-foreground">
                      Xfce Virtual Desktop (1920x1080) • Streamed via noVNC
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Footer */}
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span className="flex items-center">
                  <Terminal className="w-3.5 h-3.5 text-primary mr-1.5" />
                  POST /api/chat • Single-request agentic loop
                </span>
                <span className="text-emerald-500 font-semibold">
                  Zero Client-Side Credentials Exposed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}