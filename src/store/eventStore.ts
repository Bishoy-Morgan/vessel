import { create } from 'zustand'
import { ActionType, AgentEvent, EventStoreState } from '../types'

interface EventStore extends EventStoreState {
  addEvent: (event: AgentEvent) => void
  updateEvent: (id: string, updates: Partial<AgentEvent>) => void
  clearEvents: () => void
}

export const useEventStore = create<EventStore>((set) => ({
  events: [],
  countsByType: { computer: 0, bash: 0 },
  agentStatus: 'idle',
  
  addEvent: (event: AgentEvent) => set((state) => ({
    events: [...state.events, event],
    countsByType: {
      ...state.countsByType,
      [event.type as ActionType]: state.countsByType[event.type as ActionType] + 1
    },
    agentStatus: 'running'
  })),

  updateEvent: (id: string, updates: Partial<AgentEvent>) => set((state) => ({
    events: state.events.map((e) => e.id === id ? { ...e, ...updates } : e)
  })),

  clearEvents: () => set({ events: [], countsByType: { computer: 0, bash: 0 }, agentStatus: 'idle' }),
}))