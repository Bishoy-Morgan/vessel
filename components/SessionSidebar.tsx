'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useChatStore } from '@/src/store/chatStore'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Check,
  X,
  Github,
  LucideSquareGanttChart,
  FileX2,
} from 'lucide-react'
import { VesselLogo } from '@/components/brand/VesselLogo'
import { brandFont } from '@/lib/fonts'
import { REPO_URL } from '@/lib/site'

// Hover-only on desktop, always visible on touch devices (no hover there).
const ACTION_VISIBILITY =
  'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100'

function timeAgo(ts?: number) {
  if (!ts) return ''
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'Just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function SessionSidebar() {
  const { sessions, activeSessionId, createSession, deleteSession, setActiveSession, updateSession } = useChatStore()
  const [collapsed, setCollapsed] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Start collapsed on small screens so the sidebar doesn't cover the app.
  useEffect(() => {
    if (window.matchMedia('(max-width: 1279px)').matches) setCollapsed(true)
  }, [])

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
    <aside
      aria-label="Sessions"
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

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        className="absolute -right-3.5 top-1/5 z-50 flex size-7 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#141414] text-[#71717a] hover:border-[#2563eb] hover:text-[#a1a1aa] focus-visible:outline-2 focus-visible:outline-[#2563eb]"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className="relative z-10 px-3 py-6 flex items-center justify-center ">
        <Link href="/" aria-label="Vessel home" className="group flex items-center gap-3">
          <VesselLogo className="size-7 shrink-0 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-transform group-hover:scale-105" />
          {!collapsed && (
            <span
              className={`${brandFont.className} text-md font-light uppercase tracking-[0.22em] bg-linear-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent`}
            >
              Vessel
            </span>
          )}
        </Link>
      </div>

      {/* New session */}
      <div className={`relative z-10 p-3 border-b border-[#1a1a1a] ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <button
            type="button"
            onClick={handleNewSession}
            className="flex size-9 cursor-pointer items-center justify-center rounded-md bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 transition-all active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-primary"
            title="New session"
            aria-label="New session"
          >
            <Plus className="size-4" strokeWidth={2.5} aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNewSession}
            className="flex w-full cursor-pointer items-center justify-between rounded-md bg-primary hover:bg-primary/90 text-primary-foreground px-3.5 py-2.5 text-sm font-medium transition-all shadow-md shadow-primary/20 active:scale-[0.98] group focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span className="flex items-center gap-2.5">
              <Plus className="size-4 transition-transform group-hover:scale-110" strokeWidth={2.5} aria-hidden />
              <span>New session</span>
            </span>
          </button>
        )}
      </div>

      {/* Sessions list (expanded) */}
      {!collapsed && (
        <div className="relative z-10 flex flex-col flex-1 min-h-0 px-3 py-3">
          <h2 className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2 px-1">Recents</h2>
          <ul className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto pr-1 bg-transparent">
            {sessions.length === 0 && (
              <li className="text-xs text-muted-foreground text-center py-6">
                No sessions yet. Start one above.
              </li>
            )}
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId
              const isEditing = editingId === session.id
              const when = timeAgo(session.updatedAt)

              return (
                <li
                  key={session.id}
                  className={`group relative flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition-all border ${
                    isActive
                      ? 'border-primary/10 bg-secondary/80 text-white shadow-md font-medium'
                      : 'border-transparent text-muted-foreground hover:bg-white/3 hover:border-border hover:text-white'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <input
                        autoFocus
                        onFocus={(e) => e.currentTarget.select()}
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmRename(e, session.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        aria-label="Session name"
                        maxLength={60}
                        className="w-full bg-transparent text-sm text-white outline-none pb-0.5 "
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveSession(session.id)}
                      aria-current={isActive ? 'true' : undefined}
                      title={session.name}
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left cursor-pointer focus-visible:outline-none rounded"
                    >
                      <LucideSquareGanttChart size={18} className={`shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate">{session.name}</span>
                        {when && <span className="truncate text-[10px] font-mono text-muted-foreground/80">{when}</span>}
                      </span>
                    </button>
                  )}

                  <div className="flex shrink-0 items-center gap-1.5">
                    {isEditing ? (
                      <button
                        type="button"
                        onClick={(e) => confirmRename(e, session.id)}
                        className="p-1 rounded-full bg-[#141414] border border-primary text-muted-foreground hover:bg-primary hover:text-white cursor-pointer transition-all"
                        title="Save"
                        aria-label="Save name"
                      >
                        <Check size={14} strokeWidth={2.5} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => startRename(e, session.id, session.name)}
                        className={`p-1 rounded-full bg-[#141414] shadow-xs shadow-white/25 text-muted-foreground hover:bg-primary hover:text-white cursor-pointer transition-all ${ACTION_VISIBILITY}`}
                        title="Rename"
                        aria-label={`Rename ${session.name}`}
                      >
                        <Pencil size={16} strokeWidth={2.5} />
                      </button>
                    )}

                    {confirmDeleteId === session.id ? (
                      <div className="flex items-center gap-1 bg-[#141414] border border-border rounded-full p-0.5 shadow-lg">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteSession(session.id)
                            setConfirmDeleteId(null)
                          }}
                          className="p-1 rounded-full bg-red-600 text-white hover:bg-red-500 cursor-pointer transition-colors"
                          title="Confirm delete"
                          aria-label={`Confirm delete ${session.name}`}
                        >
                          <Check className="size-3.5" strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setConfirmDeleteId(null)
                          }}
                          className="p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-white cursor-pointer transition-colors"
                          title="Cancel"
                          aria-label="Cancel delete"
                        >
                          <X className="size-3.5" strokeWidth={2} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setConfirmDeleteId(session.id)
                        }}
                        title="Delete"
                        aria-label={`Delete ${session.name}`}
                        className={`p-1 rounded-full bg-[#141414] shadow-xs shadow-white/25 text-muted-foreground hover:bg-red-700 hover:text-white cursor-pointer transition-all ${ACTION_VISIBILITY}`}
                      >
                        <FileX2 size={16} strokeWidth={2.5} />
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
                  className={`flex size-9 cursor-pointer items-center justify-center rounded-lg border transition-all ${
                    isActive
                      ? 'bg-secondary'
                      : 'border-transparent hover:bg-[#111111]'
                  }`}
                >
                  <LucideSquareGanttChart size={20} className={` ${isActive ? 'text-white' : 'text-[#71717a]'}`} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {/* Footer */}
      <div className="relative z-10 p-3">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="View source on GitHub"
          aria-label="Vessel on GitHub"
          className={`flex items-center gap-2 rounded text-xs text-[#71717a] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-[#2563eb] ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <Github className="size-4 shrink-0" aria-hidden />
          {!collapsed && <span>View source</span>}
        </a>
      </div>
    </aside>
  )
}
