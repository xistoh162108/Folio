"use client"

import { Dithering } from "@paper-design/shaders-react"

interface DitheringPanelProps {
  isDarkMode?: boolean
  shape: "cat" | "noise" | "warp" | "grid"
  type: "4x4" | "2x2"
  pxSize: number
  scale: number
  speed: number
  overlayLabel?: string
  overlayValue?: string
}

export function DitheringPanel({
  isDarkMode = true,
  shape,
  type,
  pxSize,
  scale,
  speed,
  overlayLabel,
  overlayValue,
}: DitheringPanelProps) {
  return (
    <div className="w-1/2 relative">
      <div className="absolute inset-0">
        <Dithering
          style={{ height: "100%", width: "100%" }}
          colorBack={isDarkMode ? "hsl(0, 0%, 0%)" : "hsl(0, 0%, 95%)"}
          colorFront={isDarkMode ? "#D4FF00" : "#3F5200"}
          shape={shape as never}
          type={type as never}
          pxSize={pxSize}
          scale={scale}
          speed={speed}
        />
      </div>
      {overlayLabel && overlayValue ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`text-center ${isDarkMode ? "text-white/50" : "text-black/50"}`}>
            <p className="text-xs">{overlayLabel}</p>
            <p className={`text-lg mt-2 ${isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"}`}>{overlayValue}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
