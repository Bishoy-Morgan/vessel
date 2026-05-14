"use client";

import type { Message } from "ai";
import { AnimatePresence, motion } from "motion/react";
import { memo } from "react";
import equal from "fast-deep-equal";
import { Streamdown } from "streamdown";

import { ABORTED, cn } from "@/lib/utils";
import type { ToolCall } from "@/src/types";
import {
  Camera,
  CheckCircle,
  CircleSlash,
  Clock,
  Keyboard,
  KeyRound,
  Loader2,
  MousePointer,
  MousePointerClick,
  ScrollText,
  StopCircle,
} from "lucide-react";
import Image from "next/image";

const PurePreviewMessage = ({
  message,
  isLatestMessage,
  status,
  onToolCallSelect,
}: {
  message: Message;
  isLoading: boolean;
  status: "error" | "submitted" | "streaming" | "ready";
  isLatestMessage: boolean;
  onToolCallSelect?: (toolCall: ToolCall) => void;
}) => {
  return (
    <AnimatePresence key={message.id}>
      <motion.div
        className="w-full mx-auto group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        key={`message-${message.id}`}
        data-role={message.role}
      >
        <div
          className={cn(
            "flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl",
            "group-data-[role=user]/message:w-fit",
          )}
        >
          <div className="flex flex-col w-full">
            {message.parts?.map((part, i) => {
              switch (part.type) {
                case "text":
                  return (
                    <motion.div
                      initial={{ y: 5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      key={`message-${message.id}-part-${i}`}
                      className="flex flex-row gap-2 items-start w-full pb-4"
                    >
                      <div
                        className={cn("flex flex-col gap-4 text-sm text-white", {
                          "bg-[#111111] border border-[#1a1a1a] px-3 py-2 rounded-xl text-white":
                            message.role === "user",
                        })}
                      >
                        <Streamdown>{part.text}</Streamdown>
                      </div>
                    </motion.div>
                  );

                case "tool-invocation":
                  const { toolName, toolCallId, state, args } = part.toolInvocation;

                  if (toolName === "computer") {
                    const { action, coordinate, text, duration, scroll_amount, scroll_direction } = args;
                    let actionLabel = "";
                    let actionDetail = "";
                    let ActionIcon = null;

                    switch (action) {
                      case "screenshot":
                        actionLabel = "Taking screenshot";
                        ActionIcon = Camera;
                        break;
                      case "left_click":
                        actionLabel = "Left clicking";
                        actionDetail = coordinate ? `at (${coordinate[0]}, ${coordinate[1]})` : "";
                        ActionIcon = MousePointer;
                        break;
                      case "right_click":
                        actionLabel = "Right clicking";
                        actionDetail = coordinate ? `at (${coordinate[0]}, ${coordinate[1]})` : "";
                        ActionIcon = MousePointerClick;
                        break;
                      case "double_click":
                        actionLabel = "Double clicking";
                        actionDetail = coordinate ? `at (${coordinate[0]}, ${coordinate[1]})` : "";
                        ActionIcon = MousePointerClick;
                        break;
                      case "mouse_move":
                        actionLabel = "Moving mouse";
                        actionDetail = coordinate ? `to (${coordinate[0]}, ${coordinate[1]})` : "";
                        ActionIcon = MousePointer;
                        break;
                      case "type":
                        actionLabel = "Typing";
                        actionDetail = text ? `"${text}"` : "";
                        ActionIcon = Keyboard;
                        break;
                      case "key":
                        actionLabel = "Pressing key";
                        actionDetail = text ? `"${text}"` : "";
                        ActionIcon = KeyRound;
                        break;
                      case "wait":
                        actionLabel = "Waiting";
                        actionDetail = duration ? `${duration}s` : "";
                        ActionIcon = Clock;
                        break;
                      case "scroll":
                        actionLabel = "Scrolling";
                        actionDetail = scroll_direction && scroll_amount ? `${scroll_direction} by ${scroll_amount}` : "";
                        ActionIcon = ScrollText;
                        break;
                      default:
                        actionLabel = action;
                        ActionIcon = MousePointer;
                        break;
                    }

                    return (
                      <motion.div
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        key={`message-${message.id}-part-${i}`}
                        role={onToolCallSelect ? "button" : undefined}
                        tabIndex={onToolCallSelect ? 0 : undefined}
                        className={`flex flex-col gap-2 p-2 mb-2 text-sm bg-[#0a0a0a] rounded-lg border border-[#1a1a1a] ${
                          onToolCallSelect ? "cursor-pointer hover:border-[#2563eb] transition-colors" : ""
                        }`}
                        onClick={
                          onToolCallSelect
                            ? () => onToolCallSelect({
                                type: "computer",
                                action,
                                ...(coordinate !== undefined ? { coordinate } : {}),
                                ...(text !== undefined ? { text } : {}),
                              })
                            : undefined
                        }
                        onKeyDown={
                          onToolCallSelect
                            ? (e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  onToolCallSelect({
                                    type: "computer",
                                    action,
                                    ...(coordinate !== undefined ? { coordinate } : {}),
                                    ...(text !== undefined ? { text } : {}),
                                  });
                                }
                              }
                            : undefined
                        }
                      >
                        <div className="flex-1 flex items-center gap-3">
                          <div className="flex items-center justify-center w-7 h-7 bg-[#111111] border border-[#1a1a1a] rounded-full shrink-0">
                            {ActionIcon && <ActionIcon className="w-3.5 h-3.5 text-[#2563eb]" />}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium font-mono text-white text-xs flex items-baseline gap-2">
                              {actionLabel}
                              {actionDetail && (
                                <span className="text-[#71717a] font-normal">{actionDetail}</span>
                              )}
                            </div>
                          </div>
                          <div className="w-5 h-5 flex items-center justify-center shrink-0">
                            {state === "call" ? (
                              isLatestMessage && status !== "ready" ? (
                                <Loader2 className="animate-spin h-4 w-4 text-[#2563eb]" />
                              ) : (
                                <StopCircle className="h-4 w-4 text-red-500" />
                              )
                            ) : state === "result" ? (
                              part.toolInvocation.result === ABORTED ? (
                                <CircleSlash size={14} className="text-amber-500" />
                              ) : (
                                <CheckCircle size={14} className="text-emerald-500" />
                              )
                            ) : null}
                          </div>
                        </div>
                        {state === "result" ? (
                          part.toolInvocation.result.type === "image" && (
                            <div className="p-1">
                              <Image
                                src={`data:image/png;base64,${part.toolInvocation.result.data}`}
                                alt="Screenshot"
                                className="w-full aspect-1024/768 rounded-sm border border-[#1a1a1a]"
                              />
                            </div>
                          )
                        ) : action === "screenshot" ? (
                          <div className="w-full aspect-1024/768 rounded-sm bg-[#111111] animate-pulse border border-[#1a1a1a]"></div>
                        ) : null}
                      </motion.div>
                    );
                  }

                  if (toolName === "bash") {
                    const { command } = args;
                    return (
                      <motion.div
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        key={`message-${message.id}-part-${i}`}
                        role={onToolCallSelect ? "button" : undefined}
                        tabIndex={onToolCallSelect ? 0 : undefined}
                        className={`flex items-center gap-3 p-2 mb-2 text-sm bg-[#0a0a0a] rounded-lg border border-[#1a1a1a] ${
                          onToolCallSelect ? "cursor-pointer hover:border-[#2563eb] transition-colors" : ""
                        }`}
                        onClick={onToolCallSelect ? () => onToolCallSelect({ type: "bash", command }) : undefined}
                        onKeyDown={
                          onToolCallSelect
                            ? (e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  onToolCallSelect({ type: "bash", command });
                                }
                              }
                            : undefined
                        }
                      >
                        <div className="flex items-center justify-center w-7 h-7 bg-[#111111] border border-[#1a1a1a] rounded-full shrink-0">
                          <ScrollText className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-xs text-white flex items-baseline gap-2">
                            <span className="text-emerald-500 shrink-0">$</span>
                            <span className="text-[#71717a] truncate">{command.slice(0, 60)}</span>
                          </div>
                        </div>
                        <div className="w-5 h-5 flex items-center justify-center shrink-0">
                          {state === "call" ? (
                            isLatestMessage && status !== "ready" ? (
                              <Loader2 className="animate-spin h-4 w-4 text-[#2563eb]" />
                            ) : (
                              <StopCircle className="h-4 w-4 text-red-500" />
                            )
                          ) : state === "result" ? (
                            <CheckCircle size={14} className="text-emerald-500" />
                          ) : null}
                        </div>
                      </motion.div>
                    );
                  }

                  return (
                    <div key={toolCallId} className="text-xs text-[#71717a] font-mono p-2">
                      <h3>{toolName}: {state}</h3>
                      <pre>{JSON.stringify(args, null, 2)}</pre>
                    </div>
                  );

                default:
                  return null;
              }
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.status !== nextProps.status) return false;
    if (prevProps.onToolCallSelect !== nextProps.onToolCallSelect) return false;
    if (prevProps.message.annotations !== nextProps.message.annotations) return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    return true;
  },
);