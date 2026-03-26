import { clearTestArtifacts } from "../lib/testing/sinks"
import { prepareTestDatabase, resetTestDatabase } from "../scripts/test-db"
import { loadTestEnvironment } from "../scripts/test-env"

export default async function globalSetup() {
  loadTestEnvironment()
  await clearTestArtifacts()

  if (process.env.CI) {
    await prepareTestDatabase()
  }

  await resetTestDatabase()
}
