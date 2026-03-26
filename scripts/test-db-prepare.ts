import { prepareTestDatabase } from "./test-db"

void prepareTestDatabase().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
