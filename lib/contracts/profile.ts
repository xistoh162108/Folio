export type ProfileLinkKind = "GITHUB" | "LINKEDIN" | "EMAIL" | "WEBSITE" | "OTHER"
export type ProfileSource = "database" | "static-fallback"

export interface ProfileEducationDTO {
  id: string
  institution: string
  degree: string
  period: string
  sortOrder: number
}

export interface ProfileExperienceDTO {
  id: string
  title: string
  label: string
  detail: string
  period: string
  year: string | null
  sortOrder: number
}

export interface ProfileAwardDTO {
  id: string
  title: string
  issuer: string | null
  detail: string | null
  year: string | null
  sortOrder: number
}

export interface ProfileLinkDTO {
  id: string
  label: string
  url: string
  kind: ProfileLinkKind
  isVerified: boolean
  sortOrder: number
}

export interface ProfileSnapshotDTO {
  id: string
  slug: string
  displayName: string
  role: string
  summary: string
  emailAddress: string
  resumeHref: string | null
  githubHref: string | null
  linkedinHref: string | null
  education: ProfileEducationDTO[]
  experience: ProfileExperienceDTO[]
  awards: ProfileAwardDTO[]
  links: ProfileLinkDTO[]
  source: ProfileSource
}

export interface ProfileEducationInput {
  id?: string
  institution: string
  degree: string
  period: string
  sortOrder: number
}

export interface ProfileExperienceInput {
  id?: string
  title: string
  label: string
  detail: string
  period: string
  year?: string | null
  sortOrder: number
}

export interface ProfileAwardInput {
  id?: string
  title: string
  issuer?: string | null
  detail?: string | null
  year?: string | null
  sortOrder: number
}

export interface ProfileLinkInput {
  id?: string
  label: string
  url: string
  kind: ProfileLinkKind
  isVerified: boolean
  sortOrder: number
}

export interface ProfileEditorInput {
  slug: string
  displayName: string
  role: string
  summary: string
  emailAddress: string
  resumeHref?: string | null
  education: ProfileEducationInput[]
  experience: ProfileExperienceInput[]
  awards: ProfileAwardInput[]
  links: ProfileLinkInput[]
}

export interface ProfileBootstrapInput {
  slug: string
  displayName: string
  role: string
  summary: string
  emailAddress: string
  resumeHref: string | null
  githubHref: string | null
  linkedinHref: string | null
  education: Array<{
    institution: string
    degree: string
    period: string
    sortOrder: number
  }>
  experience: Array<{
    title: string
    label: string
    detail: string
    period: string
    year: string | null
    sortOrder: number
  }>
  awards: Array<{
    title: string
    issuer: string | null
    detail: string | null
    year: string | null
    sortOrder: number
  }>
  links: Array<{
    label: string
    url: string
    kind: ProfileLinkKind
    isVerified: boolean
    sortOrder: number
  }>
}
