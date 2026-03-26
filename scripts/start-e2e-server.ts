import { rm } from "fs/promises"

import { loadTestEnvironment } from "./test-env"

async function main() {
  loadTestEnvironment()

  await rm(".next", {
    recursive: true,
    force: true,
  })

  const { spawn } = await import("child_process")

  const port = process.env.PORT ?? "3001"
  const child = spawn("pnpm", ["exec", "next", "dev", "-p", port], {
    stdio: "inherit",
    env: process.env,
    shell: true,
  })

  child.on("exit", (code) => {
    process.exit(code ?? 0)
  })
}

void main()
