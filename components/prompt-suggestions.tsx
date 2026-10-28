import { ArrowUpRight, FileText, Globe, Terminal } from "lucide-react";

const suggestions = [
  {
    icon: Globe,
    text: "Find the top trending TypeScript repo",
    prompt:
      "Open Chrome, go to github.com/trending/typescript, and tell me the name and description of the top repository.",
  },
  {
    icon: Terminal,
    text: "Inspect the system in a terminal",
    prompt:
      "Open a terminal, run `uname -a` and `df -h`, then explain the output in two sentences.",
  },
  {
    icon: FileText,
    text: "Create a file on the desktop",
    prompt:
      "Open a text editor, create a file called notes.txt on the Desktop containing 'Hello from Vessel', and save it.",
  },
];

export const PromptSuggestions = ({
  submitPrompt,
  disabled,
}: {
  submitPrompt: (prompt: string) => void;
  disabled: boolean;
}) => {
  return (
    <div className="px-4 pb-3">
      <p className="mb-3 text-sm text-[#71717a]">
        Vessel controls a sandboxed Linux desktop. Pick a task or write your own:
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {suggestions.map(({ icon: Icon, text, prompt }) => (
          <button
            key={text}
            type="button"
            onClick={() => submitPrompt(prompt)}
            disabled={disabled}
            className="group flex items-center gap-2 rounded-full border border-[#1a1a1a] bg-[#0a0a0a] px-3.5 py-2 text-sm text-[#71717a] transition-all hover:border-[#2563eb] hover:bg-[#111111] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[#2563eb]"
          >
            <Icon className="size-3.5 shrink-0 text-[#2563eb]" aria-hidden />
            {text}
            <ArrowUpRight
              className="size-3.5 shrink-0 text-[#71717a] transition-colors group-hover:text-[#2563eb]"
              aria-hidden
            />
          </button>
        ))}
      </div>
    </div>
  );
};