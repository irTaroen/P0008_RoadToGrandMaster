export const CATEGORIES = ["Mage", "Fighter", "Marksman", "Tank", "Support"] as const
export type Category = (typeof CATEGORIES)[number]

export type Mastery = 1 | 2 | 3

export const MASTERY_LABEL: Record<Mastery, string> = {
  1: "Learning",
  2: "Good",
  3: "Signature",
}

export type Champion = {
  id: string
  name: string
  category: Category
  mastery: Mastery
  active: boolean
  /** Played in Ranked. Only possible while active. */
  ranked: boolean
  /** File name inside the "champion portraits" folder. */
  portrait: string
}

/** Full class strings per category — never build these at runtime (nimbus-styling.md §17.5). */
export const CATEGORY_TONE: Record<Category, { text: string; fill: string; dot: string }> = {
  Mage:     { text: "text-k-purple-fg", fill: "bg-k-purple-bg", dot: "bg-k-purple-fg" },
  Fighter:  { text: "text-k-red-fg",    fill: "bg-k-red-bg",    dot: "bg-k-red-fg"    },
  Marksman: { text: "text-k-amber-fg",  fill: "bg-k-amber-bg",  dot: "bg-k-amber-fg"  },
  Tank:     { text: "text-k-cyan-fg",   fill: "bg-k-cyan-bg",   dot: "bg-k-cyan-fg"   },
  Support:  { text: "text-k-green-fg",  fill: "bg-k-green-bg",  dot: "bg-k-green-fg"  },
}

/** Ranked first, then the other actives, then inactives — alphabetical within each group. */
export function sortChampions(list: Champion[]) {
  return [...list].sort(
    (a, b) =>
      Number(b.ranked) - Number(a.ranked) ||
      Number(b.active) - Number(a.active) ||
      a.name.localeCompare(b.name, "en", { sensitivity: "base" })
  )
}

export function isCategory(value: unknown): value is Category {
  return CATEGORIES.includes(value as Category)
}

export function isMastery(value: unknown): value is Mastery {
  return value === 1 || value === 2 || value === 3
}

/** Portrait URL; `width` requests a resized WebP (see app/api/portraits/[file]). */
export function portraitUrl(file: string, width?: 160 | 480) {
  const url = `/api/portraits/${encodeURIComponent(file)}`
  return width ? `${url}?w=${width}` : url
}
