// import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
// import { streamText, UIMessage } from "ai";
// import { killDesktop } from "@/lib/sandbox/utils";
// import { bashTool, computerTool } from "@/lib/sandbox/tool";
// import { prunedMessages } from "@/lib/utils";

// export const maxDuration = 300;

// const bedrock = createAmazonBedrock({
//   region: "us-east-1",
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
// });

// export async function POST(req: Request) {
//   const { messages, sandboxId }: { messages: UIMessage[]; sandboxId: string } =
//     await req.json();
//   try {
//     const result = streamText({
//       model: bedrock("us.anthropic.claude-sonnet-4-5-20250929-v1:0"),
//       system:
//         "Never describe your actions in text. Only use the provided tools directly without narrating what you are doing. " +
//         "You are a helpful assistant with access to a computer. " +
//         "Use the computer tool to help the user with their requests. " +
//         "Use the bash tool to execute commands on the computer. You can create files and folders using the bash tool. Always prefer the bash tool where it is viable for the task. " +
//         "Be sure to advise the user when waiting is necessary. " +
//         "If the browser opens with a setup wizard, YOU MUST IGNORE IT and move straight to the next step (e.g. input the url in the search bar).",
//       messages: prunedMessages(messages),
//       tools: { computer: computerTool(sandboxId), bash: bashTool(sandboxId) },
//     });

//     const response = result.toDataStreamResponse({
//       getErrorMessage(error: unknown) {
//         console.error(error);
//         return error instanceof Error ? error.message : String(error);
//       },
//     });

//     return response;
//   } catch (error) {
//     console.error("Chat API error:", error);
//     await killDesktop(sandboxId);
//     return new Response(JSON.stringify({ error: "Internal Server Error" }), {
//       status: 500,
//       headers: { "Content-Type": "application/json" },
//     });
//   }
// }


import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk';
import type {
  BetaContentBlockParam,
  BetaMessageParam,
  BetaToolResultBlockParam,
} from '@anthropic-ai/sdk/resources/beta/messages/messages';
import { getDesktop } from '@/lib/sandbox/utils';
import type { Message as AIMessage } from 'ai';

// Matches the value in lib/sandbox/tool.ts — inlined to avoid importing tool.ts
const resolution = { x: 1024, y: 768 };

export const runtime = 'nodejs'; // getDesktop uses Node APIs — not Edge compatible
export const maxDuration = 300;

// ---------------------------------------------------------------------------
// AI SDK data-stream wire format
// Codes: 0=text, 3=error, 9=tool_call, a=tool_result, e=finish_step, d=finish_message
// ---------------------------------------------------------------------------
function part(code: string, value: unknown): string {
  return `${code}:${JSON.stringify(value)}\n`;
}

// ---------------------------------------------------------------------------
// Convert AI SDK Message[] → Anthropic BetaMessageParam[]
//
// AI SDK Message shape:
//   { id, role, content: string, parts: Part[], createdAt }
//
// Anthropic shape:
//   { role: 'user'|'assistant', content: string | ContentBlock[] }
//
// Rules:
// - user messages → plain text content
// - assistant messages → build content blocks from parts
//   - text parts       → { type: 'text', text }
//   - tool-invocation  → { type: 'tool_use', id, name, input }
// - tool results go as a SEPARATE user turn immediately after the assistant turn
// ---------------------------------------------------------------------------
/** Map persisted AI SDK tool results → Anthropic tool_result.content (screenshots must stay images). */
function toolInvocationResultToAnthropic(
  raw: unknown,
): BetaToolResultBlockParam['content'] {
  if (typeof raw === 'string') {
    return raw;
  }
  if (
    raw &&
    typeof raw === 'object' &&
    'type' in raw &&
    (raw as { type: unknown }).type === 'image' &&
    'data' in raw &&
    typeof (raw as { data: unknown }).data === 'string'
  ) {
    const img = raw as { data: string; media_type?: string };
    return [
      {
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: img.media_type === 'image/jpeg' ? 'image/jpeg' : 'image/png',
          data: img.data,
        },
      },
    ];
  }
  return JSON.stringify(raw);
}

function toAnthropicMessages(messages: AIMessage[]): BetaMessageParam[] {
  const result: BetaMessageParam[] = [];

  for (const msg of messages) {
    if (msg.role === 'user') {
      result.push({ role: 'user', content: msg.content });
      continue;
    }

    if (msg.role === 'assistant') {
      const contentBlocks: BetaContentBlockParam[] = [];
      const toolResults: BetaToolResultBlockParam[] = [];

      if (!msg.parts || msg.parts.length === 0) {
        if (msg.content) {
          contentBlocks.push({ type: 'text', text: msg.content });
        }
      } else {
        for (const p of msg.parts) {
          if (p.type === 'text' && p.text) {
            contentBlocks.push({ type: 'text', text: p.text });
          } else if (p.type === 'tool-invocation') {
            const inv = p.toolInvocation;
            const input =
              inv.args !== undefined &&
              typeof inv.args === 'object' &&
              inv.args !== null &&
              !Array.isArray(inv.args)
                ? inv.args
                : {};
            contentBlocks.push({
              type: 'tool_use',
              id: inv.toolCallId,
              name: inv.toolName,
              input,
            });
            if (inv.state === 'result' && inv.result !== undefined) {
              toolResults.push({
                type: 'tool_result',
                tool_use_id: inv.toolCallId,
                content: toolInvocationResultToAnthropic(inv.result),
              });
            }
          }
        }
      }

      if (contentBlocks.length > 0) {
        result.push({ role: 'assistant', content: contentBlocks });
      }
      if (toolResults.length > 0) {
        result.push({ role: 'user', content: toolResults });
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// AnthropicBedrock client
// Node runtime — standard env var credential passing works fine here.
// ---------------------------------------------------------------------------
function makeClient(): AnthropicBedrock {
  return new AnthropicBedrock({
    awsAccessKey: process.env.AWS_ACCESS_KEY_ID!,
    awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY!,
    awsRegion: process.env.AWS_REGION ?? 'us-east-1',
  });
}

const MODEL = 'us.anthropic.claude-sonnet-4-5-20250929-v1:0';
const DISPLAY_ENV = { DISPLAY: ':99' };

const SYSTEM_PROMPT = `You are a computer use assistant with access to a virtual computer.
You can control the computer using mouse, keyboard, and bash commands.
When asked to perform tasks, use the available tools to interact with the computer.
Be precise and efficient in your actions.`;

// ---------------------------------------------------------------------------
// Key name mapping — mirrors lib/sandbox/tool.ts exactly
// ---------------------------------------------------------------------------
const KEY_MAP: Record<string, string> = {
  Return: 'Return', enter: 'Return', tab: 'Tab', space: 'space',
  backspace: 'BackSpace', delete: 'Delete', escape: 'Escape',
  up: 'Up', down: 'Down', left: 'Left', right: 'Right',
  home: 'Home', end: 'End', pageup: 'Prior', pagedown: 'Next',
  f1: 'F1', f2: 'F2', f3: 'F3', f4: 'F4', f5: 'F5', f6: 'F6',
  f7: 'F7', f8: 'F8', f9: 'F9', f10: 'F10', f11: 'F11', f12: 'F12',
  shift: 'Shift_L', control: 'Control_L', ctrl: 'Control_L',
  alt: 'Alt_L', super: 'Super_L', meta: 'Super_L',
};

function mapKey(key: string): string {
  if (key.includes('+')) {
    return key.split('+').map(p => KEY_MAP[p.toLowerCase()] || p).join('+');
  }
  return KEY_MAP[key.toLowerCase()] || KEY_MAP[key] || key;
}

// ---------------------------------------------------------------------------
// Tool execution — direct sandbox calls, no HTTP round-trip
// Returns content in the shape Anthropic's tool_result expects
// ---------------------------------------------------------------------------
type ToolResultContent =
  | string
  | Array<
      | { type: 'text'; text: string }
      | { type: 'image'; data: string; media_type: 'image/png' }
    >;

async function executeTool(
  sandboxId: string,
  toolName: string,
  toolInput: unknown,
): Promise<{ content: ToolResultContent; isError: boolean }> {
  const input = toolInput as Record<string, unknown>;

  try {
    const sandbox = await getDesktop(sandboxId);

    // ---- bash tool -------------------------------------------------------
    if (toolName === 'bash') {
      const command = input.command as string;
      const result = await sandbox.runCommand({
        cmd: 'bash',
        args: ['-c', command],
        env: DISPLAY_ENV,
      });
      const stdout = await result.stdout();
      return {
        content: stdout || '(Command executed successfully with no output)',
        isError: false,
      };
    }

    // ---- computer tool ---------------------------------------------------
    if (toolName === 'computer') {
      const action = input.action as string;
      const coordinate = input.coordinate as [number, number] | undefined;
      const text = input.text as string | undefined;
      const duration = input.duration as number | undefined;
      const scrollAmount = input.scroll_amount as number | undefined;
      const scrollDirection = input.scroll_direction as string | undefined;
      const startCoordinate = input.start_coordinate as [number, number] | undefined;

      switch (action) {
        case 'screenshot': {
          await sandbox.runCommand({
            cmd: 'import',
            args: ['-window', 'root', '/tmp/screenshot.png'],
            env: DISPLAY_ENV,
          });
          const buffer = await sandbox.readFileToBuffer({ path: '/tmp/screenshot.png' });
          if (!buffer) throw new Error('Failed to read screenshot');
          return {
            content: [{ type: 'image', data: buffer.toString('base64'), media_type: 'image/png' }],
            isError: false,
          };
        }
        case 'wait': {
          const secs = Math.min(duration ?? 1, 2);
          await new Promise(r => setTimeout(r, secs * 1000));
          return { content: `Waited for ${secs} seconds`, isError: false };
        }
        case 'left_click': {
          const [x, y] = coordinate!;
          await sandbox.runCommand({ cmd: 'xdotool', args: ['mousemove', '--sync', String(x), String(y), 'click', '1'], env: DISPLAY_ENV });
          return { content: `Left clicked at ${x}, ${y}`, isError: false };
        }
        case 'double_click': {
          const [x, y] = coordinate!;
          await sandbox.runCommand({ cmd: 'xdotool', args: ['mousemove', '--sync', String(x), String(y), 'click', '--repeat', '2', '1'], env: DISPLAY_ENV });
          return { content: `Double clicked at ${x}, ${y}`, isError: false };
        }
        case 'right_click': {
          const [x, y] = coordinate!;
          await sandbox.runCommand({ cmd: 'xdotool', args: ['mousemove', '--sync', String(x), String(y), 'click', '3'], env: DISPLAY_ENV });
          return { content: `Right clicked at ${x}, ${y}`, isError: false };
        }
        case 'mouse_move': {
          const [x, y] = coordinate!;
          await sandbox.runCommand({ cmd: 'xdotool', args: ['mousemove', '--sync', String(x), String(y)], env: DISPLAY_ENV });
          return { content: `Moved mouse to ${x}, ${y}`, isError: false };
        }
        case 'type': {
          await sandbox.runCommand({ cmd: 'xdotool', args: ['type', '--clearmodifiers', text!], env: DISPLAY_ENV });
          return { content: `Typed: ${text}`, isError: false };
        }
        case 'key': {
          await sandbox.runCommand({ cmd: 'xdotool', args: ['key', mapKey(text!)], env: DISPLAY_ENV });
          return { content: `Pressed key: ${text}`, isError: false };
        }
        case 'scroll': {
          const button = scrollDirection === 'up' ? '4' : '5';
          await sandbox.runCommand({ cmd: 'xdotool', args: ['click', '--repeat', String(scrollAmount), button], env: DISPLAY_ENV });
          return { content: `Scrolled ${scrollDirection} by ${scrollAmount}`, isError: false };
        }
        case 'left_click_drag': {
          const [sx, sy] = startCoordinate!;
          const [ex, ey] = coordinate!;
          await sandbox.runCommand({
            cmd: 'xdotool',
            args: ['mousemove', String(sx), String(sy), 'mousedown', '1', 'mousemove', '--sync', String(ex), String(ey), 'mouseup', '1'],
            env: DISPLAY_ENV,
          });
          return { content: `Dragged from ${sx},${sy} to ${ex},${ey}`, isError: false };
        }
        default:
          return { content: `Unsupported action: ${action}`, isError: true };
      }
    }

    return { content: `Unknown tool: ${toolName}`, isError: true };
  } catch (err) {
    return {
      content: err instanceof Error ? err.message : String(err),
      isError: true,
    };
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  let body: { messages?: AIMessage[]; sandboxId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(part('3', 'Invalid JSON body'), { status: 400 });
  }

  const rawMessages = body.messages ?? [];
  const sandboxId = body.sandboxId;

  if (rawMessages.length === 0) {
    return new Response(part('3', 'No messages provided'), { status: 400 });
  }
  if (!sandboxId) {
    return new Response(part('3', 'No sandboxId — desktop not initialized'), { status: 400 });
  }

  const client = makeClient();
  const anthropicMessages = toAnthropicMessages(rawMessages);

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const write = (s: string) => writer.write(encoder.encode(s));

  (async () => {
    try {
      const currentMessages: BetaMessageParam[] = [...anthropicMessages];

      // Agentic loop — runs until model stops requesting tools
      while (true) {
        const pendingToolUses: Array<{ id: string; name: string; input: unknown }> = [];

        const stream = client.beta.messages.stream({
          model: MODEL,
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          tools: [
            {
              type: 'computer_20250124',
              name: 'computer',
              display_width_px: resolution.x,
              display_height_px: resolution.y,
              display_number: 1,
            },
            {
              type: 'bash_20250124',
              name: 'bash',
            },
          ],
          messages: currentMessages,
          betas: ['computer-use-2025-02-05'],
        });

        // Stream text deltas to the frontend immediately
        stream.on('text', (delta) => {
          write(part('0', delta));
        });

        const message = await stream.finalMessage();

        // Collect tool_use blocks and emit them to the frontend
        for (const block of message.content) {
          if (block.type === 'tool_use') {
            pendingToolUses.push({ id: block.id, name: block.name, input: block.input });
            write(part('9', { toolCallId: block.id, toolName: block.name, args: block.input }));
          }
        }

        // Add assistant turn to history
        currentMessages.push({
          role: 'assistant',
          content: message.content as BetaContentBlockParam[],
        });

        // No more tool calls — we're done
        if (message.stop_reason !== 'tool_use' || pendingToolUses.length === 0) {
          break;
        }

        // Execute each tool against the sandbox and collect results
        const toolResults: BetaToolResultBlockParam[] = [];

        for (const toolUse of pendingToolUses) {
          const { content, isError } = await executeTool(sandboxId, toolUse.name, toolUse.input);

          // Emit result to frontend (code a)
          write(part('a', { toolCallId: toolUse.id, result: content }));

          // Build result block for the next model turn
          if (typeof content === 'string') {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content,
              is_error: isError,
            });
          } else {
            // Image/mixed content (e.g. screenshot)
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: content.map(c =>
                c.type === 'image'
                  ? {
                      type: 'image' as const,
                      source: {
                        type: 'base64' as const,
                        media_type: c.media_type,
                        data: c.data,
                      },
                    }
                  : { type: 'text' as const, text: c.text },
              ),
            });
          }
        }

        // Add tool results as a user turn — model will respond to them
        currentMessages.push({ role: 'user', content: toolResults });
      }

      write(part('e', { finishReason: 'stop' }));
      write(part('d', { finishReason: 'stop' }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[chat/route] error:', msg);
      try { write(part('3', msg)); } catch { /* client disconnected */ }
    } finally {
      try { await writer.close(); } catch { /* already closed */ }
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Vercel-AI-Data-Stream': 'v1',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}