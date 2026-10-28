type Props = {
    sessionName?: string;
    status: "submitted" | "streaming" | "ready" | "error";
    isInitializing: boolean;
};

export default function ChatHeader({ sessionName, status, isInitializing }: Props) {
    const state = isInitializing
        ? { label: "Starting desktop", dot: "bg-amber-400 animate-pulse" }
        : status === "submitted" || status === "streaming"
            ? { label: "Agent working", dot: "bg-[#2563eb] animate-pulse" }
            : status === "error"
                ? { label: "Error", dot: "bg-red-500" }
                : { label: "Ready", dot: "bg-emerald-500" };

    return (
        <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center justify-between gap-3 shrink-0">
            <h1 className="truncate text-sm font-medium text-white">
                {sessionName ?? "New session"}
            </h1>
            <span
                role="status"
                aria-live="polite"
                className="flex shrink-0 items-center gap-2 text-xs font-mono text-[#71717a]"
            >
                <span className={`size-2 rounded-full ${state.dot}`} aria-hidden />
                    {state.label}
            </span>
        </div>
    );
}