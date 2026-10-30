"use client";

import { PreviewMessage } from "@/components/message";
import { getDesktopURL } from "@/lib/sandbox/utils";
import { useScrollToBottom } from "@/lib/use-scroll-to-bottom";
import { useChat } from "@ai-sdk/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ChatHeader from "@/components/ChatHeader";
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
import { ComputerToolCall, ToolCall } from "@/src/types";

export default function Chat() {
  const [desktopContainerRef, desktopEndRef] = useScrollToBottom();
  const [sandboxToken, setSandboxToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [selectedToolCall, setSelectedToolCall] = useState<ToolCall | null>(null);

  const onToolCallSelect = useCallback((toolCall: ToolCall) => {
    setSelectedToolCall(toolCall);
  }, []);

  const { addEvent, clearEvents } = useEventStore();
  const { sessions, activeSessionId, updateSession } = useChatStore();
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
    // All tool rounds happen inside `/api/chat` (server-side loop). Setting maxSteps > 1 makes
    // useChat POST again after each completed assistant; that second request corrupts screenshot
    // tool results in history (they get JSON-stringified) and wastes calls.
    maxSteps: 1,
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
        const currentMessages = messagesRef.current;
        const session = useChatStore.getState().sessions.find(s => s.id === activeSessionId);
        const isFirstExchange = currentMessages.length <= 2;
        const firstUserMsg = currentMessages.find(m => m.role === 'user');
    
        if (session && isFirstExchange && firstUserMsg?.content) {
          const raw = typeof firstUserMsg.content === 'string'
            ? firstUserMsg.content.slice(0, 40)
            : 'New Chat';
          const name = raw.charAt(0).toUpperCase() + raw.slice(1);
          updateSession(activeSessionId, { name, messages: currentMessages, updatedAt: Date.now() });
        } else {
          updateSession(activeSessionId, { messages: currentMessages, updatedAt: Date.now() });
        }
      }
    },
    onError: (error) => {
      console.error(error);
      const text = error.message && error.message.length < 200 ? error.message : "There was an error";
      toast.error(text, { richColors: true, position: "top-center" });
    },
  });

  const deskPromise = useRef<Promise<{ id: string; token: string } | null> | null>(null);

  const ensureDesktop = (force = false) => {
    if (!force && sandboxId && sandboxToken) {
      return Promise.resolve({ id: sandboxId, token: sandboxToken });
    }
    if (deskPromise.current) return deskPromise.current;

    deskPromise.current = (async () => {
      setIsInitializing(true);
      try {
        const res = await getDesktopURL(force ? undefined : sandboxId ?? undefined);
        if (!res.ok) {
          toast.error(res.error, { richColors: true, position: "top-center" });
          return null;
        }
        setStreamUrl(res.streamUrl);
        setSandboxId(res.id);
        setSandboxToken(res.token);
        return { id: res.id, token: res.token };
      } finally {
        setIsInitializing(false);
        deskPromise.current = null;
      }
    })();

    return deskPromise.current;
  };

  const refreshDesktop = () => ensureDesktop(true);

  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const handleSubmitWithClear = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    useEventStore.getState().clearEvents();
    const desk = await ensureDesktop();
    if (!desk) return;
    handleSubmit(e, { body: { sandboxId: desk.id, sandboxToken: desk.token } });
  };

  // Sync messages when active session changes
  useEffect(() => {
    if (activeSession) {
      setMessages(activeSession.messages);
    } else {
      setMessages([]);
    }
    clearEvents();
  }, [activeSessionId]); // eslint-disable-line react-hooks/exhaustive-deps
  
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

  useEffect(() => {
    if (!sandboxId) return;
    const killDesktop = () => {
      navigator.sendBeacon(
        "/api/kill-desktop",
        new Blob([JSON.stringify({ sandboxId, token: sandboxToken })], { type: "application/json" }),
      );
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
  }, [sandboxId, sandboxToken]);

  useEffect(() => {
    const { sessions, activeSessionId, createSession, setActiveSession } = useChatStore.getState();
    if (sessions.length === 0) {
      const time = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      createSession(`Chat ${time}`);
    } else if (!activeSessionId) {
      setActiveSession(sessions[0].id);
    }
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
            <ChatHeader
              sessionName={activeSession?.name}
              status={status}
              isInitializing={isInitializing}
            />

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
                submitPrompt={async (prompt: string) => {
                  const desk = await ensureDesktop();
                  if (!desk) return;
                  append(
                    { role: "user", content: prompt },
                    { body: { sandboxId: desk.id, sandboxToken: desk.token } },
                  );
                }}
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

            <DebugPanel onSelectEvent={(event) => {
              if (event.type === 'computer') {
                setSelectedToolCall({
                  type: 'computer',
                  action: (event.payload.action as ComputerToolCall['action']) ?? 'screenshot',
                  coordinate: event.payload.coordinate as [number, number] | undefined,
                  text: event.payload.text as string | undefined,
                })
              } else if (event.type === 'bash') {
                setSelectedToolCall({
                  type: 'bash',
                  command: (event.payload.command as string) ?? '',
                })
              }
            }} />

          </ResizablePanel>

          <ResizableHandle className="bg-[#1a1a1a] hover:bg-[#2563eb] transition-colors w-0.5" />

          {/* RIGHT PANEL: VNC + Tool Call Details */}
          <ResizablePanel defaultSize={65} minSize={40} className="flex flex-col bg-black">

            {/* VNC Viewer */}
            <div className="flex-1 relative min-h-0">
              {streamUrl ? (
                <VNCViewer streamUrl={streamUrl} isInitializing={isInitializing} />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[#71717a]">
                  {isInitializing ? "Starting your desktop…" : "Your desktop starts when you send your first message."}
                </div>
              )}
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
          <ChatHeader
            sessionName={activeSession?.name}
            status={status}
            isInitializing={isInitializing}
          />
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