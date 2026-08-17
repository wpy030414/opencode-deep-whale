// src/index.ts
// Entry point for the opencode-deep-whale asar patcher.
// Run with: pnpm patch (or pnpm dev / pnpm build)
import { patchAsar } from './patch-asar.js'

async function main(): Promise<void> {
  console.log('🐋 Deep-sea Maid Atelier Patcher')
  console.log('================================\n')

  // Parse CLI args if needed, otherwise use defaults
  const args = process.argv.slice(2)
  const force = !args.includes('--no-force')
  const noBackup = args.includes('--no-backup')
  const allowRunning = args.includes('--allow-running')

  const options: Parameters<typeof patchAsar>[0] = {
    force,
    noBackup,
    allowRunning,
  }

  await patchAsar(options)
}

main().catch((err) => {
  console.error('\n❌ Patch failed:', err.message)
  process.exit(1)
})
