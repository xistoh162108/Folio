import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { V0CommentsLog } from "@/components/v0/public/comments-log"
import { NotesScreen } from "@/components/v0/public/notes-screen"
import { ProjectsScreen } from "@/components/v0/public/projects-screen"

describe("public comments and search strips", () => {
  it("does not expose admin moderation affordances in the public comments log", () => {
    const markup = renderToStaticMarkup(
      createElement(V0CommentsLog, {
        postId: "post_1",
        initialComments: [
          {
            id: "comment_1",
            message: "reader log",
            sourceLabel: "127.0.0.1",
            createdAt: "2026-04-04T12:00:00.000Z",
          },
        ],
        initialCommentsPagination: {
          page: 1,
          pageSize: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
        isDarkMode: true,
      }),
    )

    expect(markup).not.toContain("[admin remove]")
    expect(markup).toContain("[delete]")
  })

  it("uses the shared inline button token for reset controls on notes and projects", () => {
    const notesMarkup = renderToStaticMarkup(
      createElement(NotesScreen, {
        isDarkMode: true,
        notes: [],
        searchQuery: "jit",
      }),
    )
    const projectsMarkup = renderToStaticMarkup(
      createElement(ProjectsScreen, {
        isDarkMode: true,
        projects: [],
        searchQuery: "jit",
      }),
    )

    expect(notesMarkup).toContain('class="v0-control-inline-button border-white/20 hover:bg-white/5"')
    expect(projectsMarkup).toContain('class="v0-control-inline-button border-white/20 hover:bg-white/5"')
    expect(notesMarkup).toContain("[reset]")
    expect(projectsMarkup).toContain("[reset]")
  })
})
