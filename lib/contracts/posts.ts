import type { PostCommentDTO } from "@/lib/contracts/community"
import type { BlockDocument, PostContentMode } from "@/lib/contracts/content-blocks"

export type PostKind = "NOTE" | "PROJECT"
export type PostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED"
export type PostAssetKind = "IMAGE" | "FILE"
export type PostLinkType = "GITHUB" | "WEBSITE" | "YOUTUBE" | "DOCS" | "OTHER"
export type PreviewFetchStatus = "PENDING" | "READY" | "FAILED"

export interface GenericPreviewMetadata {
  kind: "GENERIC"
}

export interface YouTubePreviewMetadata {
  kind: "YOUTUBE"
  videoId: string
}

export interface GitHubRepoPreviewMetadata {
  kind: "GITHUB"
  subtype?: "REPO"
  owner: string
  repo: string
  stars: number | null
  forks: number | null
  primaryLanguage: string | null
  openIssues: number | null
}

export interface GitHubIssuePreviewMetadata {
  kind: "GITHUB"
  subtype: "ISSUE"
  owner: string
  repo: string
  number: number
  state: string | null
  comments: number | null
  title: string | null
  author: string | null
}

export interface GitHubPullRequestPreviewMetadata {
  kind: "GITHUB"
  subtype: "PR"
  owner: string
  repo: string
  number: number
  state: string | null
  comments: number | null
  title: string | null
  author: string | null
  merged: boolean | null
}

export type GitHubPreviewMetadata =
  | GitHubRepoPreviewMetadata
  | GitHubIssuePreviewMetadata
  | GitHubPullRequestPreviewMetadata

export type PreviewMetadata = GenericPreviewMetadata | YouTubePreviewMetadata | GitHubPreviewMetadata

export interface PostLinkDTO {
  id?: string
  label: string
  url: string
  type: PostLinkType
  normalizedUrl?: string
  siteName?: string | null
  title?: string | null
  description?: string | null
  imageUrl?: string | null
  embedUrl?: string | null
  previewStatus?: PreviewFetchStatus
  metadata?: PreviewMetadata | null
}

export interface PostAssetDTO {
  id: string
  kind: PostAssetKind
  originalName: string
  mime: string
  size: number
  url: string
  createdAt: string
  pendingDeleteAt?: string | null
}

export interface PostCardDTO {
  id: string
  slug: string
  type: PostKind
  status: PostStatus
  title: string
  excerpt: string | null
  tags: string[]
  views: number
  coverImageUrl: string | null
  publishedAt: string | null
  updatedAt: string
}

export interface PostDetailDTO extends PostCardDTO {
  contentVersion: number
  contentMode: PostContentMode
  markdownSource: string | null
  htmlContent: string
  content?: BlockDocument | unknown
  links: PostLinkDTO[]
  assets: PostAssetDTO[]
  likeCount: number
  comments: PostCommentDTO[]
}

export interface PostEditorInput {
  id?: string
  title: string
  slug: string
  excerpt?: string
  type: PostKind
  status: PostStatus
  contentVersion?: number
  contentMode?: PostContentMode
  markdownSource?: string
  tags: string[]
  coverImageUrl?: string
  htmlContent: string
  content: BlockDocument | unknown
  githubUrl?: string
  demoUrl?: string
  docsUrl?: string
  assets: PostAssetDTO[]
  links: PostLinkDTO[]
}
