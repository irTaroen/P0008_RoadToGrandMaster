import "server-only"
import { promises as fs } from "fs"
import path from "path"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import type { Champion } from "./champions"

export const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".avif"]

const TABLE = "champions"
const BUCKET = "portraits"
const COLUMNS = "id, name, category, mastery, active, ranked, portrait"

// Service-role key: bypasses RLS, so this module must stay server-only
let client: SupabaseClient | undefined
function supabase() {
  if (!client) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    client = createClient(url, key, { auth: { persistSession: false } })
  }
  return client
}

const db = () => supabase().from(TABLE)
const bucket = () => supabase().storage.from(BUCKET)

function check<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(`Supabase: ${error.message}`)
  return data
}

export async function readChampions(): Promise<Champion[]> {
  return check(await db().select(COLUMNS).order("name")) as Champion[]
}

export async function insertChampion(champion: Champion) {
  check(await db().insert(champion))
}

export async function updateChampion(champion: Champion) {
  const { id, ...fields } = champion
  check(await db().update(fields).eq("id", id))
}

export async function deleteChampion(id: string) {
  check(await db().delete().eq("id", id))
}

const SETTINGS_FILE = path.join(process.cwd(), "data", "settings.json")

export type Settings = {
  /** Where to find new portraits — linked from the Add champion screen. */
  portraitSourceUrl?: string
}

export async function readSettings(): Promise<Settings> {
  try {
    return JSON.parse(await fs.readFile(SETTINGS_FILE, "utf8"))
  } catch {
    return {}
  }
}

/** File names in the Supabase "portraits" bucket. */
export async function listPortraits(): Promise<string[]> {
  const files = check(await bucket().list("", { limit: 1000 })) ?? []
  return files
    .map((f) => f.name)
    .filter((f) => IMAGE_EXT.includes(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
}

/**
 * Storage key for a champion's portrait. Supabase only accepts ASCII keys from a fixed set,
 * so curly apostrophes become straight ones (Kha’Zix → Kha'Zix) and anything else is dropped.
 */
export function portraitKey(name: string, ext: string) {
  return name.replace(/[’‘]/g, "'").replace(/[^\w!\-.*'() &$@=;:+,?]/g, "") + ext
}

export async function uploadPortrait(file: string, upload: File) {
  check(await bucket().upload(file, upload, { contentType: upload.type, upsert: true }))
}
