// src/index.ts
// Entry point for the skin asar patcher.
// Run with: pnpm apply (or pnpm apply -- --no-force / --no-backup / --allow-running)
import { patchAsar } from './patch-asar.js'

async function main(): Promise<void> {
  console.log('🐋 Deep-sea Maid Atelier Patcher (QwenWork Edition)')
  console.log('===================================================\n')

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
