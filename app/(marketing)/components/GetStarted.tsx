import Link from "next/link";

export function GetStarted() {
  return (
    <section id="get-started" className="py-20 border-b border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-center mb-4">
          Get started
        </h2>
        <p className="text-center text-muted-foreground mb-10">
          Try it in the browser, or run your own copy.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col">
            <h3 className="font-semibold text-foreground mb-2">Use the hosted demo</h3>
            <p className="text-sm text-muted-foreground mb-6 flex-1">
              Open the dashboard, pick a sample instruction or write your own, and watch the agent work.
            </p>
            <Link
              href="/dashboard"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-md text-center text-sm"
            >
              Launch Vessel
            </Link>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-2">Run it yourself</h3>
            <pre className="text-xs font-mono bg-muted rounded-md p-4 overflow-x-auto text-card-foreground">
{`git clone https://github.com/Bishoy-Morgan/ai-agent-dashboard
cd ai-agent-dashboard
pnpm install
# add your AWS + sandbox credentials (see README)
pnpm dev`}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}