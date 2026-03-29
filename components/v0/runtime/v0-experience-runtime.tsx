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
import { createPortal } from "react-dom"
import { usePathname } from "next/navigation"

import { TextScramblePanel } from "@/components/v0/effects/text-scramble-panel"
import { recordAdminRuntimeHandoff } from "@/lib/ops/admin-performance-client"
import { getV0DitherConfig, resolveV0DitherAspectBucket } from "@/lib/site/v0-runtime-dither"
import { getV0RouteAccentPalette, resolveV0RouteAccentKey } from "@/lib/site/v0-route-palette"
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
  frame: V0RuntimeFrame | null
  slot: HTMLElement | null
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

function lerp(from: number, to: number, progress: number) {
  return from + (to - from) * progress
}

function descriptorsMatch(left: V0RuntimeDescriptor | null, right: V0RuntimeDescriptor | null) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function resolveDitherVariant(
  descriptor: V0RuntimeDescriptor,
  fallback: V0DitherVariant,
) {
  if (descriptor.mode === "dither") {
    return descriptor.variant
  }

  return descriptor.transformHint ?? fallback
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
  opacity,
  isDarkMode,
  intensity = 0.3,
  seedHint,
  accentColorRgba,
}: {
  active: boolean
  opacity: number
  isDarkMode: boolean
  intensity?: number
  seedHint: string
  accentColorRgba: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const seededStateRef = useRef<string>("")
  const activeRef = useRef(active)
  const intensityRef = useRef(intensity)
  const isDarkModeRef = useRef(isDarkMode)
  const accentColorRef = useRef(accentColorRgba)

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    intensityRef.current = intensity
  }, [intensity])

  useEffect(() => {
    isDarkModeRef.current = isDarkMode
  }, [isDarkMode])

  useEffect(() => {
    accentColorRef.current = accentColorRgba
  }, [accentColorRgba])

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
    const seedGrid = (hint: string) => {
      const random = createSeededRandom(hint)
      const density = Math.max(0.18, Math.min(0.42, 0.18 + intensityRef.current * 0.4))

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
      const isDarkModeValue = isDarkModeRef.current
      const frontColor = accentColorRef.current

      context.fillStyle = isDarkModeValue ? "rgba(0, 0, 0, 0.18)" : "rgba(255, 255, 255, 0.2)"
      context.fillRect(0, 0, width, height)

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const index = row * columns + column
          const x = column * cellSize
          const y = row * cellSize

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
      tickAccumulator += 1
      const stepModulo = Math.max(3, Math.round(7 - intensityRef.current * 4))
      if (activeRef.current && tickAccumulator % stepModulo === 0) {
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
  }, [seedHint])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ opacity }}
    />
  )
}

function V0PersistentJitterViewport({
  descriptor,
  isDarkMode,
  frame,
}: {
  descriptor: V0RuntimeDescriptor
  isDarkMode: boolean
  frame: V0RuntimeFrame | null
}) {
  const [fromDescriptor, setFromDescriptor] = useState<V0RuntimeDescriptor>(descriptor)
  const [transitionProgress, setTransitionProgress] = useState(1)
  const lastDescriptorRef = useRef<V0RuntimeDescriptor>(descriptor)
  const lastDitherVariant = useRef<V0DitherVariant>(resolveDitherVariant(descriptor, "home"))

  useEffect(() => {
    if (descriptor.mode === "dither") {
      lastDitherVariant.current = descriptor.variant
    }
  }, [descriptor])

  useEffect(() => {
    if (descriptorsMatch(lastDescriptorRef.current, descriptor)) {
      return
    }

    setFromDescriptor(lastDescriptorRef.current)
    setTransitionProgress(0)

    const start = performance.now()
    const duration = 560
    let frameHandle = 0

    const tick = (now: number) => {
      const nextProgress = Math.min(1, (now - start) / duration)
      setTransitionProgress(nextProgress)

      if (nextProgress < 1) {
        frameHandle = window.requestAnimationFrame(tick)
        return
      }

      lastDescriptorRef.current = descriptor
      setFromDescriptor(descriptor)
    }

    frameHandle = window.requestAnimationFrame(tick)

    return () => window.cancelAnimationFrame(frameHandle)
  }, [descriptor])

  const aspectBucket = resolveV0DitherAspectBucket(frame)
  const fromDitherVariant = resolveDitherVariant(fromDescriptor, lastDitherVariant.current)
  const toDitherVariant = resolveDitherVariant(descriptor, fromDitherVariant)
  const fromDitherConfig = getV0DitherConfig(fromDitherVariant, aspectBucket)
  const toDitherConfig = getV0DitherConfig(toDitherVariant, aspectBucket)
  const resolvedDitherShape = transitionProgress < 0.62 ? fromDitherConfig.shape : toDitherConfig.shape
  const resolvedDitherType = transitionProgress < 0.62 ? fromDitherConfig.type : toDitherConfig.type
  const ditherConfig = {
    shape: resolvedDitherShape,
    type: resolvedDitherType,
    pxSize: lerp(fromDitherConfig.pxSize, toDitherConfig.pxSize, transitionProgress),
    scale: lerp(fromDitherConfig.scale, toDitherConfig.scale, transitionProgress),
    speed: lerp(fromDitherConfig.speed, toDitherConfig.speed, transitionProgress),
  }
  const fromLife = fromDescriptor.mode === "life"
  const toLife = descriptor.mode === "life"
  const ditherOpacity = toLife
    ? lerp(fromLife ? 0.35 : 1, 0.35, transitionProgress)
    : lerp(fromLife ? 0.35 : 1, 1, transitionProgress)
  const lifeOpacity = toLife
    ? lerp(fromLife ? 1 : 0, 1, transitionProgress)
    : lerp(fromLife ? 1 : 0, 0, transitionProgress)
  const lifeIntensity = toLife
    ? lerp(fromLife ? fromDescriptor.intensity ?? 0.3 : 0.18, descriptor.intensity ?? 0.3, transitionProgress)
    : lerp(fromLife ? fromDescriptor.intensity ?? 0.3 : 0.18, 0.18, transitionProgress)
  const resolvedLifeVariant =
    descriptor.mode === "life" ? descriptor.variant : fromDescriptor.mode === "life" ? fromDescriptor.variant : "contact"
  const seedHint = `life:${resolvedLifeVariant}`
  const scrambleText = descriptor.mode === "life" ? descriptor.scrambleText : fromDescriptor.mode === "life" ? fromDescriptor.scrambleText : null
  const overlay = descriptor.overlay ?? fromDescriptor.overlay
  const accentPalette = getV0RouteAccentPalette(
    resolveV0RouteAccentKey({ mode: descriptor.mode, variant: descriptor.variant }),
    isDarkMode,
  )

  return (
    <div data-v0-jitter-viewport className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0" style={{ opacity: ditherOpacity }}>
        <Dithering
          style={{ height: "100%", width: "100%" }}
          colorBack={isDarkMode ? "hsl(0, 0%, 0%)" : "hsl(0, 0%, 95%)"}
          colorFront={accentPalette.color}
          shape={ditherConfig.shape as never}
          type={ditherConfig.type as never}
          pxSize={ditherConfig.pxSize}
          scale={ditherConfig.scale}
          speed={ditherConfig.speed}
        />
      </div>

      <LifeGamePanel
        active={lifeOpacity > 0.04}
        intensity={lifeIntensity}
        opacity={lifeOpacity}
        seedHint={seedHint}
        isDarkMode={isDarkMode}
        accentColorRgba={accentPalette.colorRgba}
      />

      {overlay?.label || overlay?.value ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`text-center ${isDarkMode ? "text-white/50" : "text-black/50"}`}>
            {overlay.label ? <p className="text-xs">{overlay.label}</p> : null}
            {overlay.value ? (
              <p className="mt-2 text-lg" style={{ color: accentPalette.color }}>{overlay.value}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {scrambleText ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <TextScramblePanel
            targetText={scrambleText}
            duration={1500}
            isDarkMode={isDarkMode}
            accentColor={accentPalette.color}
          />
        </div>
      ) : null}
    </div>
  )
}

function V0ExperienceOverlay({ registration }: { registration: V0ExperienceRegistration | null }) {
  const handoffStartRef = useRef<{ routeKey: string; startedAt: number } | null>(null)
  const reportedRouteKeyRef = useRef<string | null>(null)
  const registrationLayout = registration?.layout ?? null
  const registrationRouteKey = registration?.routeKey ?? null
  const registrationSlot = registration?.slot ?? null
  const registrationFrameHeight = registration?.frame?.height ?? null
  const registrationFrameLeft = registration?.frame?.left ?? null
  const registrationFrameTop = registration?.frame?.top ?? null
  const registrationFrameWidth = registration?.frame?.width ?? null

  useEffect(() => {
    if (!registrationRouteKey || registrationLayout === "public") {
      return
    }

    handoffStartRef.current = {
      routeKey: registrationRouteKey,
      startedAt: performance.now(),
    }
  }, [registrationLayout, registrationRouteKey, registrationSlot])

  useEffect(() => {
    if (!registrationRouteKey || registrationLayout === "public") {
      return
    }

    const handoff = handoffStartRef.current
    if (!handoff || reportedRouteKeyRef.current === registrationRouteKey) {
      return
    }

    if (!registrationSlot?.isConnected) {
      return
    }

    const frameHandle = window.requestAnimationFrame(() => {
      recordAdminRuntimeHandoff(registrationRouteKey, performance.now() - handoff.startedAt)
      reportedRouteKeyRef.current = registrationRouteKey
    })

    return () => window.cancelAnimationFrame(frameHandle)
  }, [
    registrationFrameHeight,
    registrationFrameLeft,
    registrationFrameTop,
    registrationFrameWidth,
    registrationLayout,
    registrationRouteKey,
    registrationSlot,
  ])

  if (!registration?.descriptor) {
    return null
  }

  const content = (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <V0PersistentJitterViewport
        descriptor={registration.descriptor}
        isDarkMode={registration.isDarkMode}
        frame={registration.frame}
      />
    </div>
  )

  if (registration.slot?.isConnected) {
    return createPortal(content, registration.slot)
  }

  const disableFixedFallbackForMobilePublic =
    registration.layout === "public" &&
    typeof window !== "undefined" &&
    window.innerWidth < 768

  if (!registration.frame || disableFixedFallbackForMobilePublic) {
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
        frame={registration.frame}
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
        currentRegistration.slot === nextRegistration.slot &&
        currentRegistration.isDarkMode === nextRegistration.isDarkMode &&
        currentRegistration.routeKey === nextRegistration.routeKey &&
        currentRegistration.frame?.top === nextRegistration.frame?.top &&
        currentRegistration.frame?.left === nextRegistration.frame?.left &&
        currentRegistration.frame?.width === nextRegistration.frame?.width &&
        currentRegistration.frame?.height === nextRegistration.frame?.height &&
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
  slot,
  isDarkMode,
}: {
  layout: V0ExperienceLayout
  descriptor: V0RuntimeDescriptor | null
  frame: V0RuntimeFrame | null
  slot: HTMLElement | null
  isDarkMode: boolean
}) {
  const experience = useContext(V0ExperienceContext)
  const pathname = usePathname()
  const registrationId = useId()

  useLayoutEffect(() => {
    if (!experience || !descriptor || (!slot && !frame) || (frame && (frame.width <= 0 || frame.height <= 0))) {
      return
    }

    experience.registerExperience({
      id: registrationId,
      layout,
      descriptor,
      frame,
      slot,
      isDarkMode,
      routeKey: pathname,
    })
  }, [descriptor, experience, frame, isDarkMode, layout, pathname, registrationId, slot])

  useLayoutEffect(() => {
    if (!experience || !descriptor || !slot) {
      return
    }

    let firstFrame = 0
    let secondFrame = 0
    let isActive = true

    const registerMeasuredFrame = () => {
      if (!isActive || !slot.isConnected) {
        return
      }

      const rect = slot.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) {
        return
      }

      experience.registerExperience({
        id: registrationId,
        layout,
        descriptor,
        frame: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
        slot,
        isDarkMode,
        routeKey: pathname,
      })
    }

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(registerMeasuredFrame)
    })

    document.fonts?.ready.then(() => {
      if (isActive) {
        registerMeasuredFrame()
      }
    }).catch(() => {})

    return () => {
      isActive = false
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
    }
  }, [descriptor, experience, isDarkMode, layout, pathname, registrationId, slot])
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
