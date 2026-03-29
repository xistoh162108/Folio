import { Prisma } from "@prisma/client"

export function isMissingTableError(error: unknown, tableName?: string) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false
  }

  if (error.code !== "P2021") {
    return false
  }

  if (!tableName) {
    return true
  }

  return String(error.meta?.table ?? "").includes(tableName)
}

export function isMissingColumnError(error: unknown, columnName?: string) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false
  }

  if (error.code !== "P2022") {
    return false
  }

  if (!columnName) {
    return true
  }

  return String(error.meta?.column ?? "").includes(columnName)
}

export function isMissingRelationInRawQuery(error: unknown, relationName?: string) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false
  }

  if (error.code !== "P2010") {
    return false
  }

  const message = String(error.meta?.message ?? error.message ?? "")
  if (!message.includes("does not exist")) {
    return false
  }

  if (!relationName) {
    return true
  }

  return message.includes(relationName)
}

export function isMissingRecordError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025"
}

export function isUniqueConstraintError(error: unknown, target?: string) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false
  }

  if (error.code !== "P2002") {
    return false
  }

  if (!target) {
    return true
  }

  const metaTarget = error.meta?.target
  if (Array.isArray(metaTarget)) {
    return metaTarget.some((value) => String(value).includes(target))
  }

  return String(metaTarget ?? "").includes(target)
}
