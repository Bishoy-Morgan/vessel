import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Message as AIMessage } from 'ai'
import { ChatStoreState, Session } from '../types'

// Types
interface ChatStore extends ChatStoreState {
  createSession: (name: string) => void
  addMessage: (sessionId: string, message: AIMessage) => void
  setActiveSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
  updateSession: (id: string, updates: Partial<Session>) => void
}

// Store
export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      sessions: [],
      activeSessionId: null,

      createSession: (name) => set((state) => {
        const newSession: Session = {
          id: crypto.randomUUID(),
          name,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        return {
          sessions: [...state.sessions, newSession],
          activeSessionId: newSession.id,
        }
      }),

      addMessage: (sessionId, message) => set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId
            ? { ...s, messages: [...s.messages, message] }
            : s
        ),
      })),

      setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),

      deleteSession: (sessionId) => set((state) => {
        const remaining = state.sessions.filter((s) => s.id !== sessionId)

        const newActiveId = state.activeSessionId === sessionId
          ? (remaining.length > 0 ? remaining[remaining.length - 1].id : null)
          : state.activeSessionId

        return {
          sessions: remaining,
          activeSessionId: newActiveId,
        }
      }),

      updateSession: (id, updates) => set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      })),
    }),
    { name: 'chat-sessions' }
  )
)