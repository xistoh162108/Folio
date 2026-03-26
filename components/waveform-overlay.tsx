"use client"

import { useEffect, useState } from "react"

interface WaveformOverlayProps {
  message: string
  isDarkMode: boolean
}

export function WaveformOverlay({ message, isDarkMode }: WaveformOverlayProps) {
  const [bars, setDisplayBars] = useState<number[]>(Array(50).fill(4))
  
  useEffect(() => {
    if (!message) {
      setDisplayBars(Array(50).fill(4))
      return
    }
    
    // Create a deterministic pseudo-random waveform based on the message string
    const newBars = Array(50).fill(4).map((_, i) => {
      // Base intensity scaling off message length
      const intensity = Math.min(1, message.length / 60)
      
      // Use char codes to slightly randomize the offsets between re-renders
      const offset = (message.charCodeAt(message.length - 1) || 0) + message.length
      const noise = Math.sin((i + offset) * 0.4) * 25 * intensity
      const randomSpike = Math.random() * 35 * intensity
      
      // Math.max 4 ensures a minimal height is preserved
      return Math.max(4, 10 + noise + randomSpike)
    })
    
    setDisplayBars(newBars)
  }, [message])

  const currentColor = isDarkMode ? "bg-[#D4FF00]" : "bg-[#3F5200]"

  return (
    <div 
      className={`absolute inset-0 flex items-center justify-center pointer-events-none z-0 mix-blend-screen transition-opacity duration-300 ${!message ? 'opacity-0' : 'opacity-30'}`}
    >
      <div className="flex items-center gap-1 h-48">
        {bars.map((height, i) => (
          <div 
            key={i} 
            className={`w-[2px] rounded-sm transition-all duration-150 ease-out ${currentColor}`}
            style={{ height: `${height}px` }}
          />
        ))}
      </div>
    </div>
  )
}
