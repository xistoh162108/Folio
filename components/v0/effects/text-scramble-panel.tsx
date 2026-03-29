"use client"

import { useEffect, useState } from "react"

interface TextScramblePanelProps {
  targetText: string
  duration?: number
  isDarkMode: boolean
  accentColor?: string
}

export function TextScramblePanel({
  targetText,
  duration = 1500,
  isDarkMode,
  accentColor,
}: TextScramblePanelProps) {
  const [displayText, setDisplayText] = useState("")
  const [isComplete, setIsComplete] = useState(false)
  const chars = "!@#$%^&*()_+-=[]{}|;:,.<>?0123456789ABCDEF"

  useEffect(() => {
    setDisplayText("")
    setIsComplete(false)

    let frame = 0
    const totalFrames = Math.floor(duration / 30)

    const scramble = () => {
      const progress = frame / totalFrames
      let result = ""

      for (let index = 0; index < targetText.length; index += 1) {
        if (index < Math.floor(progress * targetText.length)) {
          result += targetText[index]
        } else if (targetText[index] === " ") {
          result += " "
        } else {
          result += chars[Math.floor(Math.random() * chars.length)]
        }
      }

      setDisplayText(result)
      frame += 1

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
    <div className="space-y-2 text-center">
      <p
        className={`text-sm font-mono tracking-wider transition-all duration-300 ${
          isComplete
            ? ""
            : isDarkMode
              ? "text-white/70"
              : "text-black/70"
        }`}
        style={isComplete ? { color: accentColor } : undefined}
      >
        {displayText ||
          chars
            .slice(0, targetText.length)
            .split("")
            .map(() => chars[Math.floor(Math.random() * chars.length)])
            .join("")}
      </p>
      {isComplete ? (
        <p className={`text-xs ${isDarkMode ? "text-white/50" : "text-black/50"} animate-pulse`}>// Hello, Jimin.</p>
      ) : null}
    </div>
  )
}
