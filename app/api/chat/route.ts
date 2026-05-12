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
  BetaToolComputerUse20250124,
  BetaToolBash20250124,
  BetaContentBlockParam,
  BetaMessageParam,
} from '@anthropic-ai/sdk/resources/beta/messages/messages';

export const runtime = 'edge';
export const maxDuration = 300;

// ---------------------------------------------------------------------------
// AI SDK data-stream wire format helpers
// The useChat hook on the frontend parses lines of the form:  <code>:<json>\n
// Codes: 0=text, 2=data, 3=error, 8=annotations, 9=tool_call, a=tool_result,
//        e=finish_step, d=finish_message
// ---------------------------------------------------------------------------
function part(code: string, value: unknown): string {
  return `${code}:${JSON.stringify(value)}\n`;
}

// ---------------------------------------------------------------------------
// AnthropicBedrock client
// Vercel Edge Runtime can't use the default AWS credential provider chain,
// so we supply a custom providerChainResolver that returns static creds.
// ---------------------------------------------------------------------------
function makeClient(): AnthropicBedrock {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!;
  const region = process.env.AWS_REGION ?? 'us-east-1';

  return new AnthropicBedrock({
    awsAccessKey: accessKeyId,
    awsSecretKey: secretAccessKey,
    awsRegion: region,
    // Edge-safe credential resolver — bypasses the Node credential chain
    providerChainResolver: async () => async () => ({
      accessKeyId,
      secretAccessKey,
    }),
  });
}

// ---------------------------------------------------------------------------
// Tool definitions — Anthropic's native format for the beta API
// ---------------------------------------------------------------------------
const COMPUTER_TOOL: BetaToolComputerUse20250124 = {
  type: 'computer_20250124',
  name: 'computer',
  display_width_px: 1024,
  display_height_px: 768,
  display_number: 1,
};

const BASH_TOOL: BetaToolBash20250124 = {
  type: 'bash_20250124',
  name: 'bash',
};

const MODEL = 'us.anthropic.claude-sonnet-4-5-20250929-v1:0';

const SYSTEM_PROMPT = `You are a computer use assistant with access to a virtual computer.
You can control the computer using mouse, keyboard, and bash commands.
When asked to perform tasks, use the available tools to interact with the computer.
Be precise and efficient in your actions.`;

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  let body: { messages?: BetaMessageParam[] };
  try {
    body = await req.json();
  } catch {
    return new Response(part('3', 'Invalid JSON body'), {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const messages: BetaMessageParam[] = body.messages ?? [];
  if (messages.length === 0) {
    return new Response(part('3', 'No messages provided'), {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const client = makeClient();

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const write = (s: string) => writer.write(encoder.encode(s));

  // Run the agentic loop in the background so we can return the stream immediately.
  (async () => {
    try {
      // Agentic loop — keep running while the model returns tool_use stop reasons
      const currentMessages: BetaMessageParam[] = [...messages];

      while (true) {
        // Build a fresh content accumulator for this turn
        const pendingToolUses: Array<{
          id: string;
          name: string;
          input: unknown;
        }> = [];
        let stopReason: string | null = null;

        // Use client.beta.messages.stream() so we get the high-level event helpers.
        // The `betas` array is the computer-use feature flag.
        const stream = client.beta.messages.stream({
          model: MODEL,
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          tools: [COMPUTER_TOOL, BASH_TOOL],
          messages: currentMessages,
          betas: ['computer-use-2025-02-05'],
        });

        // ---- text deltas → AI SDK code 0 --------------------------------
        stream.on('text', (delta) => {
          write(part('0', delta));
        });

        // ---- inputJson deltas (tool call args streaming) -----------------
        // We don't stream these to the frontend because we need the complete
        // args object to emit a well-formed tool_call part (code 9).
        // The finalMessage handler below does the full emit.

        // Wait for the stream to finish and get the full message
        const message = await stream.finalMessage();
        stopReason = message.stop_reason;

        // ---- emit tool_call parts (code 9) for every tool_use block -----
        for (const block of message.content) {
          if (block.type === 'tool_use') {
            pendingToolUses.push({
              id: block.id,
              name: block.name,
              input: block.input,
            });
            write(
              part('9', {
                toolCallId: block.id,
                toolName: block.name,
                args: block.input,
              }),
            );
          }
        }

        // Add the assistant turn to history
        currentMessages.push({
          role: 'assistant',
          content: message.content as BetaContentBlockParam[],
        });

        // If there are no tool calls, we're done
        if (stopReason !== 'tool_use' || pendingToolUses.length === 0) {
          break;
        }

        // ---- execute tools and collect results --------------------------
        // For now, tool results come from the sandbox executor (sandboxToolHandler
        // is called client-side via the /api/sandbox/* routes). The agent loop
        // here sends tool_call parts and then expects tool_result parts back.
        //
        // Because this is a server-side loop without a round-trip to the client
        // between iterations, we forward the tool_use to the Vercel sandbox
        // executor endpoint directly from here.
        //
        // Each tool call is dispatched to /api/sandbox/execute and the result
        // is fed back as both:
        //   • an AI SDK tool_result part (code a) to the frontend stream
        //   • a user message in currentMessages for the next model turn

        const toolResults: BetaContentBlockParam[] = [];

        for (const toolUse of pendingToolUses) {
          let result: unknown;
          let isError = false;

          try {
            const sandboxResp = await fetch(
              new URL('/api/sandbox/execute', req.url).toString(),
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tool: toolUse.name,
                  input: toolUse.input,
                }),
              },
            );

            if (!sandboxResp.ok) {
              const text = await sandboxResp.text();
              result = `Sandbox error (${sandboxResp.status}): ${text}`;
              isError = true;
            } else {
              result = await sandboxResp.json();
            }
          } catch (err) {
            result = `Failed to reach sandbox: ${String(err)}`;
            isError = true;
          }

          // Emit tool_result to frontend (code a)
          write(
            part('a', {
              toolCallId: toolUse.id,
              result,
            }),
          );

          // Build the tool_result block for the next model turn
          const resultContent =
            typeof result === 'string'
              ? result
              : JSON.stringify(result, null, 2);

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: resultContent,
            is_error: isError,
          } as BetaContentBlockParam);
        }

        // Add tool results as a user turn for the next iteration
        currentMessages.push({
          role: 'user',
          content: toolResults,
        });

        // Loop — let the model respond to the tool results
      }

      // Signal finish to the AI SDK useChat hook
      write(part('e', { finishReason: 'stop' }));
      write(part('d', { finishReason: 'stop' }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[chat/route] stream error:', message);
      try {
        write(part('3', message));
      } catch {
        // writer may already be closed if the client disconnected
      }
    } finally {
      try {
        await writer.close();
      } catch {
        // already closed
      }
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