import { promises as fs } from "fs"
import path from "path"

export const TEST_ARTIFACT_ROOT = path.join(process.cwd(), ".tmp")
export const TEST_EMAIL_OUTBOX_PATH = path.join(TEST_ARTIFACT_ROOT, "test-outbox.ndjson")
export const TEST_WEBHOOK_SINK_PATH = path.join(TEST_ARTIFACT_ROOT, "test-webhooks.ndjson")
export const TEST_STORAGE_ROOT = path.join(TEST_ARTIFACT_ROOT, "test-storage")

function ensureWithin(root: string, candidate: string) {
  const normalizedRoot = path.resolve(root)
  const normalizedCandidate = path.resolve(candidate)

  if (!normalizedCandidate.startsWith(normalizedRoot)) {
    throw new Error("Unsafe test storage path.")
  }

  return normalizedCandidate
}

export async function appendJsonLine(filePath: string, payload: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.appendFile(filePath, `${JSON.stringify(payload)}\n`, "utf8")
}

export async function readJsonLines<T>(filePath: string): Promise<T[]> {
  try {
    const contents = await fs.readFile(filePath, "utf8")
    return contents
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as T)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return []
    }

    throw error
  }
}

export async function clearTestArtifacts() {
  await fs.rm(TEST_ARTIFACT_ROOT, { recursive: true, force: true })
}

export function resolveTestStoragePath(bucket: string, storagePath: string) {
  const bucketRoot = ensureWithin(TEST_STORAGE_ROOT, path.join(TEST_STORAGE_ROOT, bucket))
  const candidate = ensureWithin(bucketRoot, path.join(bucketRoot, ...storagePath.split("/").filter(Boolean)))
  return candidate
}

export async function writeTestStorageObject(bucket: string, storagePath: string, buffer: Buffer) {
  const filePath = resolveTestStoragePath(bucket, storagePath)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, buffer)
}

export async function deleteTestStorageObject(bucket: string, storagePath: string) {
  try {
    await fs.rm(resolveTestStoragePath(bucket, storagePath))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return
    }

    throw error
  }
}

export async function readTestStorageObject(bucket: string, storagePath: string) {
  return fs.readFile(resolveTestStoragePath(bucket, storagePath))
}
