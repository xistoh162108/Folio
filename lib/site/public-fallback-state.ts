import type { V0PublicPage } from "@/components/v0/public/public-shell"
import type { V0RuntimeDescriptor } from "@/components/v0/runtime/v0-experience-runtime"
import type { V0RouteAccentKey } from "@/lib/site/v0-route-palette"

export type PublicFallbackKind =
  | "route-not-found"
  | "note-not-found"
  | "project-not-found"
  | "public-runtime-error"
  | "global-runtime-error"

export interface PublicFallbackState {
  currentPage: V0PublicPage | null
  eyebrow: string
  title: string
  code: string
  message: string
  accentKey: V0RouteAccentKey
  runtimeDescriptor: V0RuntimeDescriptor
}

export function getPublicFallbackState(kind: PublicFallbackKind): PublicFallbackState {
  switch (kind) {
    case "note-not-found":
      return {
        currentPage: "notes",
        eyebrow: "// notes",
        title: "Note Missing",
        code: "[ NOTE_NOT_FOUND ]",
        message: "This note is unavailable or no longer published.",
        accentKey: "notes",
        runtimeDescriptor: {
          mode: "dither",
          variant: "detail-note",
          overlay: {
            label: "// NOTE ROUTE",
            value: "[MISSING]",
          },
        },
      }
    case "project-not-found":
      return {
        currentPage: "projects",
        eyebrow: "// projects",
        title: "Project Missing",
        code: "[ PROJECT_NOT_FOUND ]",
        message: "This project is unavailable or no longer published.",
        accentKey: "projects",
        runtimeDescriptor: {
          mode: "dither",
          variant: "detail-project",
          overlay: {
            label: "// PROJECT ROUTE",
            value: "[MISSING]",
          },
        },
      }
    case "public-runtime-error":
      return {
        currentPage: null,
        eyebrow: "// public",
        title: "Public Surface Fault",
        code: "[ PUBLIC_RUNTIME_ERROR ]",
        message: "A public runtime path failed while the app was still reachable.",
        accentKey: "default",
        runtimeDescriptor: {
          mode: "dither",
          variant: "public-generic",
          overlay: {
            label: "// PUBLIC SURFACE",
            value: "[FAULT]",
          },
        },
      }
    case "global-runtime-error":
      return {
        currentPage: null,
        eyebrow: "// public",
        title: "Service Fault",
        code: "[ GLOBAL_RUNTIME_ERROR ]",
        message: "A global app boundary fault interrupted the current public surface.",
        accentKey: "default",
        runtimeDescriptor: {
          mode: "dither",
          variant: "public-generic",
          overlay: {
            label: "// SERVICE STATUS",
            value: "[FAULT]",
          },
        },
      }
    case "route-not-found":
    default:
      return {
        currentPage: null,
        eyebrow: "// public",
        title: "Route Missing",
        code: "[ ROUTE_NOT_FOUND ]",
        message: "The requested public surface does not exist in the current route set.",
        accentKey: "default",
        runtimeDescriptor: {
          mode: "dither",
          variant: "public-generic",
          overlay: {
            label: "// PUBLIC ROUTE",
            value: "[MISSING]",
          },
        },
      }
  }
}
