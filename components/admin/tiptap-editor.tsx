"use client"

import { useMemo } from "react"
import { EditorContent, useEditor, type Content } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"

type TiptapEditorProps = {
  initialContent: unknown
  fallbackHtml?: string
  onChange: (input: { content: unknown; html: string }) => void
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
}: {
  label: string
  onClick: () => void
  isActive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition ${
        isActive
          ? "border-[#D4FF00]/50 bg-[#D4FF00]/10 text-[#D4FF00]"
          : "border-white/10 text-zinc-300 hover:border-white/30 hover:text-white"
      }`}
    >
      {label}
    </button>
  )
}

export function TiptapEditor({ initialContent, fallbackHtml = "", onChange }: TiptapEditorProps) {
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
            class: "rounded-2xl bg-zinc-950 p-4 font-mono text-sm text-zinc-100",
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: "border-l-2 border-[#D4FF00]/40 pl-4 text-zinc-300",
          },
        },
        heading: {
          levels: [1, 2, 3],
        },
      }),
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
          "min-h-[420px] rounded-3xl border border-white/10 bg-black/40 px-4 py-4 text-white outline-none focus-visible:border-[#D4FF00]/40",
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
      <div className="min-h-[420px] rounded-3xl border border-white/10 bg-black/40 px-4 py-4 text-sm text-zinc-500">
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
      <div className="flex flex-wrap gap-2">
        <ToolbarButton label="P" isActive={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()} />
        <ToolbarButton label="H1" isActive={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
        <ToolbarButton label="H2" isActive={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        <ToolbarButton label="• List" isActive={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <ToolbarButton label="1. List" isActive={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <ToolbarButton label="Quote" isActive={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        <ToolbarButton label="Code" isActive={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
        <ToolbarButton label="Link" isActive={editor.isActive("link")} onClick={setLink} />
        <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()} />
        <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()} />
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
