export type UploadKind = "image" | "file"

export interface UploadRequest {
  kind: UploadKind
  postId: string
}

export interface UploadResponse {
  assetId: string
  kind: UploadKind
  storagePath: string
  originalName: string
  mime: string
  size: number
  url?: string
}
