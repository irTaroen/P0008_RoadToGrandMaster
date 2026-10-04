import { promises as fs } from "fs"
import path from "path"
import sharp from "sharp"

import { resolvePortrait } from "@/lib/store"

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
}

/** Allowed resize widths — keeps the disk cache bounded. */
const WIDTHS = [160, 480]
const CACHE_DIR = path.join(process.cwd(), ".cache", "portraits")

/**
 * Serves a portrait from the "champion portraits" folder.
 * With ?w=<160|480> it returns a resized WebP, cached on disk and keyed on the
 * source's mtime + size so replacing a file busts the cache.
 */
export async function GET(req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  const full = resolvePortrait(decodeURIComponent(file))
  if (!full || !MIME[path.extname(full).toLowerCase()]) return notFound()

  let stat
  try {
    stat = await fs.stat(full)
  } catch {
    return notFound()
  }

  const w = Number(new URL(req.url).searchParams.get("w"))
  const width = WIDTHS.includes(w) ? w : null
  const etag = `"${stat.mtimeMs.toString(36)}-${stat.size.toString(36)}-${width ?? "o"}"`
  const headers = {
    ETag: etag,
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=604800",
  }

  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers })

  if (!width) {
    const data = await fs.readFile(full)
    return new Response(data, { headers: { ...headers, "Content-Type": MIME[path.extname(full).toLowerCase()] } })
  }

  const cached = path.join(CACHE_DIR, `${path.basename(full)}.${etag.replaceAll('"', "")}.webp`)
  let data: Buffer
  try {
    data = await fs.readFile(cached)
  } catch {
    data = await sharp(full).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer()
    await fs.mkdir(CACHE_DIR, { recursive: true })
    await fs.writeFile(cached, data)
  }
  return new Response(new Uint8Array(data), { headers: { ...headers, "Content-Type": "image/webp" } })
}

function notFound() {
  return new Response("Not found", { status: 404 })
}
