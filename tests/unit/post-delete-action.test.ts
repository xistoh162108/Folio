import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

const transactionMock = vi.fn()
const postFindUniqueMock = vi.fn()
const postFindFirstMock = vi.fn()
const requireUserMock = vi.fn()
const deleteAssetMock = vi.fn()
const revalidatePathMock = vi.fn()

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: transactionMock,
    post: {
      findUnique: postFindUniqueMock,
    },
  },
}))

vi.mock("@/lib/auth", () => ({
  requireUser: requireUserMock,
}))

vi.mock("@/lib/storage/supabase", () => ({
  deleteAssetFromSupabase: deleteAssetMock,
}))

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}))

let deletePostPermanently: typeof import("@/lib/actions/post.actions").deletePostPermanently

beforeAll(async () => {
  ;({ deletePostPermanently } = await import("@/lib/actions/post.actions"))
})

beforeEach(() => {
  transactionMock.mockReset()
  postFindUniqueMock.mockReset()
  postFindFirstMock.mockReset()
  requireUserMock.mockReset()
  deleteAssetMock.mockReset()
  revalidatePathMock.mockReset()
})

describe("deletePostPermanently", () => {
  it("deletes assets, removes the post, and revalidates admin/public routes", async () => {
    requireUserMock.mockResolvedValue({ id: "user-1" })

    const current = {
      id: "post-1",
      slug: "terminal-proof",
      title: "Terminal Proof",
      status: "PUBLISHED" as const,
      assets: [
        { bucket: "post-media", storagePath: "posts/post-1/images/one.png" },
        { bucket: "post-files", storagePath: "posts/post-1/files/two.pdf" },
      ],
    }

    const postDeleteMock = vi.fn().mockResolvedValue({ id: current.id })
    const auditCreateMock = vi.fn().mockResolvedValue(null)
    postFindUniqueMock.mockResolvedValue(current)
    postFindFirstMock.mockResolvedValue(null)

    transactionMock.mockImplementation(async (callback) =>
      callback({
        post: {
          delete: postDeleteMock,
          findFirst: postFindFirstMock,
        },
        auditLog: {
          create: auditCreateMock,
        },
      }),
    )

    const result = await deletePostPermanently("post-1")

    expect(result).toEqual({ success: true, id: "post-1" })
    expect(postFindUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "post-1" },
      }),
    )
    expect(deleteAssetMock).toHaveBeenNthCalledWith(1, "post-media", "posts/post-1/images/one.png")
    expect(deleteAssetMock).toHaveBeenNthCalledWith(2, "post-files", "posts/post-1/files/two.pdf")
    expect(postDeleteMock).toHaveBeenCalledWith({
      where: { id: "post-1" },
    })
    expect(auditCreateMock).toHaveBeenCalled()
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/posts")
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/posts/post-1")
    expect(revalidatePathMock).toHaveBeenCalledWith("/")
    expect(revalidatePathMock).toHaveBeenCalledWith("/notes")
    expect(revalidatePathMock).toHaveBeenCalledWith("/projects")
  })

  it("fails before deleting the post when storage cleanup does not complete", async () => {
    requireUserMock.mockResolvedValue({ id: "user-1" })

    const current = {
      id: "post-1",
      slug: "terminal-proof",
      title: "Terminal Proof",
      status: "PUBLISHED" as const,
      assets: [{ bucket: "post-files", storagePath: "posts/post-1/files/two.pdf" }],
    }

    const postDeleteMock = vi.fn().mockResolvedValue({ id: current.id })
    const auditCreateMock = vi.fn().mockResolvedValue(null)
    postFindUniqueMock.mockResolvedValue(current)
    postFindFirstMock.mockResolvedValue(null)

    transactionMock.mockImplementation(async (callback) =>
      callback({
        post: {
          delete: postDeleteMock,
          findFirst: postFindFirstMock,
        },
        auditLog: {
          create: auditCreateMock,
        },
      }),
    )

    vi.mocked(deleteAssetMock).mockRejectedValueOnce(new Error("bucket offline"))

    const result = await deletePostPermanently("post-1")

    expect(result).toEqual({ success: false, error: "bucket offline" })
    expect(postFindUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "post-1" },
      }),
    )
    expect(postDeleteMock).not.toHaveBeenCalled()
    expect(auditCreateMock).not.toHaveBeenCalled()
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })
})
