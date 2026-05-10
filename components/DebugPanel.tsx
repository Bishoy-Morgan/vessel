'use client'

import { useState } from 'react'
import { useEventStore } from '@/src/store/eventStore'
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react'

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const { events, countsByType, agentStatus, clearEvents } = useEventStore()

  const statusColor = {
    idle: 'text-[#71717a]',
    running: 'text-[#2563eb]',
    error: 'text-red-400',
  }[agentStatus]

  return (
    <div className="border-t border-[#1a1a1a] bg-[#0a0a0a] shrink-0">
      {/* Toggle header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#111111] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#71717a] uppercase tracking-wider">Debug</span>
          <span className={`text-xs font-mono ${statusColor}`}>● {agentStatus}</span>
          <span className="text-xs text-[#71717a]">
            {events.length} events
          </span>
        </div>
        <div className="flex items-center gap-2">
          {events.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); clearEvents(); }}
              className="text-[#71717a] hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
          {isOpen
            ? <ChevronDown className="w-3.5 h-3.5 text-[#71717a]" />
            : <ChevronUp className="w-3.5 h-3.5 text-[#71717a]" />
          }
        </div>
      </button>

      {/* Panel content */}
      {isOpen && (
        <div className="max-h-48 overflow-y-auto px-4 py-2 space-y-2">
          {/* Counts */}
          <div className="flex gap-3 text-xs font-mono pb-2 border-b border-[#1a1a1a]">
            {Object.entries(countsByType).map(([type, count]) => (
              <span key={type} className="text-[#71717a]">
                <span className="text-white">{count}</span> {type}
              </span>
            ))}
          </div>

          {/* Events list */}
          {events.length === 0 ? (
            <p className="text-xs text-[#71717a] py-2">No events yet</p>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 text-xs font-mono py-1 border-b border-[#1a1a1a]/50"
              >
                <span className={`shrink-0 ${
                  event.status === 'running' ? 'text-[#2563eb]' :
                  event.status === 'success' ? 'text-emerald-500' :
                  event.status === 'error' ? 'text-red-400' :
                  'text-[#71717a]'
                }`}>●</span>
                <span className="text-white shrink-0">{event.type}</span>
                <span className="text-[#71717a] shrink-0">{event.status}</span>
                {event.duration && (
                  <span className="text-[#71717a] shrink-0">{event.duration}ms</span>
                )}
                <span className="text-[#71717a] truncate">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}