// src/patch-asar.ts
// Cross-platform asar patcher for the opencode desktop app.
// Combines the functionality of patch-desktop.ps1 and maid-atelier.patch.mjs.
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { execSync, spawn } from 'node:child_process'
import asar from '@electron/asar'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = __dirname
const ROOT = path.resolve(__dirname, '..')

const MARKER = 'oc-maid-atelier'
const PRELOAD_ENTRY = path.join('out', 'renderer', 'oc-theme-preload.js')
const FAVICON_ENTRY = path.join('out', 'renderer', 'favicon-v3.svg')

// Cross-platform default app paths
const DEFAULT_APP_DIRS: Record<string, string> = {
  win32: 'C:\\Users\\xrl\\AppData\\Local\\Programs\\@opencode-aidesktop',
  darwin: '/Applications/OpenCode.app',
  linux: '/opt/OpenCode',
}

// Cross-platform executable paths
const APP_EXECUTABLES: Record<string, string> = {
  win32: 'OpenCode.exe',
  darwin: 'Contents/MacOS/OpenCode',
  linux: 'opencode-desktop',
}

interface PatchOptions {
  appDir?: string
  allowRunning?: boolean
  force?: boolean
  noBackup?: boolean
  backupPath?: boolean
  autoRestart?: boolean
}

function log(msg: string): void {
  console.log('[patch] ' + msg)
}

function fail(msg: string): never {
  console.error('[patch] ERROR: ' + msg)
  process.exit(1)
}

// Stream search for marker in binary file (handles boundary cases)
function hasMarker(filePath: string): boolean {
  const marker = Buffer.from(MARKER, 'utf8')
  const fd = fs.openSync(filePath, 'r')
  try {
    const buf = Buffer.alloc(4 * 1024 * 1024)
    const carry = Buffer.alloc(marker.length - 1)
    let carryLen = 0
    const first = marker[0]
    let bytesRead: number
    while ((bytesRead = fs.readSync(fd, buf, 0, buf.length, null)) > 0) {
      const n = bytesRead + carryLen
      const span = Buffer.alloc(n)
      carry.copy(span, 0, 0, carryLen)
      buf.copy(span, carryLen, 0, bytesRead)
      for (let i = 0; i <= n - marker.length; i++) {
        if (span[i] !== first) continue
        let ok = true
        for (let j = 1; j < marker.length; j++) {
          if (span[i + j] !== marker[j]) {
            ok = false
            break
          }
        }
        if (ok) return true
      }
      const tailLen = marker.length - 1
      if (n >= tailLen) {
        span.copy(carry, 0, n - tailLen, n)
        carryLen = tailLen
      } else {
        span.copy(carry, 0, 0, n)
        carryLen = n
      }
    }
    return false
  } finally {
    fs.closeSync(fd)
  }
}

// Check if OpenCode process is running (cross-platform)
function isOpenCodeRunning(): boolean {
  try {
    const platform = os.platform()
    if (platform === 'win32') {
      const result = execSync('tasklist /FI "IMAGENAME eq OpenCode.exe"', { encoding: 'utf8' })
      return result.includes('OpenCode.exe')
    } else {
      // Unix-like: check for process by name
      try {
        execSync('pgrep -f OpenCode', { encoding: 'utf8', stdio: 'pipe' })
        return true
      } catch {
        return false
      }
    }
  } catch {
    return false
  }
}

// Kill all OpenCode processes (cross-platform)
function killOpenCode(): void {
  log('Killing OpenCode processes...')
  try {
    const platform = os.platform()
    if (platform === 'win32') {
      execSync('taskkill /F /IM OpenCode.exe', { stdio: 'pipe' })
    } else {
      execSync('pkill -f OpenCode', { stdio: 'pipe' })
    }
    // Wait a bit for processes to fully exit
    const start = Date.now()
    while (isOpenCodeRunning() && Date.now() - start < 5000) {
      execSync('sleep 0.1', { stdio: 'pipe' })
    }
    log('OpenCode processes terminated')
  } catch {
    log('No OpenCode processes to kill (or kill failed)')
  }
}

// Launch OpenCode (cross-platform)
function launchOpenCode(appDir: string): void {
  const platform = os.platform()
  const exeRelative = APP_EXECUTABLES[platform]
  if (!exeRelative) {
    fail(`unsupported platform: ${platform}`)
  }

  const exePath = path.join(appDir, exeRelative)
  log(`Launching OpenCode from ${exePath}`)

  try {
    if (platform === 'win32') {
      // Windows: use spawn with detached to not block
      spawn(exePath, [], { detached: true, stdio: 'ignore' }).unref()
    } else if (platform === 'darwin') {
      // macOS: use open command
      spawn('open', ['-a', appDir], { detached: true, stdio: 'ignore' }).unref()
    } else {
      // Linux: spawn directly
      spawn(exePath, [], { detached: true, stdio: 'ignore' }).unref()
    }
    log('OpenCode launched')
  } catch (err) {
    log(`Warning: Failed to launch OpenCode: ${err}`)
  }
}

export async function patchAsar(options: PatchOptions = {}): Promise<void> {
  const platform = os.platform()
  const defaultAppDir = DEFAULT_APP_DIRS[platform]
  if (!defaultAppDir) {
    fail(`unsupported platform: ${platform}`)
  }

  const appDir = options.appDir || defaultAppDir
  // macOS: resources live inside Contents/Resources/, not directly under the .app bundle
  const resourcesDir = platform === 'darwin'
    ? path.join(appDir, 'Contents', 'Resources')
    : path.join(appDir, 'resources')
  const asarPath = path.join(resourcesDir, 'app.asar')
  const backupPath = options.backupPath || `${asarPath}.maid-atelier.bak`
  const force = options.force ?? false
  const noBackup = options.noBackup ?? false
  const allowRunning = options.allowRunning ?? false
  const autoRestart = options.autoRestart ?? true

  // Check prerequisites
  if (!fs.existsSync(asarPath)) fail(`app.asar not found: ${asarPath}`)

  if (hasMarker(asarPath) && !force) {
    fail('app.asar already patched - use force:true to re-patch, or restore the .bak')
  }

  // Kill OpenCode if running
  if (isOpenCodeRunning()) {
    if (allowRunning) {
      log('OpenCode is running, but allowRunning is set - proceeding anyway')
    } else {
      killOpenCode()
    }
  }

  // Backup
  if (!noBackup) {
    if (fs.existsSync(backupPath)) {
      log(`backup already exists: ${backupPath} (leaving it untouched)`)
    } else {
      fs.copyFileSync(asarPath, backupPath)
      log(`backup: ${backupPath}`)
    }
  } else {
    log('--noBackup: skipping backup; .bak still used as pristine source for --force')
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(asarPath, backupPath)
      log(`pristine snapshot for --force: ${backupPath}`)
    }
  }

  // Read static CSS file
  const cssPath = path.join(SRC, 'maid-atelier.css')
  if (!fs.existsSync(cssPath)) {
    throw new Error(`maid-atelier.css not found in src/`)
  }
  const css = fs.readFileSync(cssPath, 'utf8')

  // Image files to copy into renderer
  const ART_FILES = [
    'maid-atelier-palace-day-v4.webp',
    'maid-atelier-palace-night-v4.webp',
    'maid-atelier-maid-left-v5.webp',
    'maid-atelier-maid-right-v6.webp',
  ]

  // Create temp work dir
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'opencode-maid-patch-'))
  log(`patch work dir: ${workDir}`)

  const outDir = path.join(workDir, 'out')
  const outAsar = path.join(workDir, 'out.asar')

  try {
    // Extract
    log(`extracting ${asarPath}`)
    await asar.extractAll(asarPath, outDir)

    const preloadPath = path.join(outDir, PRELOAD_ENTRY)
    let preload = fs.readFileSync(preloadPath, 'utf8')

    // Restore pristine preload if --force
    if (force) {
      const pristinePreload = asar.extractFile(backupPath, PRELOAD_ENTRY).toString('utf8')
      if (pristinePreload.includes(MARKER)) {
        throw new Error('pristine backup is NOT pristine (contains the marker)')
      }
      fs.writeFileSync(preloadPath, pristinePreload, 'utf8')
      preload = pristinePreload
      log(`restored pristine oc-theme-preload.js from ${backupPath}`)
    }

    // Pristine check
    if (preload.includes(MARKER) && !force) {
      throw new Error('oc-theme-preload.js already patched; use force:true to re-patch')
    }
    if (!preload.includes('opencode-theme-id')) {
      throw new Error('unexpected oc-theme-preload.js content; refusing to patch')
    }

    // Write CSS file to renderer root (loaded via <link>)
    // Note: asar internal structure is out/renderer/..., so extracted paths are outDir/out/renderer/
    const rendererDir = path.join(outDir, 'out', 'renderer')
    fs.mkdirSync(rendererDir, { recursive: true })
    const cssTarget = path.join(rendererDir, 'maid-atelier.css')
    fs.writeFileSync(cssTarget, css, 'utf8')
    log(`wrote ${cssTarget} (${css.length} bytes)`)

    // Copy image assets to out/renderer/images/
    const imagesDir = path.join(rendererDir, 'images')
    fs.mkdirSync(imagesDir, { recursive: true })
    const publicDir = path.join(ROOT, 'public')
    for (const file of ART_FILES) {
      const src = path.join(publicDir, file)
      if (!fs.existsSync(src)) throw new Error(`missing asset: ${src}`)
      fs.copyFileSync(src, path.join(imagesDir, file))
    }
    log(`copied ${ART_FILES.length} images to ${imagesDir}`)

    // Read inject.js (no longer needs placeholder replacement)
    const injectJsPath = path.join(SRC, 'maid-atelier.inject.js')
    if (!fs.existsSync(injectJsPath)) throw new Error(`missing ${injectJsPath}`)
    const injectJs = fs.readFileSync(injectJsPath, 'utf8')

    // Build bootstrap — CSS loaded via <link>, no inline base64
    const bootstrap =
      preload +
      '\n\n;(function () {\n' +
      '  document.documentElement.dataset.maidSkin = "deep-sea-maid-atelier"\n' +
      '  var link = document.createElement("link")\n' +
      '  link.rel = "stylesheet"\n' +
      '  link.id = "oc-maid-atelier"\n' +
      '  link.href = "oc://renderer/maid-atelier.css"\n' +
      '  document.head.appendChild(link)\n' +
      '})()\n\n' +
      injectJs

    log(`bootstrap length: ${bootstrap.length}`)
    fs.writeFileSync(preloadPath, bootstrap, 'utf8')

    // Replace favicon
    const faviconSrc = path.join(SRC, 'maid-icon.svg')
    if (fs.existsSync(faviconSrc)) {
      const faviconTarget = path.join(outDir, FAVICON_ENTRY)
      const favicon = fs.readFileSync(faviconSrc, 'utf8')
      if (!favicon.includes('<svg')) throw new Error('favicon svg invalid')
      fs.writeFileSync(faviconTarget, favicon, 'utf8')
      log('replaced favicon-v3.svg')
    }

    // Repack
    log(`repacking to ${outAsar}`)
    await asar.createPackage(outDir, outAsar)

    // Verify
    const check = asar.extractFile(outAsar, PRELOAD_ENTRY).toString('utf8')
    if (!check.includes(MARKER) || !check.includes('oc-maid-atelier')) {
      throw new Error('repacked asar missing marker')
    }
    const size = fs.statSync(outAsar).size
    log(`verified marker in repacked asar (${size} bytes)`)

    // Install
    fs.unlinkSync(asarPath)
    fs.renameSync(outAsar, asarPath)
    log(`installed patched app.asar (${size} bytes)`)

    console.log('')
    console.log('✓ Patch complete!')

    // Auto-restart OpenCode
    if (autoRestart && !allowRunning) {
      launchOpenCode(appDir)
      console.log('✓ OpenCode restarted with the deep-sea maid atelier skin active.')
    } else {
      console.log('Done. Launch OpenCode manually to see the deep-sea maid atelier skin.')
    }

    console.log('')
    console.log('To revert: close the app, then run:')
    console.log(`  cp '${backupPath}' '${asarPath}'`)
  } finally {
    // Cleanup work dir
    try {
      fs.rmSync(workDir, { recursive: true, force: true })
    } catch {}
  }
}

// Allow direct invocation: tsx src/patch-asar.ts
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  patchAsar({ force: true, autoRestart: true }).catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
