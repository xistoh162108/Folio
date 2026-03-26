"use client"

import { useEffect, useRef } from "react"

interface DigitalRainProps {
  intensity?: number // 0 to 1
  emailStr?: string
  isDarkMode: boolean
}

export function DigitalRain({ intensity = 0.3, emailStr = "", isDarkMode }: DigitalRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const chars = "0123456789ABCDEF".split("")
    const fontSize = 14
    const columns = Math.floor(canvas.width / fontSize)
    const drops: number[] = Array(columns).fill(1)

    const activeIntensity = emailStr.length > 0 ? 0.3 + Math.min(0.7, emailStr.length / 30) : intensity
    
    const baseOpacity = 0.03 + activeIntensity * 0.12
    const charOpacity = 0.15 + activeIntensity * 0.45

    const draw = () => {
      ctx.fillStyle = isDarkMode 
        ? `rgba(0, 0, 0, ${baseOpacity})` 
        : `rgba(255, 255, 255, ${baseOpacity})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = isDarkMode 
        ? `rgba(212, 255, 0, ${charOpacity})` 
        : `rgba(63, 82, 0, ${charOpacity})`
      ctx.font = `${fontSize}px JetBrains Mono, monospace`

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillText(char, i * fontSize, drops[i] * fontSize)

        const densityFactor = emailStr.length > 0 ? 0.975 - Math.min(0.04, emailStr.length / 500) : 0.975
        if (drops[i] * fontSize > canvas.height && Math.random() > densityFactor) {
          drops[i] = 0
        }
        drops[i] += 0.5 + activeIntensity * 0.8
      }
    }

    const interval = setInterval(draw, 50)

    return () => {
      clearInterval(interval)
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [intensity, emailStr, isDarkMode])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.6 + (emailStr.length > 0 ? 0.3 + Math.min(0.7, emailStr.length / 30) : intensity) * 0.4 }}
    />
  )
}
