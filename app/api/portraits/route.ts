import { NextResponse } from "next/server"

import { deletePortrait, listPortraits, readChampions } from "@/lib/store"

export async function GET() {
  return NextResponse.json(await listPortraits())
}

/** Permanently removes `?file=` from the portraits bucket, unless a card still uses it. */
export async function DELETE(req: Request) {
  const file = new URL(req.url).searchParams.get("file") ?? ""
  if (!(await listPortraits()).includes(file)) return error("That portrait doesn't exist", 404)
  const user = (await readChampions()).find((c) => c.portrait === file)
  if (user) return error(`${user.name}'s card uses this portrait. Pick another one first.`)
  await deletePortrait(file)
  return new NextResponse(null, { status: 204 })
}

function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}
