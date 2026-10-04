import "server-only"
import { promises as fs } from "fs"
import path from "path"

import type { Champion } from "./champions"

const DATA_FILE = path.join(process.cwd(), "data", "champions.json")
export const PORTRAIT_DIR = path.join(process.cwd(), "public", "portraits")
export const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".avif"]

export async function readChampions(): Promise<Champion[]> {
  try {
    const list: Champion[] = JSON.parse(await fs.readFile(DATA_FILE, "utf8"))
    // Older/hand-edited entries may lack `ranked`; ranked is never on for an inactive champ
    return list.map((c) => ({ ...c, ranked: c.active && c.ranked === true }))
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return []
    throw err
  }
}

export async function writeChampions(list: Champion[]) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
  const tmp = `${DATA_FILE}.tmp`
  await fs.writeFile(tmp, JSON.stringify(list, null, 2) + "\n")
  await fs.rename(tmp, DATA_FILE)
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

export async function listPortraits(): Promise<string[]> {
  const files = await fs.readdir(PORTRAIT_DIR)
  return files
    .filter((f) => IMAGE_EXT.includes(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
}

/** Resolves a portrait file name to a path inside PORTRAIT_DIR, or null if it escapes it. */
export function resolvePortrait(file: string) {
  const full = path.resolve(PORTRAIT_DIR, file)
  return path.dirname(full) === PORTRAIT_DIR ? full : null
}
