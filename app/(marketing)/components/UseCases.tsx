const CASES = [
  {
    title: "Developers building agents",
    body: "A working reference for Claude computer use: the tool loop, screenshot handling, and message formatting, all server-side.",
  },
  {
    title: "Teams on AWS Bedrock",
    body: "See how to keep Anthropic's computer-use beta enabled on Bedrock using the native SDK.",
  },
  {
    title: "Anyone evaluating agents",
    body: "Watch what an agent actually does on a real desktop, in a sandbox where mistakes can't touch your machine.",
  },
];

export function UseCases() {
  return (
    <section id="use-cases" className="py-20 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-center mb-12">
          Who it&apos;s for
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {CASES.map((c) => (
            <div key={c.title} className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">{c.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}