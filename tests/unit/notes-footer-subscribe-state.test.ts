import { describe, expect, it } from "vitest"

import { getNotesSubscribeRenderState } from "@/components/v0/public/notes-subscribe-state"

describe("notes subscribe footer success exclusivity", () => {
  it("marks success as an exclusive footer state with its own live-region line", () => {
    const state = getNotesSubscribeRenderState({
      success: true,
      message: "Verification email sent. One step left.",
    })

    expect(state.isSuccessState).toBe(true)
    expect(state.shouldRenderControls).toBe(false)
    expect(state.shouldRenderError).toBe(false)
    expect(state.successLiveRegion).toBe("polite")
    expect(state.statusText).toBe("[ OK: Verification email sent. One step left. ]")
  })

  it("keeps controls mounted for non-success states and surfaces inline errors separately", () => {
    const idleState = getNotesSubscribeRenderState(null)
    const errorState = getNotesSubscribeRenderState({
      error: "Already queued.",
    })

    expect(idleState.isSuccessState).toBe(false)
    expect(idleState.shouldRenderControls).toBe(true)
    expect(idleState.shouldRenderError).toBe(false)
    expect(idleState.statusText).toBeNull()

    expect(errorState.isSuccessState).toBe(false)
    expect(errorState.shouldRenderControls).toBe(true)
    expect(errorState.shouldRenderError).toBe(true)
    expect(errorState.successLiveRegion).toBeUndefined()
    expect(errorState.statusText).toBe("[ ERROR: Already queued. ]")
  })
})
