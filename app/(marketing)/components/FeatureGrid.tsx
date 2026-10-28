import { Monitor, Cpu, Terminal } from "lucide-react";

const FEATURES = [
  {
    icon: Monitor,
    title: "Isolated Desktop Sandboxes",
    body: (
      <>
        Every session provisions its own Vercel Sandbox running a Linux Xfce desktop and Google Chrome. The agent can&apos;t touch your machine, and you watch every action live through a noVNC stream.
      </>
    ),
  },
  {
    icon: Cpu,
    title: "Native Bedrock Integration",
    body: (
      <>
        Calls Bedrock through <code className="text-xs font-mono text-primary">@anthropic-ai/bedrock-sdk</code> (InvokeModel), so the <code className="text-xs font-mono text-primary">computer-use-2025-01-24</code> beta flag reaches the model. Through the Vercel AI SDK&apos;s Bedrock provider it didn&apos;t, and Claude described actions in text instead of performing them.
      </>
    ),
  },
  {
    icon: Terminal,
    title: "Server-Side Agent Loop",
    body: (
      <>
        The whole tool loop runs inside one <code className="text-xs font-mono text-primary">POST /api/chat</code> request. Screenshots stay in server memory between steps, and AWS credentials and sandbox tokens never reach the browser.
      </>
    ),
  },
];

export function FeatureGrid() {
  return (
    <section id="architecture" className="py-20 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Under the hood
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            The three engineering decisions that make Vessel work: an isolated desktop, a Bedrock integration that keeps computer use enabled, and a server-side agent loop.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all"
            >
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