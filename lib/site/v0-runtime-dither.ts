export type V0DitherAspectBucket = "standard" | "tall"

export type V0DitherConfig = {
  shape: "cat" | "noise" | "warp" | "grid"
  type: "4x4" | "2x2"
  pxSize: number
  scale: number
  speed: number
}

export function resolveV0DitherAspectBucket(frame: { width: number; height: number } | null | undefined): V0DitherAspectBucket {
  if (!frame || frame.width <= 0 || frame.height <= 0) {
    return "standard"
  }

  return frame.height / frame.width >= 1.3 ? "tall" : "standard"
}

export function getV0DitherConfig(
  variant:
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
    | "admin-access",
  aspectBucket: V0DitherAspectBucket = "standard",
): V0DitherConfig {
  if (aspectBucket === "tall" && (variant === "home" || variant === "public-generic")) {
    return { shape: "noise", type: "4x4", pxSize: 2, scale: 0.56, speed: 0.04 }
  }

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
