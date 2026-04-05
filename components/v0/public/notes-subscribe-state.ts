export type NotesSubscribeActionState = {
  success?: boolean
  message?: string
  error?: string
} | null

export function getNotesSubscribeRenderState(
  state: NotesSubscribeActionState,
) {
  const statusText = state?.success
    ? `[ OK: ${state.message} ]`
    : state?.error
      ? `[ ERROR: ${state.error} ]`
      : null
  const isSuccessState = Boolean(state?.success && statusText)

  return {
    statusText,
    isSuccessState,
    shouldRenderControls: !isSuccessState,
    shouldRenderError: Boolean(!isSuccessState && state?.error && statusText),
    successLiveRegion: isSuccessState ? ("polite" as const) : undefined,
  }
}
