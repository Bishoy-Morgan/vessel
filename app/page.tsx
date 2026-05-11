"use client";

import { PreviewMessage } from "@/components/message";
import { getDesktopURL } from "@/lib/sandbox/utils";
import { useScrollToBottom } from "@/lib/use-scroll-to-bottom";
import { useChat } from "@ai-sdk/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AISDKLogo } from "@/components/icons";
import { PromptSuggestions } from "@/components/prompt-suggestions";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ABORTED } from "@/lib/utils";
import VNCViewer from "@/components/VNCViewer";
import SessionSidebar from "@/components/SessionSidebar";
import DebugPanel from "@/components/DebugPanel";
import ToolCallDetails from "@/components/ToolCallDetails";
import { useEventStore } from "@/src/store/eventStore";
import { useChatStore } from "@/src/store/chatStore";
import { ToolCall } from "@/src/types";

export default function Chat() {
  const [desktopContainerRef, desktopEndRef] = useScrollToBottom();
  const [isInitializing, setIsInitializing] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [selectedToolCall, setSelectedToolCall] = useState<ToolCall | null>(null);

  const onToolCallSelect = useCallback((toolCall: ToolCall) => {
    setSelectedToolCall(toolCall);
  }, []);

  const { addEvent } = useEventStore();
  const { sessions, activeSessionId, createSession, updateSession } = useChatStore();
  const activeSession = sessions.find(s => s.id === activeSessionId);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    stop: stopGeneration,
    append,
    setMessages,
  } = useChat({
    api: "/api/chat",
    id: activeSessionId ?? undefined,
    body: { sandboxId },
    maxSteps: 30,
    onToolCall: ({ toolCall }) => {
      addEvent({
        id: toolCall.toolCallId,
        timestamp: Date.now(),
        type: toolCall.toolName as 'computer' | 'bash',
        payload: toolCall.args as Record<string, unknown>,
        status: 'running',
      });
    },
    onFinish: (message) => {
      message.parts?.forEach((part) => {
        if (part.type === 'tool-invocation') {
          const { toolCallId, state } = part.toolInvocation;
          const endTime = Date.now();
          const event = useEventStore.getState().events.find(e => e.id === toolCallId);
          if (event) {
            useEventStore.getState().updateEvent(toolCallId, {
              status: state === 'result' ? 'success' : 'error',
              endTime,
              duration: endTime - event.timestamp,
            });
          }
        }
      });
    
      if (activeSessionId) {
        updateSession(activeSessionId, {
          messages: messagesRef.current,
          updatedAt: Date.now(),
        });
      }
    },
    onError: (error) => {
      console.error(error);
      toast.error("There was an error", {
        description: "Please try again later.",
        richColors: true,
        position: "top-center",
      });
    },
  });

  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const handleSubmitWithClear = (e: React.FormEvent<HTMLFormElement>) => {
    useEventStore.getState().clearEvents();
    handleSubmit(e);
  };

  // Sync messages when active session changes
  useEffect(() => {
    if (activeSession) {
      setMessages(activeSession.messages);
    } else {
      setMessages([]);
    }
  }, [activeSessionId]); // eslint-disable-line react-hooks/exhaustive-deps -- activeSession and setMessages intentionally omitted: activeSession is a derived object (new ref each render), setMessages is stable but not memoized by SDK

  const stop = () => {
    stopGeneration();
    const lastMessage = messages.at(-1);
    const lastMessageLastPart = lastMessage?.parts.at(-1);
    if (
      lastMessage?.role === "assistant" &&
      lastMessageLastPart?.type === "tool-invocation"
    ) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          ...lastMessage,
          parts: [
            ...lastMessage.parts.slice(0, -1),
            {
              ...lastMessageLastPart,
              toolInvocation: {
                ...lastMessageLastPart.toolInvocation,
                state: "result",
                result: ABORTED,
              },
            },
          ],
        },
      ]);
    }
  };

  const isLoading = status !== "ready";

  const refreshDesktop = async () => {
    try {
      setIsInitializing(true);
      const { streamUrl, id } = await getDesktopURL(sandboxId || undefined);
      setStreamUrl(streamUrl);
      setSandboxId(id);
    } catch (err) {
      console.error("Failed to refresh desktop:", err);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (!sandboxId) return;
    const killDesktop = () => {
      navigator.sendBeacon(`/api/kill-desktop?sandboxId=${encodeURIComponent(sandboxId)}`);
    };
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIOS || isSafari) {
      window.addEventListener("pagehide", killDesktop);
      return () => { window.removeEventListener("pagehide", killDesktop); killDesktop(); };
    } else {
      window.addEventListener("beforeunload", killDesktop);
      return () => { window.removeEventListener("beforeunload", killDesktop); killDesktop(); };
    }
  }, [sandboxId]);

  useEffect(() => {
    const init = async () => {
      try {
        setIsInitializing(true);
        const { streamUrl, id } = await getDesktopURL(sandboxId ?? undefined);
        setStreamUrl(streamUrl);
        setSandboxId(id);
        
        const { sessions, activeSessionId, updateSession, setActiveSession } = useChatStore();
        if (sessions.length === 0) {
          createSession('Chat 1');
        } else if (!activeSessionId) {
          setActiveSession(sessions[0].id);
        }
      } catch (err) {
        console.error("Failed to initialize desktop:", err);
        toast.error("Failed to initialize desktop");
      } finally {
        setIsInitializing(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-dvh bg-black">

      {/* Session Sidebar */}
      <SessionSidebar />

      {/* Main resizable area (z-0 so sidebar toggle isn’t covered along the seam) */}
      <div className="relative z-0 flex-1 hidden xl:flex">
        <ResizablePanelGroup direction="horizontal" className="h-full">

          {/* LEFT PANEL: Chat + Debug */}
          <ResizablePanel defaultSize={35} minSize={25} className="flex flex-col bg-[#0a0a0a]">

            {/* Header */}
            <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center justify-between shrink-0">
              <AISDKLogo />
              <span className="text-xs text-[#71717a] font-mono">AI Agent Dashboard</span>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0"
              ref={desktopContainerRef}
            >
              {messages.map((message, i) => (
                <PreviewMessage
                  message={message}
                  key={message.id}
                  isLoading={isLoading}
                  status={status}
                  isLatestMessage={i === messages.length - 1}
                  onToolCallSelect={setSelectedToolCall}
                />
              ))}
              <div ref={desktopEndRef} className="pb-2" />
            </div>

            {messages.length === 0 && (
              <PromptSuggestions
                disabled={isInitializing}
                submitPrompt={(prompt: string) => append({ role: "user", content: prompt })}
              />
            )}

            {/* Input */}
            <div className="border-t border-[#1a1a1a] bg-[#0a0a0a] p-4 shrink-0">
              <form onSubmit={handleSubmitWithClear}>
                <Input
                  handleInputChange={handleInputChange}
                  input={input}
                  isInitializing={isInitializing}
                  isLoading={isLoading}
                  status={status}
                  stop={stop}
                />
              </form>
            </div>

            {/* Debug Panel */}
            <DebugPanel />

          </ResizablePanel>

          <ResizableHandle className="bg-[#1a1a1a] hover:bg-[#2563eb] transition-colors w-[2px]" />

          {/* RIGHT PANEL: VNC + Tool Call Details */}
          <ResizablePanel defaultSize={65} minSize={40} className="flex flex-col bg-black">

            {/* VNC Viewer */}
            <div className="flex-1 relative min-h-0">
              <VNCViewer
                streamUrl={streamUrl ?? ''}
                isInitializing={isInitializing}
              />
              <Button
                onClick={refreshDesktop}
                className="absolute top-3 right-3 bg-black/60 hover:bg-[#2563eb] border border-[#1a1a1a] hover:border-[#2563eb] text-white px-3 py-1.5 rounded-md text-xs z-10 transition-all"
                disabled={isInitializing}
              >
                {isInitializing ? "Initializing..." : "New desktop"}
              </Button>
            </div>

            {/* Tool Call Details */}
            <div className="h-48 border-t border-[#1a1a1a] shrink-0">
              <ToolCallDetails toolCall={selectedToolCall} />
            </div>

          </ResizablePanel>

        </ResizablePanelGroup>
      </div>

      {/* Mobile View */}
      <div className="flex-1 xl:hidden flex flex-col bg-[#0a0a0a]">
        <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center justify-between">
          <AISDKLogo />
          <span className="text-xs text-[#71717a]">Mobile Mode</span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((message, i) => (
            <PreviewMessage
              message={message}
              key={message.id}
              isLoading={isLoading}
              status={status}
              isLatestMessage={i === messages.length - 1}
              onToolCallSelect={onToolCallSelect}
            />
          ))}
        </div>
        <div className="border-t border-[#1a1a1a] p-4">
          <form onSubmit={handleSubmitWithClear}>
            <Input
              handleInputChange={handleInputChange}
              input={input}
              isInitializing={isInitializing}
              isLoading={isLoading}
              status={status}
              stop={stop}
            />
          </form>
        </div>
      </div>

    </div>
  );
}