import path from "path"
import { NextResponse } from "next/server"

import { type Champion, isCategory, isMastery, parsePortrait } from "@/lib/champions"
import {
  IMAGE_EXT,
  deleteChampion,
  listPortraits,
  portraitKey,
  readChampions,
  updateChampion,
  uploadPortrait,
} from "@/lib/store"

type Ctx = { params: Promise<{ id: string }> }

/**
 * Updates mastery, active, category, name and/or portrait (a skin of the same champion).
 * JSON, or a multipart form with name, category, `file` and `skin` to upload a new skin,
 * saved into the portraits bucket as "<champion>_<skin><ext>" and put on the card.
 */
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params
  const form = req.headers.get("content-type")?.startsWith("multipart/form-data") ? await req.formData() : null
  const body = form ? { name: form.get("name"), category: form.get("category") } : await req.json()
  const list = await readChampions()
  const current = list.find((c) => c.id === id)
  if (!current) return error("Not found", 404)

  const next: Champion = { ...current }
  if (isMastery(body.mastery)) next.mastery = body.mastery
  if (typeof body.active === "boolean") next.active = body.active
  if (typeof body.ranked === "boolean") next.ranked = body.ranked
  // Ranked requires active: turning a champ inactive also takes it out of Ranked
  if (!next.active) next.ranked = false
  if (isCategory(body.category)) next.category = body.category
  if (typeof body.name === "string" && body.name.trim()) next.name = body.name.trim()
  if (typeof body.portrait === "string" && body.portrait !== current.portrait) {
    const sameChampion = parsePortrait(body.portrait).base === parsePortrait(current.portrait).base
    if (!sameChampion || !(await listPortraits()).includes(body.portrait))
      return error("That portrait doesn't exist")
    next.portrait = body.portrait
  }

  const upload = form?.get("file")
  if (upload instanceof File && upload.size > 0) {
    const ext = path.extname(upload.name).toLowerCase()
    if (!IMAGE_EXT.includes(ext)) return error("Portrait must be a jpg, png, webp or avif")
    const { base } = parsePortrait(current.portrait)
    const skin = String(form?.get("skin") ?? "").trim().replace(/[\s_]+/g, "_").replace(/^_|_$/g, "")
    const file = portraitKey(`${base}_${skin}`, ext)
    const label = parsePortrait(file).skin
    if (!label) return error("Give the skin a name")
    // Uploads overwrite by key, so never let a new skin replace one that's already there
    const stem = path.parse(file).name.toLowerCase()
    if ((await listPortraits()).some((p) => path.parse(p).name.toLowerCase() === stem))
      return error(`${base} already has a skin called ${label}`)
    await uploadPortrait(file, upload)
    next.portrait = file
  }

  await updateChampion(next)
  return NextResponse.json(next)
}

/** Removes the card. The portrait file stays in the folder so it can be re-added. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params
  await deleteChampion(id)
  return new NextResponse(null, { status: 204 })
}

function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}
