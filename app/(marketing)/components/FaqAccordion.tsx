import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "What is Vessel?",
    a: "Vessel is an open-source dashboard where Claude controls a sandboxed Linux desktop from plain-English instructions. You watch the desktop and the agent's tool calls live in your browser.",
  },
  {
    q: "How does Vessel control the computer?",
    a: "It screenshots the virtual desktop, sends the image to Claude Sonnet 4.5, and receives tool_use instructions back. Those run as computerExecute (mouse and keyboard) or bashExecute (terminal) inside an isolated Vercel Sandbox, and the loop repeats until the task is done.",
  },
  {
    q: "Why use @anthropic-ai/bedrock-sdk instead of the Vercel AI SDK's Bedrock provider?",
    a: "Anthropic's computer-use beta flag didn't reach the model through the AI SDK's Bedrock path, so Claude narrated actions instead of emitting tool calls. The native SDK sends it correctly.",
  },
  {
    q: "Do API keys ever reach my browser?",
    a: "No. The whole agent loop runs server-side in POST /api/chat. AWS credentials and sandbox tokens stay on the server.",
  },
  {
    q: "Can I run it myself?",
    a: "Yes. Clone the GitHub repo and follow the README. You'll need your own AWS Bedrock access and a Vercel Sandbox.",
  },
];

export function FaqAccordion() {
  return (
    <section id="faq" className="py-20 border-b border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <details
              key={faq.q}
              open={i === 0}
              className="group bg-card border border-border rounded-lg overflow-hidden"
            >
              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden p-5 flex items-center justify-between font-semibold text-foreground hover:text-primary transition-colors">
                <span>{faq.q}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-5 pt-4 text-sm text-muted-foreground leading-relaxed border-t border-border">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}