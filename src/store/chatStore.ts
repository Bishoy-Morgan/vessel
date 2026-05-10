import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ChatStoreState, Session } from '../types'
import type { Message as AIMessage } from 'ai'

interface ChatStore extends ChatStoreState {
    createSession: (name: string) => void
    addMessage: (sessionId: string, message: AIMessage) => void
    setActiveSession: (sessionId: string) => void
    deleteSession: (sessionId: string) => void
    updateSession: (id: string, updates: Partial<Session>) => void
}

export const useChatStore = create<ChatStore>()(
    persist(
        (set) => ({
            sessions: [],
            activeSessionId: null,
            createSession: (name: string) => set((state) => ({ sessions: [...state.sessions, { id: crypto.randomUUID(), name, messages: [], createdAt: Date.now(), updatedAt: Date.now() }] })),
            addMessage: (sessionId: string, message: AIMessage) => set((state) => ({ sessions: state.sessions.map((s) => s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s) })),
            setActiveSession: (sessionId: string) => set({ activeSessionId: sessionId }),
            deleteSession: (sessionId: string) => set((state) => ({ sessions: state.sessions.filter((s) => s.id !== sessionId) })),
            updateSession: (id: string, updates: Partial<Session>) => set((state) => ({ sessions: state.sessions.map((s) => s.id === id ? { ...s, ...updates } : s) })),
        }),
        { name: 'chat-sessions' }
    )
)