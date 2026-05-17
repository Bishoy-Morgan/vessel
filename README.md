# Energent — AI Agent Dashboard

A full-stack AI agent that controls a real computer through natural language. Built with Next.js 15, it runs an agentic loop server-side, executes mouse clicks, keyboard input, and bash commands on a live virtual desktop, and streams every action back to the browser in real time.

**Live demo:** https://ai-agent-dashboard-nu.vercel.app

---

![Demo]

https://github.com/user-attachments/assets/6df81c37-a517-434b-92c7-10f05fa317f5

---

## What it does

You type a natural language instruction. The agent takes a screenshot, reasons about what it sees, and operates the computer — clicking, typing, scrolling, running terminal commands — until the task is complete. Every step is visible in the chat as it happens, and the VNC panel shows the live desktop state.

---

## Architecture

### The core engineering problem

AWS Bedrock exposes Claude through two APIs: the **Converse API** (used by `@ai-sdk/amazon-bedrock`) and the **InvokeModel API** (used by `@anthropic-ai/bedrock-sdk`). Computer use requires Anthropic's `computer-use-2025-01-24` beta header. The Converse API strips unknown headers — so the model receives the tool definitions but never gets permission to invoke them. It narrates instead of acting.

The fix is to bypass the AI SDK's Bedrock provider entirely and use `@anthropic-ai/bedrock-sdk` directly. This routes through AWS credentials but uses the native Anthropic wire format, which preserves beta headers end-to-end.

### Agentic loop

The entire tool execution loop runs server-side inside a single `POST /api/chat` request:

```
User message
    ↓
toAnthropicMessages()     ← converts AI SDK UIMessage[] to Anthropic format
    ↓
client.beta.messages.stream()   ← Bedrock InvokeModel with computer-use beta
    ↓
model returns tool_use block
    ↓
computerExecute() / bashExecute()   ← runs against Vercel Sandbox
    ↓
tool_result fed back to model
    ↓
loop until stop_reason !== "tool_use"
    ↓
stream response to useChat via AI SDK data stream format
```

This design means `useChat` on the frontend stays unchanged — it sees a standard AI SDK data stream and doesn't need to know about the agentic loop running inside the request.

### Message history conversion

AI SDK stores conversation history as `UIMessage[]` with `parts` arrays containing `tool-invocation` objects. Anthropic expects strictly alternating `user`/`assistant` turns where every `tool_use` block in an assistant turn is immediately followed by a `tool_result` in a user turn.

`toAnthropicMessages()` handles this conversion, including edge cases:
- Incomplete tool invocations (state !== "result") — entire assistant turn is dropped to avoid orphaned `tool_use` blocks
- Screenshot results — converted from `{ type: "image", data: base64 }` to Anthropic's `image_source` format
- Multi-step turns — text blocks and tool_use blocks merged into a single assistant content array

### Virtual desktop

Each session gets a Vercel Sandbox running a full Linux desktop (Xfce + Chrome) accessible via noVNC. The sandbox is created on first load, kept alive for the session duration, and killed on tab close via `navigator.sendBeacon`.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| AI | Claude Sonnet 4.5 via AWS Bedrock |
| AI SDK | `@anthropic-ai/bedrock-sdk` + `ai` (Vercel AI SDK) |
| Virtual desktop | Vercel Sandboxes + noVNC |
| State | Zustand (sessions + events) |
| UI | Tailwind CSS + shadcn/ui |
| Deployment | Vercel |

---

## Key design decisions

**Why `@anthropic-ai/bedrock-sdk` instead of `@ai-sdk/amazon-bedrock`**
The AI SDK's Bedrock provider uses the Converse API which doesn't support computer use beta headers. The native Bedrock SDK uses InvokeModel which does. This was the root cause of the model narrating actions as text instead of executing them.

**Why the agentic loop runs server-side**
Running tool execution client-side would require round-trips between the browser and the sandbox for every tool call, and would expose sandbox credentials to the client. The server-side loop keeps credentials secure and reduces latency.

**Why `maxSteps: 1` in `useChat`**
With `maxSteps > 1`, `useChat` would POST again after each completed assistant turn, sending the full message history back through `toAnthropicMessages()`. Screenshot results stored in `UIMessage` parts lose their image format during JSON serialization and come back as plain strings — breaking the model's ability to see. Setting `maxSteps: 1` keeps the multi-step loop entirely inside the single server request where image data stays intact.

---

## Session management

- Sessions persist to `localStorage` via Zustand `persist` middleware
- Session names are set from the first user message after the response completes
- Two-step delete confirmation prevents accidental session loss
- Debug panel shows per-session tool call events, cleared on session switch
- Switching sessions restores the full message history

---

## Environment variables

```env
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
SANDBOX_SNAPSHOT_ID=
VERCEL_OIDC_TOKEN=
```

The AWS credentials need `bedrock:InvokeModel` permission on `us.anthropic.claude-sonnet-4-5-20250929-v1:0` in `us-east-1`. No Anthropic API key is required — all inference goes through AWS.

