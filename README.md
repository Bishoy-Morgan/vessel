# Author: Bishoy Morgan

# Energent AI — Agent Dashboard

A production-quality AI agent dashboard built on top of the [Vercel AI SDK Computer Use](https://github.com/vercel-labs/ai-sdk-computer-use) demo, extended with a full event pipeline, multi-session chat history, and a two-panel resizable interface.

## Live Demo
> Deployed at: https://ai-agent-dashboard-nu.vercel.app/

---

## Architecture Overview

### Two-Panel Layout
- **Left panel**: Chat interface with inline tool call visualizations, session sidebar, and collapsible debug panel
- **Right panel**: VNC viewer (isolated with `React.memo`) + expanded tool call details
- Horizontally resizable via `react-resizable-panels`

### State Management
Two separate Zustand stores to prevent VNC re-renders on chat updates:

- `useEventStore` — captures all tool calls with `id`, `timestamp`, `type`, `payload`, `status`, and `duration`. Derives `countsByType` and `agentStatus`.
- `useChatStore` — manages sessions with `create`, `switch`, and `delete`. Persisted to `localStorage` via Zustand `persist` middleware.

### VNC Isolation
`VNCViewer` is wrapped in `React.memo` with an explicit comparator:

```tsx
React.memo(Component, (prev, next) =>
  prev.streamUrl === next.streamUrl &&
  prev.isInitializing === next.isInitializing
)
```

This ensures chat updates never trigger a VNC re-render.

### Event Pipeline
Every tool call is captured in `onToolCall` inside `useChat` and pushed to the event store:

```ts
onToolCall: ({ toolCall }) => {
  addEvent({
    id: toolCall.toolCallId,
    timestamp: Date.now(),
    type: toolCall.toolName as ActionType,
    payload: toolCall.args as Record<string, unknown>,
    status: 'running',
  })
}
```

### TypeScript
- No `any` types
- Discriminated unions for `ToolCall` (`computer` | `bash`)
- Strict separation between `AIMessage` (from `ai` package) and domain types

---

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **AI**: Anthropic Claude via AI SDK (`claude-sonnet-4-5`)
- **State**: Zustand with persist middleware
- **UI**: Tailwind CSS, shadcn/ui, Framer Motion
- **Sandbox**: Vercel Sandboxes (VNC via noVNC)
- **Language**: TypeScript (strict mode)

---

## Project Structure

```
src/
  types/          # All domain types — ActionType, AgentEvent, ToolCall, Session
  store/
    eventStore.ts # Event pipeline with derived state
    chatStore.ts  # Session management with localStorage persistence
components/
  VNCViewer.tsx             # Isolated, memo'd VNC component
  SessionSidebar.tsx        # Collapsible session management
  DebugPanel.tsx            # Collapsible event store visualizer
  ToolCallDetails.tsx       # Expanded tool call view (right panel)
  ToolCallVisualization.tsx # Inline tool call chips in chat
app/
  page.tsx        # Main dashboard layout
  api/chat/       # Anthropic computer use stream endpoint
```

---

## Running Locally

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add: ANTHROPIC_API_KEY, SANDBOX_SNAPSHOT_ID

# Set up Vercel credentials
vercel link
vercel env pull

# Create sandbox snapshot (one time, ~10 min)
npx tsx lib/sandbox/create-snapshot.ts

# Run dev server
pnpm dev
```

---

## What I Would Add With More Time
- End-to-end tests for the event pipeline
- Event duration tracking (start/end timestamps per tool call)
- Agent status persistence across sessions
- Mobile-responsive layout improvements
- Optimistic UI updates when switching sessions

---

## Key Technical Decisions

| Decision | Reason |
|---|---|
| Two Zustand stores | Isolate chat state from VNC to prevent re-renders |
| `React.memo` with explicit comparator | Guarantee VNC stability regardless of chat updates |
| `AIMessage` from `ai` package | Avoid type conflicts with `useChat` internal state |
| Zustand `persist` | Zero-config localStorage sync for sessions |
| Discriminated unions for ToolCall | TypeScript narrows correctly in switch statements |
