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

export interface CommunityModerationCommentDTO extends PostCommentDTO {
  postId: string
  postTitle: string
  postSlug: string
  postType: "NOTE" | "PROJECT"
}

export type CommunityModerationGuestbookEntryDTO = GuestbookEntryDTO
