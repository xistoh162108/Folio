"use client"

import { PostEditor } from "@/components/admin/post-editor"
import { AdminShell } from "@/components/v0/admin/admin-shell"
import { useV0ThemeController } from "@/components/v0/use-v0-theme-controller"
import type { PostEditorInput } from "@/lib/contracts/posts"

interface EditorScreenProps {
  post: PostEditorInput
  isDarkMode?: boolean
  brandLabel?: string
}

export function EditorScreen({ post, isDarkMode: initialIsDarkMode = true, brandLabel = "xistoh.log" }: EditorScreenProps) {
  const { isDarkMode, toggleTheme } = useV0ThemeController(initialIsDarkMode)
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"

  return (
    <AdminShell currentSection="content" isDarkMode={isDarkMode} brandLabel={brandLabel} onToggleTheme={toggleTheme}>
      <main className="min-h-full p-4 pb-10 sm:p-6 md:h-full md:min-h-0 md:overflow-y-auto">
        <div className="max-w-3xl space-y-6 pb-10">
          <div>
            <p className={`text-xs ${mutedText}`}>// new content</p>
            <h2 className="text-lg mt-1">Content Editor</h2>
          </div>

          <PostEditor initialPost={post} showHeader={false} variant="v0" isDarkMode={isDarkMode} />
        </div>
      </main>
    </AdminShell>
  )
}
