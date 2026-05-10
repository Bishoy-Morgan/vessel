'use client'

import { useState } from 'react'
import { useChatStore } from '@/src/store/chatStore'
import { ChevronLeft, ChevronRight, MessageSquare, Plus } from 'lucide-react'

export default function SessionSidebar() {
  const { sessions, activeSessionId, createSession, deleteSession, setActiveSession } = useChatStore()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={`relative flex flex-col h-full border-r border-[#1a1a1a] bg-[#0a0a0a] transition-all duration-300 ${
        collapsed ? 'w-12' : 'w-64'
      }`}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[10%] z-10 flex items-center justify-center w-6 h-6 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#2563eb] hover:bg-[#111111] transition-all"
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3 text-[#71717a]" />
          : <ChevronLeft className="w-3 h-3 text-[#71717a]" />
        }
      </button>

      {/* Header */}
      <div className={`px-3 py-4 border-b border-[#1a1a1a] flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <span className="text-xs font-medium text-[#71717a] uppercase tracking-wider">Sessions</span>
        )}
        <button
          type="button"
          onClick={() => createSession(`Chat ${sessions.length + 1}`)}
          className="flex items-center justify-center w-7 h-7 rounded-md bg-[#111111] border border-[#1a1a1a] hover:border-[#2563eb] hover:bg-[#2563eb]/10 transition-all"
          title="New Session"
        >
          <Plus className="w-3.5 h-3.5 text-[#71717a] hover:text-[#2563eb]" />
        </button>
      </div>

      {/* Sessions list */}
      {!collapsed && (
        <ul className="flex flex-col gap-0.5 flex-1 overflow-y-auto p-2">
          {sessions.length === 0 && (
            <li className="text-xs text-[#71717a] text-center py-4">No sessions yet</li>
          )}
          {sessions.map((session) => (
            <li
              key={session.id}
              onClick={() => setActiveSession(session.id)}
              className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-xs transition-all ${
                session.id === activeSessionId
                  ? 'bg-[#2563eb]/10 border border-[#2563eb]/30 text-white'
                  : 'text-[#71717a] hover:bg-[#111111] hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare className={`w-3 h-3 shrink-0 ${session.id === activeSessionId ? 'text-[#2563eb]' : 'text-[#71717a]'}`} />
                <span className="truncate">{session.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteSession(session.id)
                }}
                className="ml-1 opacity-0 group-hover:opacity-100 text-[#71717a] hover:text-red-400 transition-all shrink-0"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Collapsed icons */}
      {collapsed && (
        <ul className="flex flex-col items-center gap-1 p-2 flex-1 overflow-y-auto">
          {sessions.map((session) => (
            <li
              key={session.id}
              onClick={() => setActiveSession(session.id)}
              title={session.name}
              className={`flex items-center justify-center w-7 h-7 rounded-md cursor-pointer transition-all ${
                session.id === activeSessionId
                  ? 'bg-[#2563eb]/10 border border-[#2563eb]/30'
                  : 'hover:bg-[#111111] border border-transparent'
              }`}
            >
              <MessageSquare className={`w-3.5 h-3.5 ${session.id === activeSessionId ? 'text-[#2563eb]' : 'text-[#71717a]'}`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}