"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Crown, Loader2, Plus, Search, X } from "lucide-react"

import { ChampionCard } from "./champion-card"
import { ChampionForm } from "./champion-form"
import { Modal } from "./modal"
import { ThemeToggle } from "./theme-toggle"
import { CATEGORIES, CATEGORY_TONE, type Category, type Champion, sortChampions } from "@/lib/champions"
import { cn } from "@/lib/utils"

type Filter = "All" | Category

/** Lowercase, letters/digits only — so "kaisa" finds Kai'Sa and "missf" finds Miss Fortune. */
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")

export function ChampionPool({
  initial,
  portraitSourceUrl,
}: {
  initial: Champion[]
  portraitSourceUrl?: string
}) {
  const [champions, setChampions] = useState<Champion[] | null>(initial)
  const [loadError, setLoadError] = useState(false)
  const [filter, setFilter] = useState<Filter>("All")
  const [form, setForm] = useState<{ champion?: Champion } | null>(null)
  const [removing, setRemoving] = useState<Champion | null>(null)
  const [query, setQuery] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)

  // "/" focuses search from anywhere (unless already typing somewhere)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key !== "/" || t.closest("input, textarea, [role=dialog]")) return
      e.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // New filter or search → start at the top of the list
  useEffect(() => {
    const main = scrollRef.current
    if (!main) return
    main.scrollTo({ top: 0 })
    // Compact screens scroll the page: bring the first card back up under the sticky toolbar
    const below = toolbarRef.current?.offsetHeight ?? 0
    const top = main.getBoundingClientRect().top
    if (top < below) window.scrollBy({ top: top - below })
  }, [filter, query])

  const reload = useCallback(() => {
    fetch("/api/champions")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setChampions)
      .catch(() => setLoadError(true))
  }, [])


  const list = champions ?? []
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { All: list.length, Mage: 0, Fighter: 0, Marksman: 0, Tank: 0, Support: 0 }
    list.forEach((ch) => c[ch.category]++)
    return c
  }, [list])

  const visible = useMemo(() => {
    const q = normalize(query)
    return sortChampions(
      list.filter((c) => (filter === "All" || c.category === filter) && (!q || normalize(c.name).includes(q)))
    )
  }, [list, filter, query])
  // Ranked → Currently playing → Pool; `visible` is already alphabetical within each
  const sections = [
    { label: "Ranked", cards: visible.filter((c) => c.ranked) },
    { label: "Currently playing", cards: visible.filter((c) => c.active && !c.ranked) },
    { label: "Pool", cards: visible.filter((c) => !c.active) },
  ].filter((sec) => sec.cards.length > 0)
  const activeTotal = list.filter((c) => c.active).length
  const rankedTotal = list.filter((c) => c.ranked).length

  // Optimistic update; resync from disk if the server refuses
  const update = useCallback(async (id: string, patch: Partial<Champion>) => {
    setChampions((prev) => prev?.map((c) => (c.id === id ? { ...c, ...patch } : c)) ?? prev)
    const res = await fetch(`/api/champions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => null)
    if (!res?.ok) reload()
  }, [reload])

  async function confirmRemove() {
    if (!removing) return
    const id = removing.id
    setRemoving(null)
    setChampions((prev) => prev?.filter((c) => c.id !== id) ?? prev)
    const res = await fetch(`/api/champions/${id}`, { method: "DELETE" }).catch(() => null)
    if (!res?.ok) reload()
  }

  function onSaved(saved: Champion) {
    setChampions((prev) => {
      const rest = (prev ?? []).filter((c) => c.id !== saved.id)
      return [...rest, saved]
    })
    setForm(null)
  }

  const renderGrid = (cards: Champion[], offset = 0) => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-6 compact:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] compact:gap-3">
      {cards.map((c, i) => (
        <ChampionCard
          key={c.id}
          champion={c}
          index={offset + i}
          onChange={(patch) => update(c.id, patch)}
          onEdit={() => setForm({ champion: c })}
          onRemove={() => setRemoving(c)}
        />
      ))}
    </div>
  )

  return (
    // Compact: the page scrolls (header scrolls away, toolbar sticks) so mobile browsers can
    // collapse their address bar and pull-to-refresh works. Desktop: only <main> scrolls.
    <div className="flex h-svh flex-col overflow-hidden compact:h-auto compact:min-h-svh compact:overflow-visible">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-6 px-4 py-4 sm:px-9 compact:gap-x-3 compact:gap-y-2 compact:px-safe compact:pt-[max(0.75rem,env(safe-area-inset-top))] compact:pb-2">
        <div className="flex min-w-0 items-center gap-5 compact:gap-3">
          <div className="flex size-[52px] shrink-0 items-center justify-center rounded-lg bg-k-bg text-k-cloud-deep shadow-raised compact:size-10 compact:rounded-md compact:shadow-raised-sm">
            <Crown size={24} className="animate-[drift_6s_ease-in-out_infinite] compact:size-5" />
          </div>
          <div className="min-w-0">
            <div className="mb-1 text-[10px] font-medium tracking-[0.6px] text-k-text-tertiary uppercase compact:hidden">
              Nimbus · Champion pool
            </div>
            <h1 className="text-xl leading-[1.2] font-semibold tracking-[-0.4px] text-k-text-primary compact:text-base">
              Road to <span className="text-k-cloud-deep italic">Grandmaster</span>
            </h1>
          </div>
        </div>

        {/* Status pill — always visible, only its content changes */}
        <div className="order-last flex min-w-0 basis-full items-center gap-[7px] rounded-md bg-k-bg px-4 py-2 text-xs text-k-text-secondary shadow-inset-sm md:order-none md:basis-auto md:flex-1 compact:py-1.5">
          {filter === "All" && !query.trim() ? (
            <span className="size-[7px] shrink-0 rounded-full bg-k-green-fg shadow-[0_0_6px_var(--k-green-fg)]" />
          ) : (
            <span className="size-[7px] shrink-0 rounded-full bg-k-cloud-deep shadow-[0_0_6px_var(--k-cloud-mid)]" />
          )}
          <b className="font-medium text-k-text-primary tabular-nums">{list.length}</b> champions
          <span className="text-k-text-tertiary">·</span>
          <b className="font-medium text-k-text-primary tabular-nums">{activeTotal}</b> active
          <span className="text-k-text-tertiary">·</span>
          <b className="font-medium text-k-text-primary tabular-nums">{rankedTotal}</b> ranked
          {/* The recap repeats what the chips and search box already show — no room for it on a phone */}
          {(filter !== "All" || query.trim()) && (
            <>
              <span className="text-k-text-tertiary compact:hidden">·</span>
              <span className="truncate compact:hidden">
                Showing <b className="font-medium text-k-text-primary tabular-nums">{visible.length}</b>
                {filter !== "All" && (
                  <>
                    {" "}
                    in <b className="font-medium text-k-text-primary">{filter}</b>
                  </>
                )}
                {query.trim() && (
                  <>
                    {" "}
                    matching <b className="font-medium text-k-text-primary">“{query.trim()}”</b>
                  </>
                )}
              </span>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 compact:gap-2">
          <button
            type="button"
            onClick={() => setForm({})}
            data-active={!!form && !form.champion}
            className="neu-button inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-k-cloud-mid pointer-coarse:min-h-11 compact:size-11 compact:justify-center compact:p-0"
          >
            <Plus size={14} className="compact:size-[18px]" /> <span className="compact:sr-only">Add champion</span>
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Search + category tabs — stay put while the cards scroll */}
      <div
        ref={toolbarRef}
        // The ::after fades cards out under the stuck toolbar, like the mask does on desktop
        className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-3 px-4 pt-2 pb-3 sm:px-9 compact:sticky compact:top-0 compact:z-20 compact:gap-y-1 compact:bg-k-bg compact:px-safe compact:pb-1 compact:after:pointer-events-none compact:after:absolute compact:after:inset-x-0 compact:after:top-full compact:after:h-4 compact:after:bg-linear-to-b compact:after:from-k-bg compact:after:to-transparent"
      >
        <div className="group relative w-full sm:w-[240px]">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-k-text-tertiary transition-colors group-focus-within:text-k-cloud-deep"
          />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQuery("")}
            placeholder="Search champions"
            aria-label="Search champions"
            enterKeyHint="search"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            // 16px on touch: iOS zooms into anything smaller on focus
            className="neu-input w-full rounded-full py-2 pr-9 pl-9 text-[13px] pointer-coarse:py-2.5 pointer-coarse:pr-11 pointer-coarse:text-base [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("")
                searchRef.current?.focus()
              }}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-k-text-tertiary transition-[box-shadow,color] duration-150 hover:text-k-red-fg hover:shadow-inset-sm pointer-coarse:right-0.5 pointer-coarse:size-10"
            >
              <X size={12} />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-sm px-1.5 text-[10px] font-medium text-k-text-tertiary shadow-raised-xs pointer-coarse:hidden">
              /
            </kbd>
          )}
        </div>

        {/* Compact: one swipeable row running to the screen edge instead of three wrapped ones;
            the padding keeps the chip shadows unclipped */}
        <nav
          aria-label="Filter by category"
          className="flex flex-wrap gap-3 compact:-mx-4 compact:w-[calc(100%+2rem)] compact:flex-nowrap compact:gap-2 compact:overflow-x-auto compact:px-4 compact:py-2 compact:[scrollbar-width:none]"
        >
          {(["All", ...CATEGORIES] as Filter[]).map((f) => {
            const on = filter === f
            return (
              <button
                key={f}
                type="button"
                aria-pressed={on}
                data-active={on}
                onClick={() => setFilter(f)}
                className="neu-button inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-k-cloud-mid pointer-coarse:min-h-11"
              >
                {f !== "All" && <span className={cn("size-[7px] rounded-full", CATEGORY_TONE[f].dot)} />}
                {f}
                <span className="text-[11px] text-k-text-tertiary tabular-nums">{counts[f]}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Only the cards scroll. Top padding leaves room for the cards' raised shadow;
          the mask softens the edge so cards fade out under the filter bar. */}
      <main
        ref={scrollRef}
        className="min-h-0 flex-1 [scrollbar-gutter:stable] overflow-y-auto px-4 pt-6 pb-12 [mask-image:linear-gradient(to_bottom,transparent,black_24px)] sm:px-9 compact:overflow-visible compact:px-safe compact:pt-4 compact:pb-[calc(3rem+env(safe-area-inset-bottom))] compact:[mask-image:none]"
      >
        {loadError ? (
          <div className="flex w-full max-w-md items-center gap-2 rounded-full bg-k-red-bg px-3.5 py-2 text-xs text-k-red-fg shadow-inset-sm">
            <span className="size-[5px] shrink-0 rounded-full bg-k-red-fg" />
            Couldn&apos;t load your champions. Is the dev server running?
          </div>
        ) : champions === null ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-k-text-tertiary" />
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl bg-k-bg p-8 text-center shadow-inset-sm">
            <p className="text-sm text-k-text-secondary">
              {query.trim()
                ? `No champions match “${query.trim()}”${filter !== "All" ? ` in ${filter}` : ""}.`
                : filter === "All"
                  ? "Your pool is empty."
                  : `No ${filter} champions in your pool yet.`}
            </p>
            <button type="button" onClick={() => setForm({})} className="neu-action-secondary mt-4">
              <Plus size={14} /> Add champion
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {sections.map((sec, i) => (
              <section key={sec.label}>
                {/* A lone Pool needs no heading */}
                {!(sections.length === 1 && sec.label === "Pool") && (
                  <SectionLabel label={sec.label} count={sec.cards.length} />
                )}
                {renderGrid(
                  sec.cards,
                  sections.slice(0, i).reduce((n, prev) => n + prev.cards.length, 0)
                )}
              </section>
            ))}
          </div>
        )}
      </main>

      {form && (
        <ChampionForm
          champion={form.champion}
          existing={list}
          portraitSourceUrl={portraitSourceUrl}
          onClose={() => setForm(null)}
          onSaved={onSaved}
        />
      )}

      {removing && (
        <Modal
          eyebrow="Remove champion"
          title={`Remove ${removing.name}?`}
          subtitle="The card and its mastery are removed. The portrait stays in your folder."
          onClose={() => setRemoving(null)}
          footer={
            <>
              <span />
              <div className="flex items-center gap-2.5 compact:grid compact:grid-cols-2">
                <button type="button" onClick={() => setRemoving(null)} className="neu-action-secondary">
                  Cancel
                </button>
                <button type="button" onClick={confirmRemove} className="neu-action-primary hover:!text-k-red-fg">
                  Remove
                </button>
              </div>
            </>
          }
        />
      )}
    </div>
  )
}

function SectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="text-[11px] font-semibold tracking-[0.5px] text-k-text-secondary uppercase">{label}</span>
      <span className="text-[11px] text-k-text-tertiary tabular-nums">{count}</span>
      <div className="h-px flex-1 bg-k-divider" />
    </div>
  )
}
