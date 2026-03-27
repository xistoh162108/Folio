"use client"

import { Dithering } from "@paper-design/shaders-react"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"

import { TextScramblePanel } from "@/components/v0/effects/text-scramble-panel"
import { V0_THEME_COOKIE, getNextV0ThemeMode, normalizeV0ThemeMode, type V0ThemeMode } from "@/lib/site/v0-theme"

export type V0ExperienceLayout = "public" | "admin" | "admin-access"
export type V0DitherVariant =
  | "home"
  | "notes"
  | "projects"
  | "detail-note"
  | "detail-project"
  | "public-generic"
  | "admin-overview"
  | "admin-content"
  | "admin-manage-posts"
  | "admin-newsletter"
  | "admin-settings"
  | "admin-community"
  | "admin-access"
export type V0LifeVariant = "contact" | "guestbook"

export interface V0RuntimeFrame {
  top: number
  left: number
  width: number
  height: number
}

interface V0RuntimeOverlay {
  label?: string
  value?: string
}

export type V0RuntimeDescriptor =
  | {
      mode: "dither"
      variant: V0DitherVariant
      overlay?: V0RuntimeOverlay
    }
  | {
      mode: "life"
      variant: V0LifeVariant
      overlay?: V0RuntimeOverlay
      scrambleText?: string
      intensity?: number
      transformHint?: V0DitherVariant
    }

interface V0ExperienceRegistration {
  id: string
  layout: V0ExperienceLayout
  descriptor: V0RuntimeDescriptor | null
  frame: V0RuntimeFrame
  isDarkMode: boolean
  routeKey: string
}

interface V0ExperienceContextValue {
  isDarkMode: boolean
  themeMode: V0ThemeMode
  toggleTheme: () => void
  registerExperience: (registration: V0ExperienceRegistration) => void
}

const V0ExperienceContext = createContext<V0ExperienceContextValue | null>(null)

function applyDocumentTheme(themeMode: V0ThemeMode) {
  const isDarkMode = themeMode === "dark"

  document.documentElement.dataset.v0Theme = themeMode
  document.documentElement.style.colorScheme = themeMode
  document.body.dataset.v0Theme = themeMode
  document.body.style.colorScheme = themeMode
  document.body.classList.toggle("bg-black", isDarkMode)
  document.body.classList.toggle("text-white", isDarkMode)
  document.body.classList.toggle("bg-white", !isDarkMode)
  document.body.classList.toggle("text-black", !isDarkMode)
}

function persistTheme(themeMode: V0ThemeMode) {
  document.cookie = `${V0_THEME_COOKIE}=${themeMode}; path=/; max-age=31536000; samesite=lax`
}

function getDitherConfig(variant: V0DitherVariant) {
  switch (variant) {
    case "home":
      return { shape: "cat", type: "4x4", pxSize: 2, scale: 0.5, speed: 0.05 }
    case "notes":
    case "detail-note":
      return { shape: "noise", type: "4x4", pxSize: 2, scale: 0.4, speed: 0.03 }
    case "projects":
    case "detail-project":
      return { shape: "warp", type: "4x4", pxSize: 2, scale: 0.35, speed: 0.04 }
    case "admin-overview":
      return { shape: "grid", type: "2x2", pxSize: 1, scale: 0.6, speed: 0.08 }
    case "admin-newsletter":
    case "admin-access":
      return { shape: "warp", type: "2x2", pxSize: 1, scale: 0.5, speed: 0.06 }
    case "admin-content":
      return { shape: "noise", type: "2x2", pxSize: 1, scale: 0.45, speed: 0.05 }
    case "admin-manage-posts":
    case "admin-settings":
      return { shape: "grid", type: "2x2", pxSize: 1, scale: 0.5, speed: 0.05 }
    case "admin-community":
      return { shape: "noise", type: "2x2", pxSize: 1, scale: 0.48, speed: 0.05 }
    case "public-generic":
    default:
      return { shape: "grid", type: "2x2", pxSize: 1, scale: 0.45, speed: 0.05 }
  }
}

const ADMIN_FALLBACK_RUNTIME_DESCRIPTOR: V0RuntimeDescriptor = {
  mode: "dither",
  variant: "admin-overview",
  overlay: { label: "// ADMIN RUNTIME", value: "[STANDBY]" },
}

function createSeededRandom(seed: string) {
  let state = 2166136261

  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index)
    state = Math.imul(state, 16777619)
  }

  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function LifeGamePanel({
  active,
  isDarkMode,
  intensity = 0.3,
  seedHint,
}: {
  active: boolean
  isDarkMode: boolean
  intensity?: number
  seedHint: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const seededStateRef = useRef<string>("")

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const context = canvas.getContext("2d")
    if (!context) {
      return
    }

    let width = 0
    let height = 0
    let columns = 0
    let rows = 0
    let cells: Uint8Array = new Uint8Array()
    let nextCells: Uint8Array = new Uint8Array()
    let frameHandle = 0
    let tickAccumulator = 0

    const cellSize = 8
    const frontColor = isDarkMode ? "rgba(212, 255, 0, 0.7)" : "rgba(63, 82, 0, 0.72)"
    const gridColor = isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"

    const seedGrid = (hint: string) => {
      const random = createSeededRandom(hint)
      const density = Math.max(0.18, Math.min(0.42, 0.18 + intensity * 0.4))

      cells = new Uint8Array(columns * rows)
      nextCells = new Uint8Array(columns * rows)

      for (let index = 0; index < cells.length; index += 1) {
        cells[index] = random() < density ? 1 : 0
      }
    }

    const resize = () => {
      width = canvas.offsetWidth
      height = canvas.offsetHeight
      canvas.width = width
      canvas.height = height
      columns = Math.max(1, Math.floor(width / cellSize))
      rows = Math.max(1, Math.floor(height / cellSize))
      seedGrid(`${seedHint}:${columns}:${rows}`)
      seededStateRef.current = `${seedHint}:${columns}:${rows}`
    }

    const step = () => {
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          let neighbors = 0
          for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
            for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
              if (rowOffset === 0 && columnOffset === 0) {
                continue
              }
              const neighborRow = (row + rowOffset + rows) % rows
              const neighborColumn = (column + columnOffset + columns) % columns
              neighbors += cells[neighborRow * columns + neighborColumn]
            }
          }

          const index = row * columns + column
          const current = cells[index]
          nextCells[index] = current === 1 ? (neighbors === 2 || neighbors === 3 ? 1 : 0) : neighbors === 3 ? 1 : 0
        }
      }

      const currentCells = cells
      cells = nextCells
      nextCells = currentCells
    }

    const draw = () => {
      context.fillStyle = isDarkMode ? "rgba(0, 0, 0, 0.18)" : "rgba(255, 255, 255, 0.2)"
      context.fillRect(0, 0, width, height)

      context.strokeStyle = gridColor
      context.lineWidth = 1

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const index = row * columns + column
          const x = column * cellSize
          const y = row * cellSize

          context.strokeRect(x, y, cellSize, cellSize)
          if (cells[index] === 1) {
            context.fillStyle = frontColor
            context.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2)
          }
        }
      }
    }

    const tick = () => {
      const nextSeedState = `${seedHint}:${columns}:${rows}`
      if (seededStateRef.current !== nextSeedState) {
        seedGrid(nextSeedState)
        seededStateRef.current = nextSeedState
      }

      draw()
      if (!active) {
        return
      }

      tickAccumulator += 1
      if (tickAccumulator % 5 === 0) {
        step()
      }

      frameHandle = window.requestAnimationFrame(tick)
    }

    resize()
    tick()
    window.addEventListener("resize", resize)

    return () => {
      window.cancelAnimationFrame(frameHandle)
      window.removeEventListener("resize", resize)
    }
  }, [active, intensity, isDarkMode, seedHint])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ opacity: active ? 1 : 0 }}
    />
  )
}

function V0PersistentJitterViewport({
  descriptor,
  isDarkMode,
  routeKey,
}: {
  descriptor: V0RuntimeDescriptor
  isDarkMode: boolean
  routeKey: string
}) {
  const lastDitherVariant = useRef<V0DitherVariant>("home")

  if (descriptor.mode === "dither") {
    lastDitherVariant.current = descriptor.variant
  }

  const activeDitherVariant = descriptor.mode === "dither" ? descriptor.variant : descriptor.transformHint ?? lastDitherVariant.current
  const ditherConfig = getDitherConfig(activeDitherVariant)

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0" style={{ opacity: descriptor.mode === "life" ? 0.35 : 1 }}>
        <Dithering
          style={{ height: "100%", width: "100%" }}
          colorBack={isDarkMode ? "hsl(0, 0%, 0%)" : "hsl(0, 0%, 95%)"}
          colorFront={isDarkMode ? "#D4FF00" : "#3F5200"}
          shape={ditherConfig.shape as never}
          type={ditherConfig.type as never}
          pxSize={ditherConfig.pxSize}
          scale={ditherConfig.scale}
          speed={ditherConfig.speed}
        />
      </div>

      <LifeGamePanel
        active={descriptor.mode === "life"}
        intensity={descriptor.mode === "life" ? descriptor.intensity : 0.3}
        seedHint={
          descriptor.mode === "life"
            ? `life:${descriptor.variant}:${activeDitherVariant}`
            : `dither:${routeKey}:${activeDitherVariant}`
        }
        isDarkMode={isDarkMode}
      />

      {descriptor.overlay?.label || descriptor.overlay?.value ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`text-center ${isDarkMode ? "text-white/50" : "text-black/50"}`}>
            {descriptor.overlay.label ? <p className="text-xs">{descriptor.overlay.label}</p> : null}
            {descriptor.overlay.value ? (
              <p className={`mt-2 text-lg ${isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"}`}>{descriptor.overlay.value}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {descriptor.mode === "life" && descriptor.scrambleText ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <TextScramblePanel
            key={`${routeKey}:${descriptor.scrambleText}`}
            targetText={descriptor.scrambleText}
            duration={1500}
            isDarkMode={isDarkMode}
          />
        </div>
      ) : null}
    </div>
  )
}

function V0ExperienceOverlay({ registration }: { registration: V0ExperienceRegistration | null }) {
  if (!registration?.descriptor) {
    return null
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-10 overflow-hidden"
      style={{
        top: `${registration.frame.top}px`,
        left: `${registration.frame.left}px`,
        width: `${registration.frame.width}px`,
        height: `${registration.frame.height}px`,
      }}
    >
      <V0PersistentJitterViewport
        descriptor={registration.descriptor}
        isDarkMode={registration.isDarkMode}
        routeKey={registration.routeKey}
      />
    </div>
  )
}

export function V0ExperienceProvider({
  children,
  initialThemeMode,
}: {
  children: ReactNode
  initialThemeMode: V0ThemeMode
}) {
  const [themeMode, setThemeMode] = useState<V0ThemeMode>(() => normalizeV0ThemeMode(initialThemeMode))
  const [registration, setRegistration] = useState<V0ExperienceRegistration | null>(null)

  useEffect(() => {
    applyDocumentTheme(themeMode)
  }, [themeMode])

  const toggleTheme = useCallback(() => {
    setThemeMode((currentTheme) => {
      const nextTheme = getNextV0ThemeMode(currentTheme)
      persistTheme(nextTheme)
      return nextTheme
    })
  }, [])

  const registerExperience = useCallback((nextRegistration: V0ExperienceRegistration) => {
    setRegistration((currentRegistration) => {
      if (
        currentRegistration &&
        currentRegistration.id === nextRegistration.id &&
        currentRegistration.layout === nextRegistration.layout &&
        currentRegistration.isDarkMode === nextRegistration.isDarkMode &&
        currentRegistration.routeKey === nextRegistration.routeKey &&
        currentRegistration.frame.top === nextRegistration.frame.top &&
        currentRegistration.frame.left === nextRegistration.frame.left &&
        currentRegistration.frame.width === nextRegistration.frame.width &&
        currentRegistration.frame.height === nextRegistration.frame.height &&
        JSON.stringify(currentRegistration.descriptor) === JSON.stringify(nextRegistration.descriptor)
      ) {
        return currentRegistration
      }

      return nextRegistration
    })
  }, [])

  const contextValue = useMemo<V0ExperienceContextValue>(
    () => ({
      isDarkMode: themeMode === "dark",
      themeMode,
      toggleTheme,
      registerExperience,
    }),
    [registerExperience, themeMode, toggleTheme],
  )

  return (
    <V0ExperienceContext.Provider value={contextValue}>
      {children}
      <V0ExperienceOverlay registration={registration} />
    </V0ExperienceContext.Provider>
  )
}

export function useOptionalV0ExperienceTheme() {
  return useContext(V0ExperienceContext)
}

export function useRegisterV0Experience({
  layout,
  descriptor,
  frame,
  isDarkMode,
}: {
  layout: V0ExperienceLayout
  descriptor: V0RuntimeDescriptor | null
  frame: V0RuntimeFrame | null
  isDarkMode: boolean
}) {
  const experience = useContext(V0ExperienceContext)
  const pathname = usePathname()
  const registrationId = useId()

  useLayoutEffect(() => {
    if (!experience || !descriptor || !frame || frame.width <= 0 || frame.height <= 0) {
      return
    }

    experience.registerExperience({
      id: registrationId,
      layout,
      descriptor,
      frame,
      isDarkMode,
      routeKey: pathname,
    })
  }, [descriptor, experience, frame, isDarkMode, layout, pathname, registrationId])
}

export function getDefaultPublicRuntimeDescriptor(currentPage: "home" | "notes" | "projects" | "contact" | null): V0RuntimeDescriptor | null {
  switch (currentPage) {
    case "home":
      return { mode: "dither", variant: "home" }
    case "notes":
      return { mode: "dither", variant: "notes" }
    case "projects":
      return { mode: "dither", variant: "projects" }
    case "contact":
      return {
        mode: "life",
        variant: "contact",
        intensity: 0.2,
        scrambleText: "[CONNECTION_ESTABLISHED]",
      }
    default:
      return null
  }
}

export function getDefaultAdminRuntimeDescriptor(
  currentSection: "overview" | "content" | "manage-posts" | "newsletter" | "settings" | "community" | null,
): V0RuntimeDescriptor | null {
  switch (currentSection) {
    case "overview":
      return {
        mode: "dither",
        variant: "admin-overview",
        overlay: { label: "// SYSTEM STATUS", value: "[OPERATIONAL]" },
      }
    case "content":
      return {
        mode: "dither",
        variant: "admin-content",
        overlay: { label: "// CONTENT EDITOR", value: "[BUFFER_READY]" },
      }
    case "manage-posts":
      return {
        mode: "dither",
        variant: "admin-manage-posts",
        overlay: { label: "// CONTENT INDEX", value: "[SYNCED]" },
      }
    case "newsletter":
      return {
        mode: "dither",
        variant: "admin-newsletter",
        overlay: { label: "// CAMPAIGN SYSTEM", value: "[READY]" },
      }
    case "settings":
      return {
        mode: "dither",
        variant: "admin-settings",
        overlay: { label: "// PROFILE SYSTEM", value: "[LIVE]" },
      }
    case "community":
      return {
        mode: "dither",
        variant: "admin-community",
        overlay: { label: "// MODERATION LOG", value: "[ACTIVE]" },
      }
    default:
      return ADMIN_FALLBACK_RUNTIME_DESCRIPTOR
  }
}

export const ADMIN_ACCESS_RUNTIME_DESCRIPTOR: V0RuntimeDescriptor = {
  mode: "dither",
  variant: "admin-access",
  overlay: { label: "// ACCESS GATE", value: "[RESTRICTED]" },
}
