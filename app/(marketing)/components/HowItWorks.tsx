import { MessageSquare, Eye, MonitorPlay } from "lucide-react";

const STEPS = [
  {
    icon: MessageSquare,
    title: "1. Describe the task",
    body: "Type what you want done, e.g. “Open Chrome, find top TypeScript repos on GitHub, save a summary.”",
  },
  {
    icon: Eye,
    title: "2. The agent sees and acts",
    body: "Vessel screenshots the desktop and sends it to Claude. Claude replies with an action (click, type, or bash command), which runs in the sandbox. This repeats until the task is done.",
  },
  {
    icon: MonitorPlay,
    title: "3. You watch it live",
    body: "The desktop streams to your browser through noVNC, alongside a log of every tool call the agent made.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-center mb-12">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-card border border-border rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center mb-5 text-primary">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}