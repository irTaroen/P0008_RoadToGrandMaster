import { NextResponse } from "next/server"

import { listPortraits } from "@/lib/store"

export async function GET() {
  return NextResponse.json(await listPortraits())
}
