import { ToolCall } from '@/src/types'

interface ToolCallVisualizationProps {
  toolCall: ToolCall
}

export default function ToolCallVisualization({ toolCall }: ToolCallVisualizationProps) {
  switch (toolCall.type) {
    case 'computer':
      return (
        <div className="inline-flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-xs font-mono text-zinc-300 my-1">
          <span className="text-blue-400">⌨ computer</span>
          <span className="text-white font-medium">{toolCall.action}</span>
          {toolCall.coordinate && (
            <span className="text-zinc-500">@ ({toolCall.coordinate[0]}, {toolCall.coordinate[1]})</span>
          )}
        </div>
      )
    case 'bash':
      return (
        <div className="inline-flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-xs font-mono text-zinc-300 my-1">
          <span className="text-green-400">$ bash</span>
          <span className="text-white font-medium">{toolCall.command}</span>
        </div>
      )
    default:
      return null
  }
}