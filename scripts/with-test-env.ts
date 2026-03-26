import { spawn } from "child_process"

import { loadTestEnvironment } from "./test-env"

loadTestEnvironment()

const [command, ...args] = process.argv.slice(2)

if (!command) {
  throw new Error("Missing command. Usage: tsx scripts/with-test-env.ts <binary> [...args]")
}

const child = spawn("pnpm", ["exec", command, ...args], {
  stdio: "inherit",
  env: process.env,
})

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})
