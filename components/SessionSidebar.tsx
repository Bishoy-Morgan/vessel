'use client'

import { useState } from 'react'
import { useChatStore } from '@/src/store/chatStore'
import { ChevronLeft, ChevronRight, MessageSquare, Plus, Pencil, Check, X, Trash2 } from 'lucide-react'
import Image from 'next/image'

export default function SessionSidebar() {
  const { sessions, activeSessionId, createSession, deleteSession, setActiveSession, updateSession } = useChatStore()
  const [collapsed, setCollapsed] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleNewSession = () => {
    const time = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
    createSession(`New Session ${time}`)
  }

  const startRename = (e: React.MouseEvent, id: string, currentName: string) => {
    e.stopPropagation()
    setEditingId(id)
    setEditingName(currentName)
  }

  const confirmRename = (e: React.MouseEvent | React.KeyboardEvent, id: string) => {
    e.stopPropagation()
    if (editingName.trim()) {
      updateSession(id, { name: editingName.trim() })
    }
    setEditingId(null)
  }

  return (
    <div
      className={`relative z-40 flex flex-col h-full overflow-visible border-r border-[#1a1a1a] transition-all duration-300 ${
        collapsed ? 'w-14' : 'w-72'
      }`}
    >
      {/* Blue (bottom-left) → black (top-right) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden bg-black" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden bg-linear-to-tr from-[#2563eb]/50 via-[#080808] to-black"
        aria-hidden
      />

      {/* Collapse toggle — high z so it isn’t covered by the chat panel header (sibling paints later in DOM) */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-1/5 z-50 flex size-7 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#141414] text-[#71717a] hover:border-[#2563eb] hover:text-[#a1a1aa]"
      >
        {collapsed
          ? <ChevronRight className="w-4 h-4 text-[#71717a]" />
          : <ChevronLeft className="w-4 h-4 text-[#71717a]" />
        }
      </button>

      {/* Header */}
      <div className={`relative z-10 p-3 flex items-center`}>
        {collapsed ? (
          <Image 
            src="/images/energentSymbol.png"
            alt='Energent Symbol'
            width={36}
            height={36}
          />
        ) : (
          <Image 
            src="/images/energentLogo.png"
            alt='Energent Logo'
            width={180}
            height={36}
          />
        )}
      </div>

      {/* Header */}
      <div className={`relative z-10 p-3 flex items-center gap-x-3 mt-2`}>
        <button
          type="button"
          onClick={handleNewSession}
          className="flex size-8 cursor-pointer shrink-0 items-center justify-center rounded-full border border-[#2563eb]/40 bg-black text-[#93c5fd] hover:bg-[#2563eb]/15"
          title="New Session"
        >
          <Plus className="size-5" strokeWidth={2} aria-hidden />
        </button>
        {!collapsed && (
          <span className="text-sm font-medium text-[#71717a] uppercase tracking-wider">Add Session</span>
        )}
      </div>

      {/* Sessions list */}
      {!collapsed && (
        <ul className="relative z-10 flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto px-3 py-2 mt-4">
          <span className='text-xs text-[#71717a] inline-block'>Recents</span>
          {sessions.length === 0 && (
            <li className="text-xs text-[#71717a] text-center py-4">No sessions yet</li>
          )}
          {sessions.map((session) => (
            <li
              key={session.id}
              onClick={() => setActiveSession(session.id)}
              className={`group flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-all cursor-pointer ${
                session.id === activeSessionId
                  ? 'border border-[#2563eb]/30 bg-[#2563eb]/10 text-white'
                  : 'border border-transparent text-[#71717a] hover:bg-[#111111] hover:text-white'
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <MessageSquare className={`size-4 shrink-0 ${session.id === activeSessionId ? 'text-[#2563eb]' : 'text-[#71717a]'}`} />
                {editingId === session.id ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmRename(e, session.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    className="w-full border-b border-[#2563eb] bg-transparent text-sm text-white outline-none"
                  />
                ) : (
                  <span className="truncate">{session.name}</span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {editingId === session.id ? (
                  <button
                    type="button"
                    onClick={(e) => confirmRename(e, session.id)}
                    className="p-1 hover:text-[#2563eb] text-white cursor-pointer"
                    title="Save"
                  >
                    <Check className="size-4" strokeWidth={2} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => startRename(e, session.id, session.name)}
                    className="p-1 text-[#71717a] opacity-0 hover:text-white group-hover:opacity-100 cursor-pointer"
                    title="Rename"
                  >
                    <Pencil className="size-4" strokeWidth={2} />
                  </button>
                )}
                {confirmDeleteId === session.id ? (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSession(session.id)
                        setConfirmDeleteId(null)
                      }}
                      className="p-1 text-[#71717a] hover:text-red-700 cursor-pointer"
                      title="Confirm delete"
                    >
                      <Check className="size-4" strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setConfirmDeleteId(null)
                      }}
                      className="p-1 text-[#71717a] hover:text-white cursor-pointer"
                      title="Cancel"
                    >
                      <X className="size-4" strokeWidth={2} />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setConfirmDeleteId(session.id)
                    }}
                    title="Delete"
                    className="p-1 text-[#71717a] opacity-0 hover:text-red-400 group-hover:opacity-100 cursor-pointer"
                  >
                    <Trash2 className="size-4" strokeWidth={2} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Collapsed icons */}
      {collapsed && (
        <ul className="relative z-10 flex flex-1 min-h-0 flex-col items-center gap-2 overflow-y-auto p-2">
          {sessions.map((session) => (
            <li
              key={session.id}
              onClick={() => setActiveSession(session.id)}
              title={session.name}
              className={`flex size-9 cursor-pointer items-center justify-center rounded border transition-all ${
                session.id === activeSessionId
                  ? 'border-[#2563eb]/30 bg-[#2563eb]/10'
                  : 'border-transparent hover:bg-[#111111]'
              }`}
            >
              <MessageSquare className={`size-4 ${session.id === activeSessionId ? 'text-[#2563eb]' : 'text-[#71717a]'}`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}