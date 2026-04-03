"use client"

import { useState, useTransition } from "react"

import { savePrimaryProfile } from "@/lib/actions/profile.actions"
import type {
  ProfileAwardInput,
  ProfileEditorInput,
  ProfileEducationInput,
  ProfileExperienceInput,
  ProfileLinkInput,
  ProfileLinkKind,
  ProfileSource,
} from "@/lib/contracts/profile"

type EditorStatus =
  | { kind: "idle"; message: null }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string }

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= items.length) {
    return items
  }

  const nextItems = [...items]
  ;[nextItems[index], nextItems[nextIndex]] = [nextItems[nextIndex], nextItems[index]]
  return nextItems
}

const PROFILE_LINK_KINDS: ProfileLinkKind[] = ["GITHUB", "LINKEDIN", "EMAIL", "WEBSITE", "OTHER"]

interface ProfileSettingsEditorProps {
  initialProfile: ProfileEditorInput
  profileSource: ProfileSource
  isDarkMode: boolean
  borderColor: string
  mutedText: string
  accentText: string
  hoverBg: string
}

export function ProfileSettingsEditor({
  initialProfile,
  profileSource,
  isDarkMode,
  borderColor,
  mutedText,
  accentText,
  hoverBg,
}: ProfileSettingsEditorProps) {
  const [draft, setDraft] = useState(initialProfile)
  const [status, setStatus] = useState<EditorStatus>({ kind: "idle", message: null })
  const [isPending, startTransition] = useTransition()

  const saveLabel =
    status.kind === "success" ? "[saved]" : status.kind === "error" ? "[save failed]" : isPending ? "[saving]" : "[save profile]"

  const updateEducation = (index: number, patch: Partial<ProfileEducationInput>) => {
    setDraft((current) => ({
      ...current,
      education: current.education.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    }))
  }

  const updateExperience = (index: number, patch: Partial<ProfileExperienceInput>) => {
    setDraft((current) => ({
      ...current,
      experience: current.experience.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    }))
  }

  const updateAward = (index: number, patch: Partial<ProfileAwardInput>) => {
    setDraft((current) => ({
      ...current,
      awards: current.awards.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    }))
  }

  const updateLink = (index: number, patch: Partial<ProfileLinkInput>) => {
    setDraft((current) => ({
      ...current,
      links: current.links.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    }))
  }

  const handleSave = () => {
    setStatus({ kind: "idle", message: null })
    startTransition(async () => {
      const result = await savePrimaryProfile(draft)
      setStatus(result.success ? { kind: "success", message: "Profile runtime updated." } : { kind: "error", message: result.error })
    })
  }

  return (
    <div className="min-w-0 max-w-3xl space-y-8 pb-10">
      <div>
        <p className={`text-xs ${mutedText}`}>// profile settings</p>
        <h2 className="mt-1 text-lg">Profile &amp; CV Editor</h2>
      </div>

      <section className="space-y-4">
        <h3 className="text-sm">Basic Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={`mb-2 block text-xs ${mutedText}`}>Display Name</label>
            <input
              type="text"
              value={draft.displayName}
              onChange={(event) => setDraft((current) => ({ ...current, displayName: event.target.value }))}
              aria-label="Display Name"
              className={`v0-control-field ${borderColor}`}
            />
          </div>
          <div>
            <label className={`mb-2 block text-xs ${mutedText}`}>Email</label>
            <input
              type="email"
              value={draft.emailAddress}
              onChange={(event) => setDraft((current) => ({ ...current, emailAddress: event.target.value }))}
              aria-label="Email"
              className={`v0-control-field ${borderColor}`}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={`mb-2 block text-xs ${mutedText}`}>Role</label>
            <input
              type="text"
              value={draft.role}
              onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))}
              aria-label="Role"
              className={`v0-control-field ${borderColor}`}
            />
          </div>
          <div>
            <label className={`mb-2 block text-xs ${mutedText}`}>Resume Path</label>
            <input
              type="text"
              value={draft.resumeHref ?? ""}
              aria-label="Resume Path"
              readOnly
              className={`v0-control-field ${borderColor}`}
            />
          </div>
        </div>
        <div>
          <label className={`mb-2 block text-xs ${mutedText}`}>Bio</label>
          <textarea
            value={draft.summary}
            onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))}
            aria-label="Bio"
            className={`v0-control-area h-24 ${borderColor}`}
          />
        </div>
        <p className={`text-xs ${mutedText}`}>[{profileSource}] live source / terminal-owned profile runtime / resume route fixed at /resume.pdf</p>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm">Education</h3>
          <button
            type="button"
            aria-label="Add education"
            onClick={() =>
              setDraft((current) => ({
                ...current,
                education: [
                  ...current.education,
                  { id: createId("edu"), institution: "", degree: "", period: "", sortOrder: current.education.length },
                ],
              }))
            }
            className={`text-xs ${hoverBg} px-2 py-1`}
          >
            [+] Add
          </button>
        </div>
        <div className="space-y-2">
          {draft.education.map((entry, index) => (
            <div key={entry.id ?? `education-${index}`} className={`flex flex-col gap-3 border p-3 sm:flex-row sm:items-start ${borderColor}`}>
              <span className={mutedText}>=</span>
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  type="text"
                  value={entry.institution}
                  onChange={(event) => updateEducation(index, { institution: event.target.value })}
                  placeholder="Institution"
                  className={`v0-control-field ${borderColor}`}
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={entry.degree}
                    onChange={(event) => updateEducation(index, { degree: event.target.value })}
                    placeholder="Degree"
                    className={`v0-control-field-compact w-full sm:flex-1 ${borderColor}`}
                  />
                  <input
                    type="text"
                    value={entry.period}
                    onChange={(event) => updateEducation(index, { period: event.target.value })}
                    placeholder="Period"
                    className={`v0-control-field-compact w-full sm:w-48 ${borderColor}`}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs sm:justify-end">
                <button type="button" onClick={() => setDraft((current) => ({ ...current, education: moveItem(current.education, index, -1) }))} className={`${hoverBg} px-2 py-1`}>
                  [↑]
                </button>
                <button type="button" onClick={() => setDraft((current) => ({ ...current, education: moveItem(current.education, index, 1) }))} className={`${hoverBg} px-2 py-1`}>
                  [↓]
                </button>
                <button
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, education: current.education.filter((_, rowIndex) => rowIndex !== index) }))}
                  className={`${hoverBg} px-2 py-1 ${isDarkMode ? "text-red-400" : "text-red-600"}`}
                >
                  [x]
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm">Experience</h3>
          <button
            type="button"
            aria-label="Add experience"
            onClick={() =>
              setDraft((current) => ({
                ...current,
                experience: [
                  ...current.experience,
                  { id: createId("exp"), label: "", period: "", sortOrder: current.experience.length },
                ],
              }))
            }
            className={`text-xs ${hoverBg} px-2 py-1`}
          >
            [+] Add
          </button>
        </div>
        <div className="space-y-2">
          {draft.experience.map((entry, index) => (
            <div key={entry.id ?? `experience-${index}`} className={`flex flex-col gap-3 border p-3 sm:flex-row sm:items-start ${borderColor}`}>
              <span className={mutedText}>=</span>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={entry.period}
                    onChange={(event) => updateExperience(index, { period: event.target.value })}
                    placeholder="Period"
                    className={`v0-control-field-compact w-full sm:w-40 ${borderColor}`}
                  />
                  <input
                    type="text"
                    value={entry.label}
                    onChange={(event) => updateExperience(index, { label: event.target.value })}
                    placeholder="Short label"
                    className={`v0-control-field-compact w-full sm:flex-1 ${borderColor}`}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs sm:justify-end">
                <button type="button" onClick={() => setDraft((current) => ({ ...current, experience: moveItem(current.experience, index, -1) }))} className={`${hoverBg} px-2 py-1`}>
                  [↑]
                </button>
                <button type="button" onClick={() => setDraft((current) => ({ ...current, experience: moveItem(current.experience, index, 1) }))} className={`${hoverBg} px-2 py-1`}>
                  [↓]
                </button>
                <button
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, experience: current.experience.filter((_, rowIndex) => rowIndex !== index) }))}
                  className={`${hoverBg} px-2 py-1 ${isDarkMode ? "text-red-400" : "text-red-600"}`}
                >
                  [x]
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm">Awards</h3>
          <button
            type="button"
            aria-label="Add award"
            onClick={() =>
              setDraft((current) => ({
                ...current,
                awards: [...current.awards, { id: createId("award"), title: "", issuer: "", detail: "", year: "", sortOrder: current.awards.length }],
              }))
            }
            className={`text-xs ${hoverBg} px-2 py-1`}
          >
            [+] Add
          </button>
        </div>
        <div className="space-y-2">
          {draft.awards.map((entry, index) => (
            <div key={entry.id ?? `award-${index}`} className={`flex flex-col gap-3 border p-3 sm:flex-row sm:items-start ${borderColor}`}>
              <span className={mutedText}>=</span>
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  type="text"
                  value={entry.title}
                  onChange={(event) => updateAward(index, { title: event.target.value })}
                  placeholder="Award"
                  className={`v0-control-field ${borderColor}`}
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={entry.issuer ?? ""}
                    onChange={(event) => updateAward(index, { issuer: event.target.value })}
                    placeholder="Issuer"
                    className={`v0-control-field-compact w-full sm:flex-1 ${borderColor}`}
                  />
                  <input
                    type="text"
                    value={entry.year ?? ""}
                    onChange={(event) => updateAward(index, { year: event.target.value })}
                    placeholder="Year"
                    className={`v0-control-field-compact w-full sm:w-28 ${borderColor}`}
                  />
                </div>
                <textarea
                  value={entry.detail ?? ""}
                  onChange={(event) => updateAward(index, { detail: event.target.value })}
                  placeholder="Detail"
                  className={`v0-control-area h-20 ${borderColor}`}
                />
              </div>
              <div className="flex flex-wrap gap-2 text-xs sm:justify-end">
                <button type="button" onClick={() => setDraft((current) => ({ ...current, awards: moveItem(current.awards, index, -1) }))} className={`${hoverBg} px-2 py-1`}>
                  [↑]
                </button>
                <button type="button" onClick={() => setDraft((current) => ({ ...current, awards: moveItem(current.awards, index, 1) }))} className={`${hoverBg} px-2 py-1`}>
                  [↓]
                </button>
                <button
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, awards: current.awards.filter((_, rowIndex) => rowIndex !== index) }))}
                  className={`${hoverBg} px-2 py-1 ${isDarkMode ? "text-red-400" : "text-red-600"}`}
                >
                  [x]
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm">Links</h3>
          <button
            type="button"
            aria-label="Add link"
            onClick={() =>
              setDraft((current) => ({
                ...current,
                links: [...current.links, { id: createId("link"), label: "", url: "", kind: "WEBSITE", isVerified: false, sortOrder: current.links.length }],
              }))
            }
            className={`text-xs ${hoverBg} px-2 py-1`}
          >
            [+] Add
          </button>
        </div>
        <div className="space-y-2">
          {draft.links.map((entry, index) => (
            <div key={entry.id ?? `link-${index}`} className={`flex flex-col gap-3 border p-3 sm:flex-row sm:items-start ${borderColor}`}>
              <span className={mutedText}>=</span>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={entry.label}
                    onChange={(event) => updateLink(index, { label: event.target.value })}
                    placeholder="Label"
                    className={`v0-control-field-compact w-full sm:w-40 ${borderColor}`}
                  />
                  <input
                    type="text"
                    value={entry.url}
                    onChange={(event) => updateLink(index, { url: event.target.value })}
                    placeholder="URL"
                    className={`v0-control-field-compact w-full sm:flex-1 ${borderColor}`}
                  />
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {PROFILE_LINK_KINDS.map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => updateLink(index, { kind })}
                      className={`${hoverBg} px-2 py-1 ${entry.kind === kind ? accentText : mutedText}`}
                    >
                      [{kind.toLowerCase()}]
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => updateLink(index, { isVerified: !entry.isVerified })}
                    className={`${hoverBg} px-2 py-1 ${entry.isVerified ? accentText : mutedText}`}
                  >
                    {entry.isVerified ? "[verified]" : "[pending]"}
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs sm:justify-end">
                <button type="button" onClick={() => setDraft((current) => ({ ...current, links: moveItem(current.links, index, -1) }))} className={`${hoverBg} px-2 py-1`}>
                  [↑]
                </button>
                <button type="button" onClick={() => setDraft((current) => ({ ...current, links: moveItem(current.links, index, 1) }))} className={`${hoverBg} px-2 py-1`}>
                  [↓]
                </button>
                <button
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, links: current.links.filter((_, rowIndex) => rowIndex !== index) }))}
                  className={`${hoverBg} px-2 py-1 ${isDarkMode ? "text-red-400" : "text-red-600"}`}
                >
                  [x]
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className={`border-t pt-6 ${borderColor}`}>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <button
            type="button"
            onClick={() => void handleSave()}
            className={`v0-control-button ${isDarkMode ? "bg-white text-black" : "bg-black text-white"}`}
            disabled={isPending}
          >
            {saveLabel}
          </button>
          {status.message ? <span className={status.kind === "error" ? (isDarkMode ? "text-red-400" : "text-red-600") : accentText}>{status.message}</span> : null}
        </div>
      </div>
    </div>
  )
}
