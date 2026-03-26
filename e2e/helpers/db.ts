import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as typeof globalThis & {
  e2ePrisma?: PrismaClient
}

export const testPrisma =
  globalForPrisma.e2ePrisma ??
  new PrismaClient({
    log: process.env.CI ? ["error"] : ["warn", "error"],
  })

if (!globalForPrisma.e2ePrisma) {
  globalForPrisma.e2ePrisma = testPrisma
}

export async function disconnectTestPrisma() {
  await testPrisma.$disconnect()
}
