import { ArrowUpRight } from "lucide-react";

const suggestions = [
  {
    text: "Get the latest Vercel blog post",
    prompt: "Go to vercel.com/blog and get the latest post",
  },
  {
    text: "Create a new text file",
    prompt: "Open a text editor and create a new file called notes.txt and write 'we are so back!'",
  },
  {
    text: "Get the latest rauchg tweet",
    prompt: "Go to twitter.com/rauchg and get the latest tweet",
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
    <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => submitPrompt(suggestion.prompt)}
          disabled={disabled}
          className="group flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#1a1a1a] bg-[#0a0a0a] hover:border-[#2563eb] hover:bg-[#111111] disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs text-[#71717a] hover:text-white"
        >
          {suggestion.text.toLowerCase()}
          <ArrowUpRight className="h-3 w-3 text-[#71717a] group-hover:text-[#2563eb] transition-colors" />
        </button>
      ))}
    </div>
  );
};