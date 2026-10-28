import Link from "next/link";
import { Github } from "lucide-react";
import { VesselLogo } from "@/components/brand/VesselLogo";
import { brandFont } from "@/lib/fonts";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" aria-label="Vessel home" className="flex items-center space-x-3 group">
            <VesselLogo className="w-9 h-9 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-transform group-hover:scale-105" />
            <span
              className={`${brandFont.className} text-xl font-light uppercase tracking-[0.22em] bg-linear-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent`}
            >
              Vessel
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#workspace" className="hover:text-foreground transition-colors">Example</a>
            <a href="#architecture" className="hover:text-foreground transition-colors">Architecture</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <a
            href="https://github.com/Bishoy-Morgan/ai-agent-dashboard"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
          >
            <Github className="w-4 h-4" />
            <span>GitHub</span>
          </a>
          <Link
            href="/dashboard"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm px-4 py-2 rounded-md transition-all shadow-md shadow-primary/20 active:scale-[0.98]"
          >
            Try the demo
          </Link>
        </div>
      </div>
    </header>
  );
}