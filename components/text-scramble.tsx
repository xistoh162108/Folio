"use client"

import { useEffect, useState } from "react"

interface TextScrambleProps {
  targetText: string
  duration?: number
  isDarkMode: boolean
}

export function TextScramble({ targetText, duration = 1500, isDarkMode }: TextScrambleProps) {
  const [displayText, setDisplayText] = useState("")
  const [isComplete, setIsComplete] = useState(false)
  const chars = "!@#$%^&*()_+-=[]{}|;:,.<>?0123456789ABCDEF"

  useEffect(() => {
    let frame = 0
    const totalFrames = Math.floor(duration / 30)
    
    const scramble = () => {
      const progress = frame / totalFrames
      let result = ""
      
      for (let i = 0; i < targetText.length; i++) {
        if (i < Math.floor(progress * targetText.length)) {
          result += targetText[i]
        } else if (targetText[i] === " ") {
          result += " "
        } else {
          result += chars[Math.floor(Math.random() * chars.length)]
        }
      }
      
      setDisplayText(result)
      frame++
      
      if (frame <= totalFrames) {
        requestAnimationFrame(scramble)
      } else {
        setDisplayText(targetText)
        setIsComplete(true)
      }
    }
    
    const timeout = setTimeout(scramble, 500)
    
    return () => clearTimeout(timeout)
  }, [targetText, duration])

  return (
    <div className="text-center space-y-2">
      <p 
        className={`text-sm font-mono tracking-wider transition-all duration-300 ${
          isComplete 
            ? (isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]")
            : (isDarkMode ? "text-white/70" : "text-black/70")
        }`}
      >
        {displayText || chars.slice(0, targetText.length).split("").map(() => chars[Math.floor(Math.random() * chars.length)]).join("")}
      </p>
      {isComplete && (
        <p className={`text-xs ${isDarkMode ? "text-white/50" : "text-black/50"} animate-pulse`}>
          // Hello, Jimin.
        </p>
      )}
    </div>
  )
}
