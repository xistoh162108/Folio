export interface PostCommentDTO {
  id: string
  message: string
  sourceLabel: string
  createdAt: string
}

export interface GuestbookEntryDTO {
  id: string
  message: string
  sourceLabel: string
  createdAt: string
}

export interface PaginatedCollectionStateDTO {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

export interface CommunityModerationCommentDTO extends PostCommentDTO {
  postId: string
  postTitle: string
  postSlug: string
  postType: "NOTE" | "PROJECT"
}

export type CommunityModerationGuestbookEntryDTO = GuestbookEntryDTO

export interface PaginatedPostCommentsDTO {
  comments: PostCommentDTO[]
  pagination: PaginatedCollectionStateDTO
}

export interface PaginatedGuestbookEntriesDTO {
  entries: GuestbookEntryDTO[]
  pagination: PaginatedCollectionStateDTO
}
