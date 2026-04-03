import { NotesScreen } from "@/components/v0/public/notes-screen"
import { getPublishedPostsByType } from "@/lib/data/posts"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

interface NotesScreenBoundProps {
  brandLabel?: string
  q?: string
}

export async function NotesScreenBound({ brandLabel = "xistoh.log", q }: NotesScreenBoundProps = {}) {
  const [isDarkMode, notes] = await Promise.all([getV0ThemeIsDark(), getPublishedPostsByType("NOTE", { q })])

  return <NotesScreen brandLabel={brandLabel} isDarkMode={isDarkMode} notes={notes} initialSearchQuery={q ?? ""} />
}
