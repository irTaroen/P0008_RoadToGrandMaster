"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Check, ExternalLink, ImagePlus, Loader2, Trash2 } from "lucide-react"

import {
  CATEGORIES,
  CATEGORY_TONE,
  type Category,
  type Champion,
  parsePortrait,
  portraitUrl,
} from "@/lib/champions"
import { cn } from "@/lib/utils"
import { Modal } from "./modal"

type Props = {
  /** Present when editing; absent when adding. */
  champion?: Champion
  existing: Champion[]
  /** From data/settings.json — where to download new portraits. */
  portraitSourceUrl?: string
  onClose: () => void
  onSaved: (c: Champion) => void
}

const stem = (file: string) => file.replace(/\.[^.]+$/, "")

export function ChampionForm({ champion, existing, portraitSourceUrl, onClose, onSaved }: Props) {
  const editing = !!champion
  const [name, setName] = useState(champion?.name ?? "")
  const [category, setCategory] = useState<Category | null>(champion?.category ?? null)
  const [portraits, setPortraits] = useState<string[] | null>(null)
  const [portrait, setPortrait] = useState<string | null>(champion?.portrait ?? null)
  const [upload, setUpload] = useState<File | null>(null)
  const [skin, setSkin] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Portrait waiting for delete confirmation
  const [deleting, setDeleting] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    fetch("/api/portraits")
      .then((r) => r.json())
      .then(setPortraits)
      .catch(() => setError("Couldn't load the portraits folder"))
  }, [])

  // Only offer portraits of champions that aren't already on a card (their skins included)
  const unused = useMemo(() => {
    const taken = new Set(existing.map((c) => parsePortrait(c.portrait).base))
    return portraits?.filter((p) => !taken.has(parsePortrait(p).base)) ?? []
  }, [portraits, existing])

  // Editing: this champion's default portrait first, then its skins
  const skins = useMemo(() => {
    if (!champion) return []
    const base = parsePortrait(champion.portrait).base
    const own = portraits?.filter((p) => parsePortrait(p).base === base) ?? [champion.portrait]
    return own.sort((a, b) => Number(!!parsePortrait(a).skin) - Number(!!parsePortrait(b).skin))
  }, [portraits, champion])
  const tiles = editing ? skins : unused

  const uploadPreview = useMemo(() => (upload ? URL.createObjectURL(upload) : null), [upload])
  useEffect(() => () => void (uploadPreview && URL.revokeObjectURL(uploadPreview)), [uploadPreview])

  const pickPortrait = (file: string) => {
    setPortrait(file)
    setUpload(null)
    if (editing) return
    // Names match portraits: prefill (or follow) the name from the file, minus any skin
    if (!name.trim() || (portrait && name === parsePortrait(portrait).base)) setName(parsePortrait(file).base)
  }

  const pickUpload = (f: File) => {
    setUpload(f)
    setPortrait(null)
    if (!editing) {
      if (!name.trim()) setName(stem(f.name))
      return
    }
    // An upload on an existing card is a new skin: suggest its name from the file, minus the champion
    const base = parsePortrait(champion.portrait).base
    const s = stem(f.name)
    const rest = s.toLowerCase().startsWith(base.toLowerCase()) ? s.slice(base.length) : s
    setSkin(rest.replace(/^[\s_-]+/, "").replace(/_/g, " "))
  }

  async function deletePortrait() {
    if (!deleting) return
    setRemoving(true)
    setError(null)
    try {
      const res = await fetch(`/api/portraits?file=${encodeURIComponent(deleting)}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Couldn't delete the portrait")
      setPortraits((prev) => prev?.filter((p) => p !== deleting) ?? prev)
      if (portrait === deleting) setPortrait(champion?.portrait ?? null)
    } catch (e) {
      setError((e as Error).message)
    }
    setRemoving(false)
    setDeleting(null)
  }

  const valid = name.trim() && category && (upload ? !editing || skin.trim() : editing || portrait)
  const dirty =
    !editing || name.trim() !== champion.name || category !== champion.category || portrait !== champion.portrait

  async function save() {
    if (!valid || !category) return
    setSaving(true)
    setError(null)
    try {
      let res: Response
      if (editing && upload) {
        const form = new FormData()
        form.set("name", name.trim())
        form.set("category", category)
        form.set("file", upload)
        form.set("skin", skin.trim())
        res = await fetch(`/api/champions/${champion.id}`, { method: "PATCH", body: form })
      } else if (editing) {
        res = await fetch(`/api/champions/${champion.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), category, portrait }),
        })
      } else {
        const form = new FormData()
        form.set("name", name.trim())
        form.set("category", category)
        if (upload) form.set("file", upload)
        else if (portrait) form.set("portrait", portrait)
        res = await fetch("/api/champions", { method: "POST", body: form })
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Something went wrong")
      onSaved(data)
    } catch (e) {
      setError((e as Error).message)
      setSaving(false)
    }
  }

  return (
    <>
      <Modal
        eyebrow={editing ? "Edit champion" : "Champion pool"}
        title={editing ? champion.name : "Add a champion"}
        subtitle={editing ? "Change the name, category or portrait, or upload a new skin." : "Pick a portrait from your folder or upload a new one."}
        onClose={() => !saving && !deleting && onClose()}
        className="max-w-[620px]"
        footer={
          <>
            <div className="min-h-[16px] text-[11.5px] text-k-red-fg">{error}</div>
            <div className="flex items-center gap-2.5">
              <button type="button" onClick={onClose} disabled={saving} className="neu-action-secondary">
                Cancel
              </button>
              <button type="button" onClick={save} disabled={!valid || !dirty || saving} className="neu-action-primary">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editing ? "Save" : "Add champion"}
              </button>
            </div>
          </>
        }
      >
        <form
          className="flex flex-col gap-3.5"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <div>
            <label htmlFor="champ-name" className="neu-form-label">
              Name
            </label>
            <input
              id="champ-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ahri"
              className="neu-input w-full rounded-full px-4 py-[11px] text-[13px] font-medium"
            />
          </div>

          <div>
            <span className="neu-form-label">Category</span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const on = category === c
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setCategory(c)}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-[box-shadow,color] duration-200 focus-visible:outline-2 focus-visible:outline-k-cloud-mid",
                      on
                        ? cn("shadow-inset-sm", CATEGORY_TONE[c].fill, CATEGORY_TONE[c].text)
                        : "bg-k-bg text-k-text-secondary shadow-raised-xs hover:text-k-cloud-deep"
                    )}
                  >
                    <span className={cn("size-[6px] rounded-full", CATEGORY_TONE[c].dot)} />
                    {c}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="neu-form-label !mb-0">Portrait</span>
              {!editing && portraitSourceUrl && (
                <a
                  href={portraitSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={portraitSourceUrl}
                  className="inline-flex items-center gap-1 rounded-sm text-[11px] font-medium tracking-[0.3px] text-k-cloud-deep hover:underline focus-visible:outline-2 focus-visible:outline-k-cloud-mid"
                >
                  Get new portraits <ExternalLink size={11} />
                </a>
              )}
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-3 rounded-xl bg-k-bg p-3 shadow-inset-sm">
              <label
                className={cn(
                  "relative flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-md bg-k-bg text-[10px] font-medium text-k-text-secondary transition-[box-shadow,color] duration-200 hover:text-k-cloud-deep",
                  upload ? "shadow-[var(--k-shadow-raised-xs),0_0_0_2px_var(--k-cloud-deep)]" : "shadow-raised-xs"
                )}
              >
                {uploadPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={uploadPreview} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
                ) : (
                  <>
                    <ImagePlus size={18} />
                    Upload
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) pickUpload(f)
                  }}
                />
              </label>

              {!editing && portraits === null && !error && (
                <div className="col-span-full flex h-16 items-center justify-center">
                  <Loader2 className="size-5 animate-spin text-k-text-tertiary" />
                </div>
              )}

              {tiles.map((file) => {
                const on = portrait === file
                const label = editing ? (parsePortrait(file).skin ?? "Default") : stem(file)
                // The card's own portrait can't go: it would leave the card without one
                const deletable = file !== champion?.portrait
                return (
                  <div key={file} className="group relative">
                    <button
                      type="button"
                      title={label}
                      aria-pressed={on}
                      onClick={() => pickPortrait(file)}
                      className={cn(
                        "relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-md transition-shadow duration-200 focus-visible:outline-2 focus-visible:outline-k-cloud-mid",
                        on ? "shadow-[var(--k-shadow-raised-xs),0_0_0_2px_var(--k-cloud-deep)]" : "shadow-raised-xs"
                      )}
                    >
                      <Image src={portraitUrl(file)} alt="" fill sizes="120px" className="object-cover object-top" />
                      <span className="absolute inset-x-0 bottom-0 truncate bg-k-bg/85 px-1 py-0.5 text-[9.5px] font-medium text-k-text-primary">
                        {label}
                      </span>
                      {on && (
                        <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-k-bg text-k-cloud-deep shadow-raised-xs">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                    {deletable && (
                      <button
                        type="button"
                        title={`Delete ${label}`}
                        aria-label={`Delete ${label}`}
                        onClick={() => setDeleting(file)}
                        className="absolute top-1 left-1 flex size-5 cursor-pointer items-center justify-center rounded-full bg-k-bg text-k-text-secondary opacity-0 shadow-raised-xs transition-[opacity,color] duration-200 group-focus-within:opacity-100 group-hover:opacity-100 hover:text-k-red-fg focus-visible:outline-2 focus-visible:outline-k-cloud-mid [@media(hover:none)]:opacity-100"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                )
              })}

              {!editing && portraits !== null && unused.length === 0 && (
                <p className="col-span-full self-center text-[11.5px] text-k-text-secondary">
                  Every portrait in the folder is already on a card. Upload a new one.
                </p>
              )}
            </div>
            {editing && upload && (
              <div className="mt-3.5">
                <label htmlFor="champ-skin" className="neu-form-label">
                  Skin name
                </label>
                <input
                  id="champ-skin"
                  value={skin}
                  onChange={(e) => setSkin(e.target.value)}
                  placeholder="e.g. Soulfighter"
                  className="neu-input w-full rounded-full px-4 py-[11px] text-[13px] font-medium"
                />
              </div>
            )}
          </div>
        </form>
      </Modal>

      {deleting && (
        <Modal
          eyebrow="Delete portrait"
          title={`Delete ${editing ? (parsePortrait(deleting).skin ?? "Default") : stem(deleting)}?`}
          subtitle={`${deleting} is permanently removed from your portraits folder. This can't be undone.`}
          onClose={() => !removing && setDeleting(null)}
          footer={
            <>
              <span />
              <div className="flex items-center gap-2.5">
                <button type="button" onClick={() => setDeleting(null)} disabled={removing} className="neu-action-secondary">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={deletePortrait}
                  disabled={removing}
                  className="neu-action-primary hover:!text-k-red-fg"
                >
                  {removing && <Loader2 size={14} className="animate-spin" />}
                  Delete
                </button>
              </div>
            </>
          }
        />
      )}
    </>
  )
}
