"use client"

import { useMemo } from "react"
import { EditorContent, useEditor, type Content } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"

type TiptapEditorProps = {
  initialContent: unknown
  fallbackHtml?: string
  onChange: (input: { content: unknown; html: string }) => void
  variant?: "default" | "v0"
  isDarkMode?: boolean
  showToolbar?: boolean
}

function buildFallbackDoc(html: string) {
  const paragraphs = html
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => ({
      type: "paragraph",
      content: [{ type: "text", text: paragraph.replace(/<[^>]+>/g, "") }],
    }))

  return {
    type: "doc",
    content: paragraphs.length > 0 ? paragraphs : [{ type: "paragraph" }],
  }
}

function isValidDoc(content: unknown) {
  return Boolean(
    content &&
      typeof content === "object" &&
      "type" in content &&
      "content" in content &&
      (content as { type?: unknown }).type === "doc" &&
      Array.isArray((content as { content?: unknown }).content),
  )
}

function ToolbarButton({
  label,
  onClick,
  isActive = false,
  variant = "default",
  isDarkMode = true,
}: {
  label: string
  onClick: () => void
  isActive?: boolean
  variant?: "default" | "v0"
  isDarkMode?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        variant === "v0"
          ? `v0-control-button-compact transition ${
              isActive
                ? isDarkMode
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-black/20 bg-black/10 text-black"
                : isDarkMode
                  ? "border-white/20 text-white/70 hover:bg-white/5 hover:text-white"
                  : "border-black/20 text-black/70 hover:bg-black/5 hover:text-black"
            }`
          : `rounded-full border px-3 py-1.5 text-xs transition ${
              isActive
                ? "border-[#D4FF00]/50 bg-[#D4FF00]/10 text-[#D4FF00]"
                : "border-white/10 text-zinc-300 hover:border-white/30 hover:text-white"
            }`
      }
    >
      {label}
    </button>
  )
}

export function TiptapEditor({
  initialContent,
  fallbackHtml = "",
  onChange,
  variant = "default",
  isDarkMode = true,
  showToolbar = true,
}: TiptapEditorProps) {
  const editorSeed = useMemo<Content>(
    () => (isValidDoc(initialContent) ? (initialContent as Content) : buildFallbackDoc(fallbackHtml)),
    [fallbackHtml, initialContent],
  )

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: {
          HTMLAttributes: {
            class:
              variant === "v0"
                ? `border ${isDarkMode ? "border-white/20 text-zinc-100" : "border-black/20 text-zinc-900"} bg-transparent p-4 font-mono text-sm`
                : "rounded-2xl bg-zinc-950 p-4 font-mono text-sm text-zinc-100",
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: `border-l-2 ${isDarkMode ? "border-[#D4FF00]/40 text-zinc-300" : "border-[#3F5200]/40 text-zinc-700"} pl-4`,
          },
        },
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "text-[#D4FF00] underline underline-offset-4",
          rel: "noreferrer noopener",
          target: "_blank",
        },
      }),
      Placeholder.configure({
        placeholder: "Write your post content here.",
      }),
    ],
    content: editorSeed,
    editorProps: {
      attributes: {
        class:
          variant === "v0"
            ? `h-64 border ${isDarkMode ? "border-white/20 text-white focus-visible:border-white/40" : "border-black/20 text-black focus-visible:border-black/40"} bg-transparent px-4 py-3 text-sm leading-6 outline-none overflow-y-auto`
            : "min-h-[420px] rounded-3xl border border-white/10 bg-black/40 px-4 py-4 text-white outline-none focus-visible:border-[#D4FF00]/40",
      },
    },
    onUpdate({ editor: currentEditor }) {
      onChange({
        content: currentEditor.getJSON(),
        html: currentEditor.getHTML(),
      })
    },
  })

  if (!editor) {
    return (
      <div
        className={
          variant === "v0"
            ? `h-64 border ${isDarkMode ? "border-white/20 text-white/50" : "border-black/20 text-black/50"} bg-transparent px-4 py-3 text-sm leading-6`
            : "min-h-[420px] rounded-3xl border border-white/10 bg-black/40 px-4 py-4 text-sm text-zinc-500"
        }
      >
        Loading editor...
      </div>
    )
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("Enter link URL", previousUrl ?? "")

    if (url === null) {
      return
    }

    if (url.trim() === "") {
      editor.chain().focus().unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run()
  }

  return (
    <div className="space-y-3">
      {showToolbar ? (
        <div className={variant === "v0" ? `flex items-center gap-1 border ${isDarkMode ? "border-white/20" : "border-black/20"} p-2` : "flex flex-wrap gap-2"}>
          <ToolbarButton
            label="B"
            variant={variant}
            isDarkMode={isDarkMode}
            isActive={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          />
          <ToolbarButton
            label="I"
            variant={variant}
            isDarkMode={isDarkMode}
            isActive={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          />
          <ToolbarButton
            label="U"
            variant={variant}
            isDarkMode={isDarkMode}
            isActive={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          />
          <ToolbarButton
            label="H1"
            variant={variant}
            isDarkMode={isDarkMode}
            isActive={editor.isActive("heading", { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          />
          <ToolbarButton
            label="H2"
            variant={variant}
            isDarkMode={isDarkMode}
            isActive={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          />
          <ToolbarButton
            label="link"
            variant={variant}
            isDarkMode={isDarkMode}
            isActive={editor.isActive("link")}
            onClick={setLink}
          />
          <ToolbarButton
            label="list"
            variant={variant}
            isDarkMode={isDarkMode}
            isActive={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton
            label="code"
            variant={variant}
            isDarkMode={isDarkMode}
            isActive={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          />
        </div>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  )
}
