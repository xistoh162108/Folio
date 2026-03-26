import { resetTestDatabase } from "./test-db"

void resetTestDatabase().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
