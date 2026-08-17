// src/build-css.ts
// Generates build/maid-atelier.user.css:
//   - embeds public/*.webp as data URIs (--maid-* CSS variables)
//   - emits light/dark palette overrides from maid-atelier.desktop.json
//   - appends the static CSS rules (palace backdrop, character art, docks, etc.)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SRC = __dirname
const PUBLIC = path.join(ROOT, 'public')
const BUILD = path.join(SRC, 'build')

interface ThemeJson {
  light: { overrides: Record<string, string>; v2Overrides: Record<string, string> }
  dark: { overrides: Record<string, string>; v2Overrides: Record<string, string> }
}

const ART: { name: string; file: string }[] = [
  { name: 'palace-day', file: 'maid-atelier-palace-day-v4.webp' },
  { name: 'palace-night', file: 'maid-atelier-palace-night-v4.webp' },
  { name: 'maid-left', file: 'maid-atelier-maid-left-v5.webp' },
  { name: 'maid-right', file: 'maid-atelier-maid-right-v6.webp' },
]

const RULES = `/* Palace backdrop: applied to the main content card via ::before. */
html[data-maid-skin][data-color-scheme="light"] [class*="bg-v2-background-bg-base"][class*="rounded-"]:not([data-component])::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: var(--maid-palace-day) center/cover no-repeat;
  opacity: 0.24;
  border-radius: inherit;
}
html[data-maid-skin][data-color-scheme="dark"] [class*="bg-v2-background-bg-base"][class*="rounded-"]:not([data-component])::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: var(--maid-palace-night) center/cover no-repeat;
  opacity: 0.24;
  border-radius: inherit;
}

/* Character art on the main content card (bottom corners, offset inward) — uses ::after so it sits above ::before palace backdrop. */
html[data-maid-skin] [class*="bg-v2-background-bg-base"][class*="rounded-"]:not([data-component])::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background-image: var(--maid-maid-left), var(--maid-maid-right);
  background-position: 10px calc(100% - 10px), calc(100% - 10px) calc(100% - 10px);
  background-size: auto 86%, auto 78%;
  background-repeat: no-repeat;
  border-radius: inherit;
}

/* Ensure card content sits above both ::before (palace) and ::after (characters). */
html[data-maid-skin] [class*="bg-v2-background-bg-base"][class*="rounded-"]:not([data-component]) > * {
  position: relative;
  z-index: 2;
}

/* New session screen: palace backdrop via ::before. */
html[data-maid-skin][data-color-scheme="light"] [data-component="session-new-design"]::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: var(--maid-palace-day) center/cover no-repeat;
  opacity: 0.24;
  border-radius: inherit;
}
html[data-maid-skin][data-color-scheme="dark"] [data-component="session-new-design"]::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: var(--maid-palace-night) center/cover no-repeat;
  opacity: 0.24;
  border-radius: inherit;
}

/* New session screen: character art on bottom corners — uses ::after so it sits above ::before palace backdrop. */
html[data-maid-skin] [data-component="session-new-design"]::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background-image: var(--maid-maid-left), var(--maid-maid-right);
  background-position: 10px calc(100% - 10px), calc(100% - 10px) calc(100% - 10px);
  background-size: auto 86%, auto 78%;
  background-repeat: no-repeat;
  border-radius: inherit;
}

/* New session screen: ensure children sit above both ::before (palace) and ::after (characters). */
html[data-maid-skin] [data-component="session-new-design"] > * {
  position: relative;
  z-index: 2;
}

/* Make the prompt dock transparent so character art shows through at the bottom. */
html[data-maid-skin] [data-component="session-prompt-dock"] {
  background: transparent !important;
}

html[data-maid-skin] #root {
  position: relative;
  z-index: 1;
}

/* Let the palace show through the chat pane and sidebar surfaces. */
html[data-maid-skin] main,
html[data-maid-skin] [data-component="sidebar-nav-desktop"],
html[data-maid-skin] [data-component="sidebar-nav-mobile"] {
  background: transparent;
}
html[data-maid-skin] [data-component="sidebar-rail"] {
  background: color-mix(in srgb, var(--background-base) 82%, transparent);
}

/* Settings / dialogs */
html[data-maid-skin] [data-component="dialog-v2"] [data-slot="dialog-container"] {
  background: color-mix(in srgb, var(--surface-raised-base) 88%, transparent);
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--border-weak-base) 45%, transparent);
  box-shadow: 0 18px 48px rgba(5, 13, 38, 0.35);
}
`

export function buildCss(): string {
  if (!fs.existsSync(PUBLIC)) throw new Error(`assets dir not found: ${PUBLIC}`)
  const themePath = path.join(SRC, 'maid-atelier.desktop.json')
  if (!fs.existsSync(themePath)) throw new Error(`theme json not found: ${themePath}`)

  const theme: ThemeJson = JSON.parse(fs.readFileSync(themePath, 'utf8'))

  const lines: string[] = []
  lines.push('/*')
  lines.push(' * maid-atelier.user.css - generated by build-css.ts')
  lines.push(' * Deep-sea maid atelier skin layer for the opencode desktop app.')
  lines.push(' * Presentation-only. Scoped under html[data-maid-skin];')
  lines.push(' * never touches DSH services, events, or model requests.')
  lines.push(' */')
  lines.push('')

  for (const a of ART) {
    const p = path.join(PUBLIC, a.file)
    if (!fs.existsSync(p)) throw new Error(`missing asset: ${p}`)
    const b64 = fs.readFileSync(p).toString('base64')
    lines.push(`html[data-maid-skin] { --maid-${a.name}: url(data:image/webp;base64,${b64}); }`)
  }
  lines.push('')

  for (const mode of ['light', 'dark'] as const) {
    const block = theme[mode]
    lines.push(`html[data-maid-skin][data-color-scheme="${mode}"] {`)
    for (const [k, v] of Object.entries(block.overrides)) lines.push(`  --${k}: ${v};`)
    lines.push('}')
    lines.push(`html[data-maid-skin][data-color-scheme="${mode}"] {`)
    for (const [k, v] of Object.entries(block.v2Overrides)) lines.push(`  --${k}: ${v};`)
    lines.push('}')
    lines.push('')
  }

  lines.push(RULES)
  return lines.join('\n')
}

export function buildCssToFile(): string {
  const css = buildCss()
  fs.mkdirSync(BUILD, { recursive: true })
  const out = path.join(BUILD, 'maid-atelier.user.css')
  fs.writeFileSync(out, css, 'utf8')
  console.log(`[build-css] wrote ${out} (${css.length} bytes)`)
  return out
}

// Allow direct invocation: tsx src/build-css.ts
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  buildCssToFile()
}
