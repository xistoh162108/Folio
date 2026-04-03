import { NotesScreen } from "@/components/v0/public/notes-screen"
import { tagFilters } from "@/components/v0/fixtures"
import { getPublishedNotes } from "@/lib/data/posts"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export async function NotesScreenBound({
  searchParams = Promise.resolve({}),
  brandLabel = "xistoh.log",
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
  brandLabel?: string
} = {}) {
  const query = await searchParams
  const [isDarkMode, notesData] = await Promise.all([getV0ThemeIsDark(), getPublishedNotes(query, tagFilters)])

  return <NotesScreen brandLabel={brandLabel} isDarkMode={isDarkMode} notesData={notesData} />
}
