'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useChatStore } from '@/src/store/chatStore'
import { ChevronLeft, ChevronRight, MessageSquare, Plus, Pencil, Check, X, Trash2 } from 'lucide-react'
import { VesselLogo } from '@/components/brand/VesselLogo'
import { brandFont } from '@/lib/fonts'

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
      hour12: true,
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

      {/* Collapse toggle — high z so it isn't covered by the chat panel header */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        className="absolute -right-3.5 top-1/5 z-50 flex size-7 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#141414] text-[#71717a] hover:border-[#2563eb] hover:text-[#a1a1aa] focus-visible:outline-2 focus-visible:outline-[#2563eb]"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Brand */}
      <div className="relative z-10 p-3 flex items-center">
        <Link href="/" aria-label="Vessel home" className="group flex items-center gap-3">
          <VesselLogo className="size-8 shrink-0 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-transform group-hover:scale-105" />
          {!collapsed && (
            <span
              className={`${brandFont.className} text-xl font-bold uppercase tracking-[0.22em] bg-linear-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent`}
            >
              Vessel
            </span>
          )}
        </Link>
      </div>

      {/* New session */}
      <div className="relative z-10 p-3 flex items-center gap-x-3 mt-2">
        <button
          type="button"
          onClick={handleNewSession}
          className="flex size-8 cursor-pointer shrink-0 items-center justify-center rounded-full border border-[#2563eb]/40 bg-black text-[#93c5fd] hover:bg-[#2563eb]/15 focus-visible:outline-2 focus-visible:outline-[#2563eb]"
          title="New Session"
          aria-label="New session"
        >
          <Plus className="size-5" strokeWidth={2} aria-hidden />
        </button>
        {!collapsed && (
          <span className="text-sm font-medium text-[#71717a] uppercase tracking-wider">Add Session</span>
        )}
      </div>

      {/* Sessions list (expanded) */}
      {!collapsed && (
        <div className="relative z-10 flex flex-col flex-1 min-h-0 px-3 py-2 mt-4">
          <h2 className="text-xs text-[#71717a] mb-1.5">Recents</h2>
          <ul className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto">
            {sessions.length === 0 && (
              <li className="text-xs text-[#71717a] text-center py-4">No sessions yet</li>
            )}
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId
              const isEditing = editingId === session.id

              return (
                <li
                  key={session.id}
                  className={`group flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-all ${
                    isActive
                      ? 'border border-[#2563eb]/30 bg-[#2563eb]/10 text-white'
                      : 'border border-transparent text-[#71717a] hover:bg-[#111111] hover:text-white'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <MessageSquare className={`size-4 shrink-0 ${isActive ? 'text-[#2563eb]' : 'text-[#71717a]'}`} />
                      <input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmRename(e, session.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        aria-label="Session name"
                        className="w-full border-b border-[#2563eb] bg-transparent text-sm text-white outline-none"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveSession(session.id)}
                      aria-current={isActive ? 'true' : undefined}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2563eb] rounded"
                    >
                      <MessageSquare className={`size-4 shrink-0 ${isActive ? 'text-[#2563eb]' : 'text-[#71717a]'}`} />
                      <span className="truncate">{session.name}</span>
                    </button>
                  )}

                  <div className="flex shrink-0 items-center gap-2">
                    {isEditing ? (
                      <button
                        type="button"
                        onClick={(e) => confirmRename(e, session.id)}
                        className="p-1 hover:text-[#2563eb] text-white cursor-pointer"
                        title="Save"
                        aria-label="Save name"
                      >
                        <Check className="size-4" strokeWidth={2} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => startRename(e, session.id, session.name)}
                        className="p-1 text-[#71717a] opacity-0 hover:text-white group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 cursor-pointer"
                        title="Rename"
                        aria-label={`Rename ${session.name}`}
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
                          aria-label={`Confirm delete ${session.name}`}
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
                          aria-label="Cancel delete"
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
                        aria-label={`Delete ${session.name}`}
                        className="p-1 text-[#71717a] opacity-0 hover:text-red-400 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 cursor-pointer"
                      >
                        <Trash2 className="size-4" strokeWidth={2} />
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Sessions list (collapsed icons) */}
      {collapsed && (
        <ul className="relative z-10 flex flex-1 min-h-0 flex-col items-center gap-2 overflow-y-auto p-2">
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId
            return (
              <li key={session.id}>
                <button
                  type="button"
                  onClick={() => setActiveSession(session.id)}
                  title={session.name}
                  aria-label={session.name}
                  aria-current={isActive ? 'true' : undefined}
                  className={`flex size-9 cursor-pointer items-center justify-center rounded border transition-all focus-visible:outline-2 focus-visible:outline-[#2563eb] ${
                    isActive
                      ? 'border-[#2563eb]/30 bg-[#2563eb]/10'
                      : 'border-transparent hover:bg-[#111111]'
                  }`}
                >
                  <MessageSquare className={`size-4 ${isActive ? 'text-[#2563eb]' : 'text-[#71717a]'}`} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}