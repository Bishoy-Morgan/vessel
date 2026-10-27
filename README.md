<p align="center">
  <img src="public/vessel-logo.svg" alt="Vessel logo" width="72" height="72" />
</p>

<h1 align="center">Vessel</h1>

<p align="center">
  An AI agent that uses a computer like you do.<br />
  Describe a task in plain English and watch Claude carry it out on a live Linux desktop.
</p>

<p align="center">
  <a href="https://ai-agent-dashboard-nu.vercel.app"><b>Live demo</b></a>
</p>

---

https://github.com/user-attachments/assets/6df81c37-a517-434b-92c7-10f05fa317f5

---

## What it does

You type an instruction. The agent takes a screenshot, reasons about what it sees, and operates the computer (clicking, typing, scrolling, running terminal commands) until the task is complete. Every step appears in the chat as it happens, and the VNC panel shows the live desktop.

Everything runs in an isolated sandbox, so the agent can't touch your machine.

## How it works

Built with Next.js 15. The whole agent loop runs server-side inside a single `POST /api/chat` request:

```
User message
    ↓
toAnthropicMessages()           ← converts AI SDK UIMessage[] to Anthropic format
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

`useChat` on the frontend stays unchanged. It sees a standard AI SDK data stream and doesn't need to know an agent loop is running inside the request.

### Virtual desktop

Each session gets a Vercel Sandbox running a full Linux desktop (Xfce + Chrome), streamed to the browser through noVNC. The sandbox is created on first load, kept alive for the session, and killed on tab close via `navigator.sendBeacon`.

## Key engineering decisions

**Native Anthropic SDK instead of the AI SDK's Bedrock provider**
Claude computer use needs the `computer-use-2025-01-24` beta flag. Through `@ai-sdk/amazon-bedrock` (Converse API), the flag did not reach the model in this setup: Claude received the tool definitions but described actions as text instead of emitting `tool_use` blocks. Switching to `@anthropic-ai/bedrock-sdk` (InvokeModel), which sends the flag in the request body, fixed it.

**Server-side agent loop**
Running tool execution client-side would add a browser round-trip per tool call and put sandbox credentials in the client. The server-side loop keeps credentials on the server and screenshots in server memory.

**`maxSteps: 1` in `useChat`**
With `maxSteps > 1`, `useChat` POSTs again after each assistant turn and sends the full history back through `toAnthropicMessages()`. Screenshot results stored in `UIMessage` parts lose their image format during JSON serialization and come back as plain strings, so the model can no longer see them. `maxSteps: 1` keeps the multi-step loop inside the single server request, where image data stays intact.

### Message history conversion

AI SDK stores history as `UIMessage[]` with `parts` arrays containing `tool-invocation` objects. Anthropic expects strictly alternating `user`/`assistant` turns where every `tool_use` block is immediately followed by a `tool_result`. `toAnthropicMessages()` handles the conversion, including:

- **Incomplete tool invocations** (state !== "result"): the whole assistant turn is dropped to avoid orphaned `tool_use` blocks.
- **Screenshot results:** converted from `{ type: "image", data: base64 }` to Anthropic's `image_source` format.
- **Multi-step turns:** text and `tool_use` blocks are merged into one assistant content array.

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

## Session management

- Sessions persist to `localStorage` via Zustand `persist` middleware.
- Session names are set from the first user message after the response completes.
- Two-step delete confirmation prevents accidental session loss.
- The debug panel shows per-session tool call events, cleared on session switch.
- Switching sessions restores the full message history.

## Run it yourself

**Prerequisites:** Node.js, pnpm, AWS Bedrock access to Claude Sonnet 4.5 in `us-east-1`, and a Vercel account with Sandbox access.

```bash
git clone https://github.com/Bishoy-Morgan/vessel.git
cd vessel
pnpm install
```

Create `.env.local`:

```env
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
SANDBOX_SNAPSHOT_ID=
VERCEL_OIDC_TOKEN=
```

Then:

```bash
pnpm dev
```

The AWS credentials need `bedrock:InvokeModel` permission on `us.anthropic.claude-sonnet-4-5-20250929-v1:0` in `us-east-1`. No Anthropic API key is required, since all inference goes through AWS.

## Known limitations

- Sessions are stored in the browser's `localStorage` only. There is no server-side persistence.
- Sandbox cleanup on tab close uses `navigator.sendBeacon`, which is best-effort. Sandboxes can outlive a closed tab until they time out.
- Running it requires your own AWS Bedrock access and Vercel Sandbox setup.