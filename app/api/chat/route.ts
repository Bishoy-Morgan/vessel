import { createBedrockAnthropic } from "@ai-sdk/amazon-bedrock/anthropic";
import { streamText, UIMessage } from "ai";
import { killDesktop } from "@/lib/sandbox/utils";
import { computerExecute, bashExecute } from "@/lib/sandbox/tool";
import { prunedMessages } from "@/lib/utils";

export const maxDuration = 300;

const bedrockAnthropic = createBedrockAnthropic({
  region: "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
});

export async function POST(req: Request) {
  const { messages, sandboxId }: { messages: UIMessage[]; sandboxId: string } =
    await req.json();

  try {
    const result = streamText({
      model: bedrockAnthropic("us.anthropic.claude-sonnet-4-5-20250929-v1:0"),
      system:
        "Never describe your actions in text. Only use the provided tools directly without narrating what you are doing. " +
        "You are a helpful assistant with access to a computer. " +
        "Use the computer tool to help the user with their requests. " +
        "Use the bash tool to execute commands on the computer. You can create files and folders using the bash tool. Always prefer the bash tool where it is viable for the task. " +
        "Be sure to advise the user when waiting is necessary. " +
        "If the browser opens with a setup wizard, YOU MUST IGNORE IT and move straight to the next step (e.g. input the url in the search bar).",
      messages: prunedMessages(messages),
      tools: {
        computer: bedrockAnthropic.tools.computer_20250124({
          displayWidthPx: 1024,
          displayHeightPx: 768,
          displayNumber: 1,
          execute: computerExecute(sandboxId),
          experimental_toToolResultContent(result) {
            if (typeof result === "string") {
              return [{ type: "text", text: result }];
            }
            if (result.type === "image" && result.data) {
              return [{ type: "image", data: result.data, mimeType: "image/png" }];
            }
            if (result.type === "text" && result.text) {
              return [{ type: "text", text: result.text }];
            }
            throw new Error("Invalid computer tool result format");
          },
        }),
        bash: bedrockAnthropic.tools.bash_20250124({
          execute: bashExecute(sandboxId),
        }),
      },
      maxSteps: 30,
    });

    return result.toDataStreamResponse({
      getErrorMessage(error: unknown) {
        console.error(error);
        return error instanceof Error ? error.message : String(error);
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    await killDesktop(sandboxId);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}