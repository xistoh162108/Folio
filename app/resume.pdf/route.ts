import { getPrimaryResumeRedirectUrl } from "@/lib/actions/profile.actions"
import { getPrimaryProfileRuntimeSnapshot } from "@/lib/data/profile"

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}

function buildPdf(lines: string[]) {
  const content = lines
    .map((line, index) => `BT /F1 12 Tf 72 ${760 - index * 18} Td (${escapePdfText(line)}) Tj ET`)
    .join("\n")
  const contentLength = Buffer.byteLength(content, "utf8")

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >> endobj",
    `4 0 obj << /Length ${contentLength} >> stream\n${content}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Courier >> endobj",
  ]

  let pdf = "%PDF-1.4\n"
  const offsets = [0]

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"))
    pdf += `${object}\n`
  }

  const xrefStart = Buffer.byteLength(pdf, "utf8")
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += "0000000000 65535 f \n"

  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
  }

  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`

  return Buffer.from(pdf, "utf8")
}

export async function GET() {
  const profile = await getPrimaryProfileRuntimeSnapshot()
  const redirectUrl = await getPrimaryResumeRedirectUrl(profile.resumeHref)

  if (redirectUrl) {
    return Response.redirect(redirectUrl, 302)
  }

  const educationLines =
    profile.education.length > 0
      ? profile.education.map((item) =>
          item.degree
            ? `${item.institution} - ${item.degree}${item.period ? ` (${item.period})` : ""}`
            : `${item.institution}${item.period ? ` (${item.period})` : ""}`,
        )
      : ["No education records."]
  const experienceLines =
    profile.experience.length > 0
      ? profile.experience.map((item) => `${item.period} - ${item.title}: ${item.detail}`)
      : ["No experience records."]

  const lines = [
    "xistoh.log // resume",
    "",
    `Name: ${profile.displayName}`,
    `Role: ${profile.role}`,
    `Bio: ${profile.summary}`,
    "",
    "Education",
    ...educationLines,
    "",
    "Experience",
    ...experienceLines,
  ]

  return new Response(buildPdf(lines), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="resume.pdf"',
      "Cache-Control": "no-store",
    },
  })
}
