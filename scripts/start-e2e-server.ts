import { rm } from "fs/promises"

import { loadTestEnvironment } from "./test-env"

async function runCommand(command: string, args: string[]) {
  const { spawn } = await import("child_process")

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: process.env,
      shell: true,
    })

    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${command} ${args.join(" ")} was interrupted by ${signal}`))
        return
      }

      if (code !== 0) {
        reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`))
        return
      }

      resolve()
    })
  })
}

async function main() {
  loadTestEnvironment()

  await rm(".next", {
    recursive: true,
    force: true,
  })

  const { spawn } = await import("child_process")

  const port = process.env.PORT ?? "3001"

  await runCommand("pnpm", ["exec", "next", "build"])

  const child = spawn("pnpm", ["exec", "next", "start", "-p", port], {
    stdio: "inherit",
    env: process.env,
    shell: true,
  })

  child.on("exit", (code) => {
    process.exit(code ?? 0)
  })
}

void main()
