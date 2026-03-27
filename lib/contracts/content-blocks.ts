export const POST_BLOCK_CONTENT_VERSION = 100

export type PostContentMode = "legacy" | "block"

export interface ContentBlockBase {
  id: string
}

export interface ParagraphBlock extends ContentBlockBase {
  type: "paragraph"
  text: string
}

export interface HeadingBlock extends ContentBlockBase {
  type: "heading"
  level: 1 | 2 | 3 | 4 | 5 | 6
  text: string
}

export interface ListBlock extends ContentBlockBase {
  type: "list"
  style: "ordered" | "unordered"
  items: string[]
}

export interface QuoteBlock extends ContentBlockBase {
  type: "quote"
  text: string
  attribution?: string | null
}

export interface CodeBlock extends ContentBlockBase {
  type: "code"
  language?: string | null
  code: string
}

export interface MathBlock extends ContentBlockBase {
  type: "math"
  variant: "inline" | "block"
  expression: string
}

export interface ImageBlock extends ContentBlockBase {
  type: "image"
  assetId?: string | null
  url?: string | null
  alt?: string | null
  caption?: string | null
}

export interface EmbedBlock extends ContentBlockBase {
  type: "embed"
  url: string
  provider: "GENERIC" | "YOUTUBE" | "GITHUB"
  label?: string | null
}

export interface ThematicBreakBlock extends ContentBlockBase {
  type: "thematicBreak"
}

export type ContentBlock =
  | ParagraphBlock
  | HeadingBlock
  | ListBlock
  | QuoteBlock
  | CodeBlock
  | MathBlock
  | ImageBlock
  | EmbedBlock
  | ThematicBreakBlock

export interface BlockDocument {
  type: "doc"
  version: number
  blocks: ContentBlock[]
}
