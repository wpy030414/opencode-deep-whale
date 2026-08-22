// src/assets-loader.ts
// Helper to load standard role images from skin-assets via manifest.json
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export type StandardRole = 'background-day' | 'background-night' | 'character-left' | 'character-right'

interface Manifest {
  schema: string
  description: string
  roles: Record<StandardRole, string>
  /**
   * Which roles feed the color extraction pipeline.
   * Must be explicitly declared — scene backgrounds must NOT tint the theme.
   */
  colorSource: StandardRole[]
}

// Resolve skin-assets path from skin-core
function getSkinAssetsDir(): string {
  return path.resolve(__dirname, '../../skin-assets')
}

// Load manifest.json from skin-assets
function loadManifest(): Manifest {
  const manifestPath = path.join(getSkinAssetsDir(), 'original-images', 'manifest.json')
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`manifest.json not found: ${manifestPath}`)
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  if (!manifest.colorSource || !Array.isArray(manifest.colorSource) || manifest.colorSource.length === 0) {
    throw new Error('manifest.json must declare a non-empty "colorSource" array (roles feeding the color pipeline)')
  }
  return manifest
}

// Get the physical file path for a standard role
export function getRoleImagePath(role: StandardRole): string {
  const manifest = loadManifest()
  const filename = manifest.roles[role]
  if (!filename) {
    throw new Error(`role '${role}' not found in manifest.json`)
  }
  return path.join(getSkinAssetsDir(), 'original-images', filename)
}

// Get all standard role → file path mappings
export function getAllRoleImagePaths(): Record<StandardRole, string> {
  const manifest = loadManifest()
  const baseDir = path.join(getSkinAssetsDir(), 'original-images')
  const result = {} as Record<StandardRole, string>
  for (const role of Object.keys(manifest.roles) as StandardRole[]) {
    result[role] = path.join(baseDir, manifest.roles[role])
  }
  return result
}

// Get the physical file paths for the declared color-source roles only.
// These are the ONLY images the token pipeline samples from.
export function getColorSourceImagePaths(): string[] {
  const manifest = loadManifest()
  const baseDir = path.join(getSkinAssetsDir(), 'original-images')
  return manifest.colorSource.map((role) => {
    const filename = manifest.roles[role]
    if (!filename) {
      throw new Error(`colorSource role '${role}' not found in manifest.json roles`)
    }
    return path.join(baseDir, filename)
  })
}
