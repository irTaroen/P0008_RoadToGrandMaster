import { randomUUID } from "crypto"
import { promises as fs } from "fs"
import path from "path"
import { NextResponse } from "next/server"

import { type Champion, isCategory } from "@/lib/champions"
import { IMAGE_EXT, readChampions, resolvePortrait, writeChampions } from "@/lib/store"

export async function GET() {
  return NextResponse.json(await readChampions())
}

/**
 * Adds a champion. Multipart form: name, category, and either
 * `portrait` (an existing file in the portraits folder) or `file` (an upload,
 * saved into the portraits folder as "<name><ext>").
 */
export async function POST(req: Request) {
  const form = await req.formData()
  const name = String(form.get("name") ?? "").trim()
  const category = form.get("category")
  const upload = form.get("file")
  let portrait = String(form.get("portrait") ?? "")

  if (!name) return error("Name is required")
  if (!isCategory(category)) return error("Pick a category")

  const list = await readChampions()
  if (list.some((c) => c.name.toLowerCase() === name.toLowerCase()))
    return error(`${name} is already in your pool`)

  if (upload instanceof File && upload.size > 0) {
    const ext = path.extname(upload.name).toLowerCase()
    if (!IMAGE_EXT.includes(ext)) return error("Portrait must be a jpg, png, webp or avif")
    portrait = `${name.replace(/[\\/:*?"<>|]/g, "")}${ext}`
    const target = resolvePortrait(portrait)
    if (!target) return error("Invalid file name")
    await fs.writeFile(target, Buffer.from(await upload.arrayBuffer()))
  } else {
    const target = portrait && resolvePortrait(portrait)
    if (!target) return error("Pick or upload a portrait")
    try {
      await fs.access(target)
    } catch {
      return error("That portrait doesn't exist")
    }
  }

  const champion: Champion = { id: randomUUID(), name, category, mastery: 1, active: false, ranked: false, portrait }
  await writeChampions([...list, champion])
  return NextResponse.json(champion, { status: 201 })
}

function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}
