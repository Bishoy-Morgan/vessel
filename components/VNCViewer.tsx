import React from 'react'

interface VNCViewerProps {
  streamUrl: string
  isInitializing: boolean
}

const VNCViewer = React.memo(({ streamUrl, isInitializing }: VNCViewerProps) => {
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        Initializing desktop...
      </div>
    )
  }
  if (!streamUrl) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        Loading stream...
      </div>
    )
  }
  return <iframe src={streamUrl} className="w-full h-full" style={{ transformOrigin: "center", width: "100%", height: "100%" }} allow="autoplay" />
}, (prev, next) => prev.streamUrl === next.streamUrl && prev.isInitializing === next.isInitializing
)

VNCViewer.displayName = 'VNCViewer'

export default VNCViewer