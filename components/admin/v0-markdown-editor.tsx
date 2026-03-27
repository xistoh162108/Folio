"use client"

import { forwardRef, Fragment, useImperativeHandle, useMemo, useRef, type ReactNode } from "react"

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

function renderInlineTokens(text: string, isDarkMode: boolean) {
  const accent = isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"
  const muted = isDarkMode ? "text-white/45" : "text-black/45"
  const nodes: ReactNode[] = []
  const pattern = /(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*\n]+\*|\$[^$\n]+\$)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    const token = match[0]
    if (token.startsWith("[")) {
      nodes.push(
        <span key={`${match.index}-link`} className={accent}>
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
        <span key={`${match.index}-math`} className={accent}>
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

function renderMirror(source: string, placeholder: string, isDarkMode: boolean) {
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
      className = isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"
    } else if (inCodeFence) {
      className = isDarkMode ? "text-white/70" : "text-black/70"
    } else if (inMathFence || /^\$\$.*\$\$$/.test(trimmed)) {
      className = isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"
    } else if (/^#{1,6}\s/.test(line)) {
      className = "font-semibold"
    } else if (/^>\s?/.test(line)) {
      className = isDarkMode ? "text-white/60" : "text-black/60"
    } else if (/^(-|\*|\d+[.)])\s/.test(line)) {
      className = isDarkMode ? "text-white/85" : "text-black/85"
    } else if (/^!\[.*\]\(https?:\/\/[^\s)]+/.test(trimmed) || /^https?:\/\/\S+$/.test(trimmed)) {
      className = isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"
    }

    return (
      <Fragment key={`line-${index}`}>
        <div className={className}>{renderInlineTokens(line, isDarkMode)}</div>
        {index < lines.length - 1 ? "\n" : null}
      </Fragment>
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
  const mirror = useMemo(() => renderMirror(value, placeholder, isDarkMode), [isDarkMode, placeholder, value])

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
          className={`pointer-events-none absolute inset-0 overflow-auto whitespace-pre-wrap break-words px-4 py-3 text-sm leading-6 ${
            isDarkMode ? "text-white" : "text-black"
          }`}
        >
          {mirror}
        </div>
        <textarea
          ref={textareaRef}
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
          className={`absolute inset-0 h-full w-full resize-none bg-transparent px-4 py-3 text-sm leading-6 outline-none ${
            isDarkMode ? "caret-white text-transparent selection:bg-white/20" : "caret-black text-transparent selection:bg-black/10"
          }`}
        />
      </div>

      <p className={`text-xs ${mutedText}`}>// markdown-first live syntax layer :: no separate preview</p>
    </div>
  )
})
