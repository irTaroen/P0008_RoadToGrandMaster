import { NextResponse } from "next/server"

import { type Champion, isCategory, isMastery } from "@/lib/champions"
import { deleteChampion, readChampions, updateChampion } from "@/lib/store"

type Ctx = { params: Promise<{ id: string }> }

/** Updates mastery, active, category and/or name. */
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params
  const body = await req.json()
  const list = await readChampions()
  const current = list.find((c) => c.id === id)
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const next: Champion = { ...current }
  if (isMastery(body.mastery)) next.mastery = body.mastery
  if (typeof body.active === "boolean") next.active = body.active
  if (typeof body.ranked === "boolean") next.ranked = body.ranked
  // Ranked requires active: turning a champ inactive also takes it out of Ranked
  if (!next.active) next.ranked = false
  if (isCategory(body.category)) next.category = body.category
  if (typeof body.name === "string" && body.name.trim()) next.name = body.name.trim()

  await updateChampion(next)
  return NextResponse.json(next)
}

/** Removes the card. The portrait file stays in the folder so it can be re-added. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params
  await deleteChampion(id)
  return new NextResponse(null, { status: 204 })
}
