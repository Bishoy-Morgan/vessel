import { ToolCall } from '@/src/types'

interface ToolCallDetailsProps {
  toolCall: ToolCall | null
}

export default function ToolCallDetails({ toolCall }: ToolCallDetailsProps) {
  if (!toolCall) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
        Select a tool call to see details
      </div>
    )
  }

  return (
    <div className="p-4 font-mono text-sm text-zinc-300 bg-zinc-900 h-full overflow-y-auto">
      <h2 className="text-white font-semibold text-base mb-4 capitalize">{toolCall.type} Tool Call</h2>

      {toolCall.type === 'computer' && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <span className="text-zinc-500 w-24 shrink-0">Action</span>
            <span className="text-blue-400">{toolCall.action}</span>
          </div>
          {toolCall.coordinate && (
            <div className="flex gap-2">
              <span className="text-zinc-500 w-24 shrink-0">Coordinate</span>
              <span>({toolCall.coordinate[0]}, {toolCall.coordinate[1]})</span>
            </div>
          )}
          {toolCall.text && (
            <div className="flex gap-2">
              <span className="text-zinc-500 w-24 shrink-0">Text</span>
              <span className="text-yellow-300">{toolCall.text}</span>
            </div>
          )}
        </div>
      )}

      {toolCall.type === 'bash' && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <span className="text-zinc-500 w-24 shrink-0">Command</span>
            <span className="text-green-400">{toolCall.command}</span>
          </div>
        </div>
      )}
    </div>
  )
}