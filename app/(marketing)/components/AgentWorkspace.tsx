"use client";

import { useState } from "react";
import { Monitor, Check, Terminal, MousePointer, Globe, FileText } from "lucide-react";

const TASKS = [
  {
    id: "browser",
    icon: Globe,
    title: "Browse and extract",
    desc: "Opens Chrome, loads a page, and reads what's on it.",
    prompt:
      "Open Chrome, go to github.com/trending/typescript, and tell me the name and description of the top repository.",
    logs: [
      "computerExecute({ action: 'screenshot' })",
      "computerExecute({ action: 'left_click', coordinate: [420, 60] })",
      "computerExecute({ action: 'type', text: 'github.com/trending/typescript' })",
      "computerExecute({ action: 'screenshot' })",
    ],
    result: "Agent reads the page and replies with the top repository's name and description.",
    lastScreen: "Chrome • GitHub Trending",
  },
  {
    id: "terminal",
    icon: Terminal,
    title: "Run terminal commands",
    desc: "Runs shell commands in the sandbox and explains the output.",
    prompt:
      "Open a terminal, run `uname -a` and `df -h`, then explain the output in two sentences.",
    logs: [
      "bashExecute({ command: 'uname -a' })",
      "bashExecute({ command: 'df -h' })",
    ],
    result: "Agent summarizes the kernel and disk usage in two sentences.",
    lastScreen: "Xfce Terminal",
  },
  {
    id: "file",
    icon: FileText,
    title: "Create a file",
    desc: "Uses a desktop app to write and save a file.",
    prompt:
      "Open a text editor, create a file called notes.txt on the Desktop containing 'Hello from Vessel', and save it.",
    logs: [
      "computerExecute({ action: 'screenshot' })",
      "computerExecute({ action: 'type', text: 'Hello from Vessel' })",
      "computerExecute({ action: 'key', text: 'ctrl+s' })",
    ],
    result: "Agent confirms notes.txt is saved on the Desktop.",
    lastScreen: "Text editor • notes.txt",
  },
];

export function AgentWorkspace() {
  const [activeTask, setActiveTask] = useState(TASKS[0].id);
  const currentTask = TASKS.find((t) => t.id === activeTask) ?? TASKS[0];

  const MODEL_LABEL = "Claude Sonnet 4.5";

  return (
    <section id="workspace" className="py-20 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Example session: watch the agent work
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            A sample run showing the tool calls Vessel makes. Launch the dashboard to run a real one.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
          {/* Top bar */}
          <div className="bg-muted px-4 py-3 border-b border-border flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-border" aria-hidden />
              <div className="w-3 h-3 rounded-full bg-border" aria-hidden />
              <div className="w-3 h-3 rounded-full bg-border" aria-hidden />
              <span className="text-xs font-mono text-muted-foreground ml-2">
                example-session
              </span>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="hidden sm:flex items-center text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-muted-foreground mr-1.5" aria-hidden />
                Sample session
              </span>
              <span className="bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 rounded">
                {MODEL_LABEL}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-130">
            {/* Task picker */}
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-border bg-card p-4 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                Sample instructions
              </div>
              {TASKS.map(({ id, icon: Icon, title, desc }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTask(id)}
                  aria-pressed={activeTask === id}
                  className={`w-full text-left p-3.5 rounded-md border transition-all focus-visible:outline-2 focus-visible:outline-primary ${
                    activeTask === id
                      ? "bg-secondary border-primary text-foreground shadow-sm"
                      : "bg-background/50 border-border text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  <span className="font-semibold text-sm text-foreground flex items-center">
                    <Icon className="w-4 h-4 mr-2 text-primary" aria-hidden />
                    {title}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                </button>
              ))}
            </div>

            {/* Example run */}
            <div className="lg:col-span-8 p-6 flex flex-col justify-between bg-background">
              <div>
                <div className="bg-card border border-border rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5 font-mono">
                    <span>USER PROMPT</span>
                    <span className="text-primary">EXAMPLE</span>
                  </div>
                  <p className="text-sm text-foreground font-mono">
                    &quot;{currentTask.prompt}&quot;
                  </p>
                </div>

                <div className="space-y-2 mb-6 font-mono text-xs">
                  <div className="text-muted-foreground mb-1">
                    {"// "}Tool calls the agent makes
                  </div>
                  {currentTask.logs.map((log, index) => (
                    <div
                      key={index}
                      className="bg-card border border-border p-2.5 rounded text-card-foreground flex items-center justify-between gap-3"
                    >
                      <span className="break-all">{log}</span>
                      <Check className="w-3.5 h-3.5 shrink-0 text-emerald-500" aria-hidden />
                    </div>
                  ))}
                  <p className="pt-1 text-muted-foreground font-sans text-sm">
                    {currentTask.result}
                  </p>
                </div>

                <div className="bg-muted/40 border border-border rounded-lg p-4 flex flex-col items-center justify-center min-h-35 relative overflow-hidden">
                  <div className="absolute top-2 left-3 text-[10px] font-mono text-muted-foreground flex items-center">
                    <MousePointer className="w-3 h-3 text-primary mr-1" aria-hidden />
                    <span>Screen: {currentTask.lastScreen}</span>
                  </div>
                  <div className="text-center py-6">
                    <Monitor className="w-10 h-10 text-primary/70 mx-auto mb-2" aria-hidden />
                    <span className="text-xs font-mono text-muted-foreground">
                      In the real dashboard, the live desktop appears here via noVNC
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-muted-foreground">
                <span className="flex items-center">
                  <Terminal className="w-3.5 h-3.5 text-primary mr-1.5" aria-hidden />
                  POST /api/chat • Single-request agent loop
                </span>
                <span>Credentials stay server-side</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}