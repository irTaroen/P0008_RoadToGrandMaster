// Makes a web-sized JPG in public/portraits for every image in "original portraits".
//
//   npm run update-portraits                 only new or changed originals
//   npm run update-portraits -- --force      redo all of them
//   npm run update-portraits -- --dry-run    show what would happen, write nothing
//   npm run update-portraits -- --out <dir>  write somewhere other than public/portraits

import { mkdir, readdir, stat } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import sharp from "sharp"

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const SRC_DIR = path.join(ROOT, "original portraits")

const MAX_WIDTH = 960
const JPEG = { quality: 82, progressive: true, mozjpeg: true }
const IMAGE = /\.(png|jpe?g|webp|avif|tiff?)$/i

const args = process.argv.slice(2)
const force = args.includes("--force")
const dryRun = args.includes("--dry-run")
const outFlag = args.indexOf("--out")
const OUT_DIR = outFlag >= 0 ? path.resolve(args[outFlag + 1] ?? "") : path.join(ROOT, "public", "portraits")

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`
const mtime = (file) => stat(file).then((s) => s.mtimeMs, () => 0)

// Several originals can share a name ("Mel.png" + "Mel.jpg") and would land on the same
// output file — keep the PNG, else the one with the most pixels.
async function pickSources() {
  const byStem = new Map()
  for (const file of (await readdir(SRC_DIR)).sort()) {
    if (file.startsWith(".") || !IMAGE.test(file)) continue
    const { width, height } = await sharp(path.join(SRC_DIR, file)).metadata()
    const key = path.parse(file).name.toLowerCase()
    const entry = { file, png: /\.png$/i.test(file), pixels: width * height }
    byStem.set(key, [...(byStem.get(key) ?? []), entry])
  }

  const picked = []
  for (const group of byStem.values()) {
    group.sort((a, b) => Number(b.png) - Number(a.png) || b.pixels - a.pixels)
    picked.push(group[0].file)
    for (const other of group.slice(1)) console.log(`  dupe   ${other.file} (using ${group[0].file})`)
  }
  return picked.sort()
}

const sources = await pickSources()
if (!dryRun) await mkdir(OUT_DIR, { recursive: true })

let written = 0
let skipped = 0
for (const file of sources) {
  const src = path.join(SRC_DIR, file)
  const outName = `${path.parse(file).name}.jpg`
  const out = path.join(OUT_DIR, outName)

  if (!force && (await mtime(out)) >= (await mtime(src))) {
    skipped++
    continue
  }

  const before = (await stat(src)).size
  if (dryRun) {
    console.log(`  would  ${file} → ${outName}`)
  } else {
    const info = await sharp(src)
      .rotate() // apply EXIF orientation
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .flatten({ background: "#000" })
      .jpeg(JPEG)
      .toFile(out)
    console.log(`  wrote  ${outName}  ${info.width}×${info.height}  ${kb(before)} → ${kb(info.size)}`)
  }
  written++
}

console.log(`${dryRun ? "Would write" : "Wrote"} ${written}, ${skipped} already up to date → ${path.relative(ROOT, OUT_DIR) || OUT_DIR}`)
