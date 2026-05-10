import type { Message } from 'ai'

export type ActionType = 'computer' | 'bash'

export type EventStatus = 'pending' | 'running' | 'success' | 'error' | 'aborted'

export interface AgentEvent {
  id: string
  timestamp: number
  endTime?: number
  type: ActionType
  payload: Record<string, unknown>
  status: EventStatus
  duration?: number
}

export type ToolCall = ComputerToolCall | BashToolCall

export interface ComputerToolCall {
  type: 'computer'
  action: 'screenshot' | 'left_click' | 'right_click' | 'double_click' | 'middle_click' | 'scroll' | 'key' | 'type' | 'cursor_position' | 'left_click_drag'
  coordinate?: [number, number]
  text?: string
}

export interface BashToolCall {
  type: 'bash'
  command: string
}

export interface Session {
  id: string
  name: string
  messages: Message[] 
  createdAt: number
  updatedAt: number
}

export interface EventStoreState {
  events: AgentEvent[]
  countsByType: Record<ActionType, number>
  agentStatus: 'idle' | 'running' | 'error'
}

export interface ChatStoreState {
  sessions: Session[]
  activeSessionId: string | null
}