// packages/skin-core/src/index.ts
// Entry point: build design tokens from source images.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractColorsFromImages } from './extract-colors.js'
import { generateTokenPairs } from './generate-tokens.js'
import { getAllRoleImagePaths, getColorSourceImagePaths } from './assets-loader.js'
import type { BuildOptions } from './types.js'

// Re-export color utilities for skin packages to derive their own scales.
export {
  rgbToHex,
  hexToRgb,
  rgbToHsl,
  hslToRgb,
  adjustLightness,
  lerpRgb,
  generateScale,
  generateTokens,
  generateTokenPairs,
} from './generate-tokens.js'
export { getAllRoleImagePaths, getColorSourceImagePaths } from './assets-loader.js'
export { buildBootstrap, buildImageInjectionScript, imageFileToDataUri } from './bootstrap-builder.js'
export { TOKEN_KEYS } from './types.js'
export type { Tokens, TokenKey, RGB, Hex, ColorCluster, BuildOptions } from './types.js'

/**
 * Build design tokens from source images.
 * Generates BOTH light and dark token sets from the same clusters.
 *
 * @param options - Build configuration
 * @returns The generated token pairs { light, dark }
 */
export async function buildTokens(options: BuildOptions): Promise<{ light: Record<string, string>; dark: Record<string, string> }> {
  const { sources, k = 8, outPath } = options

  console.log('🎨 Skin Core: Extracting colors from images...')
  console.log(`   Sources: ${sources.length} images`)
  console.log(`   Clusters: ${k}`)

  // Extract colors from all images
  const clusters = await extractColorsFromImages(sources, k)

  console.log(`   Extracted ${clusters.length} color clusters`)

  // Generate light + dark token pairs
  const { light, dark } = generateTokenPairs(clusters)

  console.log('   Generated tokens (light):')
  for (const [key, value] of Object.entries(light)) {
    console.log(`     ${key}: ${value}`)
  }
  console.log('   Generated tokens (dark):')
  for (const [key, value] of Object.entries(dark)) {
    console.log(`     ${key}: ${value}`)
  }

  // Write to file if outPath specified
  if (outPath) {
    const dir = path.dirname(outPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(outPath, JSON.stringify({ light, dark }, null, 2))
    console.log(`   ✓ Wrote tokens (light+dark) to ${outPath}`)
  }

  return { light, dark }
}

// CLI mode: run only when executed directly (not when imported)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)

  // Parse --sources and --out flags
  let sources: string[] = []
  let outPath = 'dist/tokens.json'
  let k = 16

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--sources' && i + 1 < args.length) {
      sources = args[i + 1].split(',')
      i++
    } else if (args[i] === '--out' && i + 1 < args.length) {
      outPath = args[i + 1]
      i++
    } else if (args[i] === '--k' && i + 1 < args.length) {
      k = parseInt(args[i + 1])
      i++
    }
  }

  // If no --sources provided, load from skin-assets manifest.json colorSource
  // (character art only — scene backgrounds must NOT tint the theme)
  if (sources.length === 0) {
    sources = getColorSourceImagePaths()
    console.log(`   Using manifest colorSource (${sources.length} images)`)
  }

  buildTokens({ sources, k, outPath })
    .then(() => {
      console.log('\n✓ Token generation complete')
      process.exit(0)
    })
    .catch((err) => {
      console.error('\n❌ Token generation failed:', err.message)
      process.exit(1)
    })
}
