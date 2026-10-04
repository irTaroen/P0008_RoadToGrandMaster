import { ChampionPool } from "@/components/champion-pool"
import { readChampions, readSettings } from "@/lib/store"

// Reads data/champions.json on every request — no client-side fetch or spinner
export const dynamic = "force-dynamic"

export default async function Home() {
  const [champions, settings] = await Promise.all([readChampions(), readSettings()])
  return <ChampionPool initial={champions} portraitSourceUrl={settings.portraitSourceUrl} />
}
