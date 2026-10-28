export function Footer() {
  return (
    <footer className="py-12 bg-background text-muted-foreground text-xs border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-2">
          <span className="text-foreground text-sm font-semibold">VESSEL</span>
          <span className="ml-2">© {new Date().getFullYear()} Built by Bishoy Morgan</span>
        </div>
        <div className="flex items-center space-x-6">
          <a href="https://github.com/Bishoy-Morgan/ai-agent-dashboard" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
          <a href="https://mrgnstudio.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Portfolio</a>
        </div>
      </div>
    </footer>
  );
}