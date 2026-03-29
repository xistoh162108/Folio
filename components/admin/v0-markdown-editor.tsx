"use client"

import { forwardRef, useImperativeHandle, useMemo, useRef, type ReactNode } from "react"

import { getV0RouteAccentPalette } from "@/lib/site/v0-route-palette"

export interface V0MarkdownEditorHandle {
  insertSnippet: (snippet: string, options?: { selectOffset?: number }) => void
  focus: () => void
}

interface V0MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  isDarkMode?: boolean
  placeholder?: string
}

function renderInlineTokens(text: string, accentColor: string, isDarkMode: boolean) {
  const muted = isDarkMode ? "text-white/45" : "text-black/45"
  const accentStyle = { color: accentColor }
  const nodes: ReactNode[] = []
  const pattern = /(\[[^\]]+\]\((?:https?:\/\/|asset:\/\/)[^\s)]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*\n]+\*|\$[^$\n]+\$)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    const token = match[0]
    if (token.startsWith("[")) {
      nodes.push(
        <span key={`${match.index}-link`} style={accentStyle}>
          {token}
        </span>,
      )
    } else if (token.startsWith("`")) {
      nodes.push(
        <span key={`${match.index}-code`} className={muted}>
          {token}
        </span>,
      )
    } else if (token.startsWith("$")) {
      nodes.push(
        <span key={`${match.index}-math`} style={accentStyle}>
          {token}
        </span>,
      )
    } else {
      nodes.push(
        <span key={`${match.index}-em`} className="font-semibold">
          {token}
        </span>,
      )
    }

    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

function renderMirror(source: string, placeholder: string, isDarkMode: boolean, accentColor: string) {
  if (source.length === 0) {
    return <span className={isDarkMode ? "text-white/25" : "text-black/25"}>{placeholder}</span>
  }

  const lines = source.split("\n")
  let inCodeFence = false
  let inMathFence = false

  return lines.map((line, index) => {
    const trimmed = line.trim()
    let className = ""

    if (trimmed.startsWith("```")) {
      inCodeFence = !inCodeFence
      className = isDarkMode ? "text-white/45" : "text-black/45"
    } else if (trimmed === "$$") {
      inMathFence = !inMathFence
      className = ""
    } else if (inCodeFence) {
      className = isDarkMode ? "text-white/70" : "text-black/70"
    } else if (inMathFence || /^\$\$.*\$\$$/.test(trimmed)) {
      className = ""
    } else if (/^#{1,6}\s/.test(line)) {
      className = "font-semibold"
    } else if (/^>\s?/.test(line)) {
      className = isDarkMode ? "text-white/60" : "text-black/60"
    } else if (/^(-|\*|\d+[.)])\s/.test(line)) {
      className = isDarkMode ? "text-white/85" : "text-black/85"
    } else if (/^!\[.*\]\((?:https?:\/\/|asset:\/\/)[^\s)]+/.test(trimmed) || /^https?:\/\/\S+$/.test(trimmed)) {
      className = ""
    }

    return (
      <span key={`line-${index}`} className={`block ${className}`} style={className ? undefined : { color: accentColor }}>
        {line.length > 0 ? renderInlineTokens(line, accentColor, isDarkMode) : "\u200b"}
      </span>
    )
  })
}

export const V0MarkdownEditor = forwardRef<V0MarkdownEditorHandle, V0MarkdownEditorProps>(function V0MarkdownEditor(
  {
    value,
    onChange,
    isDarkMode = true,
    placeholder = "# Title\n\nWrite in markdown...",
  },
  ref,
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)
  const borderColor = isDarkMode ? "border-white/20" : "border-black/20"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const accentColor = useMemo(() => getV0RouteAccentPalette("default", isDarkMode).color, [isDarkMode])
  const mirror = useMemo(() => renderMirror(value, placeholder, isDarkMode, accentColor), [accentColor, isDarkMode, placeholder, value])

  const syncScroll = () => {
    if (!textareaRef.current || !mirrorRef.current) {
      return
    }

    mirrorRef.current.scrollTop = textareaRef.current.scrollTop
    mirrorRef.current.scrollLeft = textareaRef.current.scrollLeft
  }

  const insertSnippet = (snippet: string, options?: { selectOffset?: number }) => {
    const element = textareaRef.current
    if (!element) {
      onChange(`${value}${snippet}`)
      return
    }

    const start = element.selectionStart ?? value.length
    const end = element.selectionEnd ?? value.length
    const nextValue = `${value.slice(0, start)}${snippet}${value.slice(end)}`
    onChange(nextValue)

    const cursor = start + (options?.selectOffset ?? snippet.length)
    requestAnimationFrame(() => {
      const textarea = textareaRef.current
      if (!textarea) {
        return
      }

      textarea.focus()
      textarea.setSelectionRange(cursor, cursor)
      syncScroll()
    })
  }

  useImperativeHandle(ref, () => ({
    insertSnippet,
    focus() {
      textareaRef.current?.focus()
    },
  }))

  return (
    <div className="space-y-3">
      <div className={`flex items-center gap-1 border ${borderColor} p-2`}>
        <button type="button" onClick={() => insertSnippet("# ")} className={`v0-control-button-compact ${borderColor} ${hoverBg}`}>
          h1
        </button>
        <button type="button" onClick={() => insertSnippet("> ")} className={`v0-control-button-compact ${borderColor} ${hoverBg}`}>
          quote
        </button>
        <button type="button" onClick={() => insertSnippet("- ")} className={`v0-control-button-compact ${borderColor} ${hoverBg}`}>
          list
        </button>
        <button
          type="button"
          onClick={() => insertSnippet("```\ncode\n```", { selectOffset: 4 })}
          className={`v0-control-button-compact ${borderColor} ${hoverBg}`}
        >
          code
        </button>
        <button
          type="button"
          onClick={() => insertSnippet("$$\nexpression\n$$", { selectOffset: 3 })}
          className={`v0-control-button-compact ${borderColor} ${hoverBg}`}
        >
          math
        </button>
        <button type="button" onClick={() => insertSnippet("\n---\n")} className={`v0-control-button-compact ${borderColor} ${hoverBg}`}>
          rule
        </button>
      </div>

      <div className={`relative h-64 border ${borderColor}`}>
        <div
          ref={mirrorRef}
          aria-hidden="true"
          data-v0-editor-mirror
          className={`v0-editor-surface pointer-events-none absolute inset-0 ${isDarkMode ? "text-white" : "text-black"}`}
        >
          {mirror}
        </div>
        <textarea
          ref={textareaRef}
          data-v0-editor-textarea
          aria-label="Markdown body"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Tab") {
              event.preventDefault()
              insertSnippet("  ")
            }
          }}
          onScroll={syncScroll}
          spellCheck={false}
          placeholder={placeholder}
          wrap="soft"
          className={`v0-editor-surface absolute inset-0 h-full w-full resize-none bg-transparent outline-none ${
            isDarkMode ? "caret-white text-transparent selection:bg-white/20" : "caret-black text-transparent selection:bg-black/10"
          }`}
        />
      </div>

      <p className={`text-xs ${mutedText}`}>// markdown-first live syntax layer :: no separate preview</p>
    </div>
  )
})
