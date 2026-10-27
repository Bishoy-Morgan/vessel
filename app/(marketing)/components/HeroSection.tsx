import Link from "next/link";
import { ArrowRight, Play, Github } from "lucide-react";

const STACK = ["Next.js", "Claude Sonnet 4.5", "AWS Bedrock", "Vercel Sandbox", "noVNC"];

export function HeroSection() {
  return (
    <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden border-b border-border">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-75 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-secondary border border-border text-xs font-mono text-primary mb-8">
          Open source • Claude computer use on AWS Bedrock
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1]">
          An AI agent that uses a computer <span className="text-primary">like you do</span>.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Describe a task in plain English. Vessel&apos;s agent looks at a live Linux desktop, clicks, types,
          and runs terminal commands inside an isolated sandbox, while you watch it happen in your browser.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3.5 rounded-md transition-all shadow-lg shadow-primary/25 flex items-center justify-center space-x-2 active:scale-[0.98]"
          >
            <span>Try the live demo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#workspace"
            className="w-full sm:w-auto bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold px-8 py-3.5 rounded-md border border-border transition-all flex items-center justify-center space-x-2"
          >
            <Play className="w-4 h-4 text-primary fill-primary" />
            <span>See an example run</span>
          </a>
          <a
            href="https://github.com/Bishoy-Morgan/ai-agent-dashboard"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto text-muted-foreground hover:text-foreground font-medium px-4 py-3.5 flex items-center justify-center space-x-2 transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>View source</span>
          </a>
        </div>

        <div className="mt-14 pt-8 border-t border-border flex flex-wrap justify-center items-center gap-2 text-xs font-mono">
          <span className="text-muted-foreground uppercase tracking-wider font-semibold mr-2 font-sans">
            Built with
          </span>
          {STACK.map((s) => (
            <span key={s} className="bg-card border border-border px-3 py-1.5 rounded-md text-card-foreground">
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}