"use client"

import { useEffect, useState, useRef } from "react"

interface ReactiveTextScrambleProps {
  name: string
  isDarkMode: boolean
}

export function ReactiveTextScramble({ name, isDarkMode }: ReactiveTextScrambleProps) {
  const [displayChars, setDisplayChars] = useState<{ char: string; resolved: boolean }[]>([])
  const resolvedRef = useRef<boolean[]>([])
  const nameRef = useRef(name)
  const chars = "!@#$%^&*()_+-=[]{}|;:,.<>?0123456789ABCDEF"

  useEffect(() => {
    nameRef.current = name
    const newResolved = [...resolvedRef.current]
    
    // If name is shorter, truncate the resolved tracking
    if (name.length < newResolved.length) {
      newResolved.length = name.length
    }
    
    // If name is longer, push false for new characters and set timeout to resolve
    for (let i = newResolved.length; i < name.length; i++) {
      newResolved[i] = false
      setTimeout(() => {
        resolvedRef.current[i] = true
      }, 300)
    }
    resolvedRef.current = newResolved
  }, [name])

  // Animation loop
  useEffect(() => {
    let frameId: number
    const loop = () => {
      const currentName = nameRef.current || ""
      const newDisplay = currentName.split('').map((char, i) => {
        if (resolvedRef.current[i]) {
          return { char, resolved: true }
        } else {
          return { 
            char: char === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)], 
            resolved: false 
          }
        }
      })
      setDisplayChars(newDisplay)
      frameId = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(frameId)
  }, [])

  const resolvedColor = isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"
  const scramblingColor = isDarkMode ? "text-white/40" : "text-black/40"

  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full max-w-sm mx-auto relative z-10 font-[var(--font-jetbrains-mono),monospace]">
      
      {/* Name Display */}
      <div className="text-xl tracking-widest min-h-[2.5rem] flex flex-wrap justify-center font-bold">
         {!name && (
           <span className={`${scramblingColor}`}>
             [WAITING_FOR_HANDSHAKE]
           </span>
         )}
         {name && displayChars.map((item, i) => (
           <span 
             key={i} 
             className={`transition-colors duration-100 ${item.resolved ? resolvedColor : scramblingColor}`}
           >
             {item.char}
           </span>
         ))}
         {/* Blinking Cursor */}
         {name && <span className={`${scramblingColor} animate-pulse ml-1`}>_</span>}
      </div>
      
      {/* Logs section */}
      <div className={`text-xs text-left w-full p-4 border border-white/5 bg-black/20 backdrop-blur-md space-y-1 ${!name ? scramblingColor : ''}`}>
         {!name ? (
           <div className="min-h-[2.5rem] flex flex-col justify-center">
             <p>// Identity Unknown.</p>
           </div>
         ) : (
           <div className="min-h-[2.5rem] flex flex-col justify-center gap-1">
             <p className={`${scramblingColor}`}>&gt; [STAG_01] Intercepting packet...</p>
             <p className={`${resolvedColor} transition-opacity duration-300`}>
               &gt; [STAG_02] Identity confirmed: {name}
             </p>
           </div>
         )}
      </div>

    </div>
  )
}
