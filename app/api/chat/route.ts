import { AnthropicBedrock } from "@anthropic-ai/bedrock-sdk";
import { computerExecute, bashExecute, resolution } from "@/lib/sandbox/tool";
import type { UIMessage } from "ai";

export const maxDuration = 300;

// ---------------------------------------------------------------------------
// AnthropicBedrock client — uses AWS credentials, NOT Anthropic API credits
// Routes through AWS Bedrock but uses native Anthropic API format,
// which supports computer use beta headers unlike the Converse API
// ---------------------------------------------------------------------------
const client = new AnthropicBedrock({
  awsAccessKey: process.env.AWS_ACCESS_KEY_ID!,
  awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY!,
  awsRegion: process.env.AWS_REGION ?? "us-east-1",
});

const MODEL = "us.anthropic.claude-sonnet-4-5-20250929-v1:0";

const SYSTEM_PROMPT =
  "Never describe your actions in text. Only use the provided tools directly without narrating what you are doing. " +
  "You are a helpful assistant with access to a computer. " +
  "Use the computer tool to help the user with their requests. " +
  "Use the bash tool to execute commands on the computer. You can create files and folders using the bash tool. Always prefer the bash tool where it is viable for the task. " +
  "Be sure to advise the user when waiting is necessary. " +
  "If the browser opens with a setup wizard, YOU MUST IGNORE IT and move straight to the next step (e.g. input the url in the search bar).";

// ---------------------------------------------------------------------------
// AI SDK data stream format — useChat expects these prefixed lines
// 0=text delta, 2=data, 8=annotation, 9=tool_call, a=tool_result,
// e=finish_step, d=finish_message, 3=error
// ---------------------------------------------------------------------------
function part(code: string, value: unknown): string {
  return `${code}:${JSON.stringify(value)}\n`;
}

// ---------------------------------------------------------------------------
// Convert AI SDK UIMessage[] → Anthropic MessageParam[]
// UIMessage has parts[] with tool-invocation entries
// Anthropic wants alternating user/assistant turns with content blocks
// ---------------------------------------------------------------------------
type AnthropicMessage = {
  role: "user" | "assistant";
  content:
    | string
    | Array<{
        type: string;
        [key: string]: unknown;
      }>;
};

function toAnthropicMessages(messages: UIMessage[]): AnthropicMessage[] {
  const result: AnthropicMessage[] = [];

  for (const msg of messages) {
    if (msg.role === "user") {
      result.push({ role: "user", content: msg.content });
      continue;
    }

    if (msg.role === "assistant") {
      const contentBlocks: Array<{ type: string; [key: string]: unknown }> = [];
      const toolResults: Array<{ type: string; [key: string]: unknown }> = [];

      if (!msg.parts || msg.parts.length === 0) {
        if (msg.content) {
          contentBlocks.push({ type: "text", text: msg.content });
        }
      } else {
        for (const p of msg.parts) {
          if (p.type === "text" && p.text) {
            contentBlocks.push({ type: "text", text: p.text });
          } else if (p.type === "tool-invocation") {
            const inv = p.toolInvocation;
            contentBlocks.push({
              type: "tool_use",
              id: inv.toolCallId,
              name: inv.toolName,
              input: inv.args ?? {},
            });
            if (inv.state === "result" && inv.result !== undefined) {
              const raw = inv.result;
              // Screenshots come back as { type: "image", data: base64 }
              // Everything else is text
              let content:
                | string
                | Array<{ type: string; [key: string]: unknown }>;
              if (
                raw &&
                typeof raw === "object" &&
                "type" in raw &&
                raw.type === "image" &&
                "data" in raw
              ) {
                content = [
                  {
                    type: "image",
                    source: {
                      type: "base64",
                      media_type: "image/png",
                      data: (raw as { data: string }).data,
                    },
                  },
                ];
              } else {
                content =
                  typeof raw === "string" ? raw : JSON.stringify(raw);
              }
              toolResults.push({
                type: "tool_result",
                tool_use_id: inv.toolCallId,
                content,
              });
            }
          }
        }
      }

      if (contentBlocks.length > 0) {
        result.push({ role: "assistant", content: contentBlocks });
      }
      if (toolResults.length > 0) {
        result.push({ role: "user", content: toolResults });
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  let body: { messages?: UIMessage[]; sandboxId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(part("3", "Invalid JSON body"), { status: 400 });
  }

  const rawMessages = body.messages ?? [];
  const sandboxId = body.sandboxId;

  if (rawMessages.length === 0) {
    return new Response(part("3", "No messages provided"), { status: 400 });
  }
  if (!sandboxId) {
    return new Response(part("3", "No sandboxId — desktop not initialized"), {
      status: 400,
    });
  }

  const anthropicMessages = toAnthropicMessages(rawMessages);

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const write = (s: string) => writer.write(encoder.encode(s));

  (async () => {
    try {
      const currentMessages: AnthropicMessage[] = [...anthropicMessages];
      let stepCount = 0;
      const maxSteps = 30;

      while (stepCount < maxSteps) {
        stepCount++;
        const pendingToolUses: Array<{
          id: string;
          name: string;
          input: unknown;
        }> = [];

        // Stream from Anthropic Bedrock with computer use beta header
        const stream = await client.beta.messages.stream({
          model: MODEL,
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          tools: [
            {
              type: "computer_20250124",
              name: "computer",
              display_width_px: resolution.x,
              display_height_px: resolution.y,
              display_number: 1,
            },
            {
              type: "bash_20250124",
              name: "bash",
            },
          ],
          messages: currentMessages as Parameters<
            typeof client.beta.messages.stream
          >[0]["messages"],
          betas: ["computer-use-2025-01-24"],
        });

        // Stream text deltas to frontend
        stream.on("text", (delta) => {
          write(part("0", delta));
        });

        const message = await stream.finalMessage();

        // Collect tool_use blocks
        for (const block of message.content) {
          if (block.type === "tool_use") {
            pendingToolUses.push({
              id: block.id,
              name: block.name,
              input: block.input,
            });
            // Emit tool call to frontend
            write(
              part("9", {
                toolCallId: block.id,
                toolName: block.name,
                args: block.input,
              })
            );
          }
        }

        // Add assistant turn to history
        currentMessages.push({
          role: "assistant",
          content: message.content as unknown as Array<{
            type: string;
            [key: string]: unknown;
          }>,
        });

        // No tool calls — done
        if (message.stop_reason !== "tool_use" || pendingToolUses.length === 0) {
          break;
        }

        // Execute tools against the sandbox
        const toolResults: Array<{ type: string; [key: string]: unknown }> = [];

        for (const toolUse of pendingToolUses) {
          let resultContent:
            | string
            | Array<{ type: string; [key: string]: unknown }>;
          let isError = false;

          try {
            if (toolUse.name === "computer") {
              const execute = computerExecute(sandboxId);
              const raw = await execute(
                toolUse.input as Parameters<typeof execute>[0]
              );
              // Emit tool result to frontend
              write(part("a", { toolCallId: toolUse.id, result: raw }));
              // Build Anthropic tool_result content
              if (raw && typeof raw === "object" && raw.type === "image") {
                resultContent = [
                  {
                    type: "image",
                    source: {
                      type: "base64",
                      media_type: "image/png",
                      data: raw.data,
                    },
                  },
                ];
              } else if (
                raw &&
                typeof raw === "object" &&
                raw.type === "text"
              ) {
                resultContent = raw.text;
              } else {
                resultContent = JSON.stringify(raw);
              }
            } else if (toolUse.name === "bash") {
              const execute = bashExecute(sandboxId);
              const raw = await execute(
                toolUse.input as Parameters<typeof execute>[0]
              );
              write(part("a", { toolCallId: toolUse.id, result: raw }));
              resultContent = raw;
            } else {
              resultContent = `Unknown tool: ${toolUse.name}`;
              isError = true;
            }
          } catch (err) {
            resultContent =
              err instanceof Error ? err.message : String(err);
            isError = true;
            write(
              part("a", { toolCallId: toolUse.id, result: resultContent })
            );
          }

          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: resultContent,
            is_error: isError,
          });
        }

        // Add tool results as user turn for next iteration
        currentMessages.push({ role: "user", content: toolResults });

        // Emit finish_step so useChat knows this step is done
        write(part("e", { finishReason: "tool-calls" }));
      }

      write(part("e", { finishReason: "stop" }));
      write(part("d", { finishReason: "stop" }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[chat/route] error:", msg);
      try {
        write(part("3", msg));
      } catch {
        // client disconnected
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
      "Content-Type": "text/plain; charset=utf-8",
      "X-Vercel-AI-Data-Stream": "v1",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}