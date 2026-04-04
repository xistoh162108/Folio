import { getPrimaryProfileRuntimeSnapshot } from "@/lib/data/profile"
import { PRIMARY_PROFILE_SLUG } from "@/lib/profile/bootstrap"
import { readProfileResumeOverride } from "@/lib/profile/resume"

function encodePdfUnicodeHex(value: string) {
  const utf16le = Buffer.from(value, "utf16le")
  const utf16be = Buffer.allocUnsafe(utf16le.length + 2)
  utf16be[0] = 0xfe
  utf16be[1] = 0xff

  for (let index = 0; index < utf16le.length; index += 2) {
    utf16be[index + 2] = utf16le[index + 1] ?? 0
    utf16be[index + 3] = utf16le[index] ?? 0
  }

  return utf16be.toString("hex").toUpperCase()
}

function buildPdf(lines: string[]) {
  const content = lines
    .map((line, index) => `BT /F1 12 Tf 72 ${760 - index * 18} Td <${encodePdfUnicodeHex(line)}> Tj ET`)
    .join("\n")
  const contentLength = Buffer.byteLength(content, "utf8")

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >> endobj",
    `4 0 obj << /Length ${contentLength} >> stream\n${content}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type0 /BaseFont /HYGoThic-Medium /Encoding /UniKS-UCS2-H /DescendantFonts [6 0 R] >> endobj",
    "6 0 obj << /Type /Font /Subtype /CIDFontType0 /BaseFont /HYGoThic-Medium /CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 1 >> /DW 1000 >> endobj",
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
  const uploadedResume = await readProfileResumeOverride(PRIMARY_PROFILE_SLUG)
  if (uploadedResume) {
    return new Response(uploadedResume.buffer, {
      headers: {
        "Content-Type": uploadedResume.contentType ?? "application/pdf",
        "Content-Disposition": 'inline; filename="resume.pdf"',
        "Cache-Control": "no-store",
      },
    })
  }

  const profile = await getPrimaryProfileRuntimeSnapshot()
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
      ? profile.experience.map((item) => `${item.period} - ${item.label}`)
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
