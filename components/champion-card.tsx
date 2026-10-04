"use client"

import { useState } from "react"
import { Pencil, Star, Trash2 } from "lucide-react"

import {
  type Champion,
  MASTERY_LABEL,
  type Mastery,
  portraitUrl,
} from "@/lib/champions"
import { cn } from "@/lib/utils"
import { CategorySelect } from "./category-select"

// Small raised buttons over the portrait — raised-xs at rest, sink on hover.
const cornerBtn =
  "inline-flex size-8 cursor-pointer items-center justify-center rounded-[10px] bg-k-bg text-k-text-secondary shadow-raised-xs transition-[box-shadow,color] duration-200 hover:text-k-cloud-deep hover:shadow-inset-sm focus-visible:outline-2 focus-visible:outline-k-cloud-mid"

type Props = {
  champion: Champion
  index: number
  onChange: (patch: Partial<Champion>) => void
  onEdit: () => void
  onRemove: () => void
}

export function ChampionCard({ champion, index, onChange, onEdit, onRemove }: Props) {
  const { name, category, mastery, active, ranked, portrait } = champion

  return (
    <article
      data-active={active}
      className="group relative flex animate-[float-up_0.5s_ease_both] has-[[data-open=true]]:z-30 flex-col rounded-2xl bg-k-bg p-3 shadow-raised transition-shadow duration-250 hover:shadow-(--k-shadow-hover-card)"
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
    >
      {/* Portrait — inset frame; inactive champs rest desaturated */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-k-bg shadow-inset-sm">
        {/* eslint-disable-next-line @next/next/no-img-element -- served from the local portraits folder */}
        <img
          src={portraitUrl(portrait, 480)}
          alt={name}
          loading={index < 10 ? "eager" : "lazy"}
          decoding="async"
          className={cn(
            "h-full w-full object-cover object-top transition-[filter,opacity,transform] duration-300 group-hover:scale-[1.02]",
            !active && "opacity-75 grayscale-[0.65] group-hover:opacity-100 group-hover:grayscale-0"
          )}
        />

        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${name}`}
            title="Edit"
            className={cornerBtn}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${name}`}
            title="Remove"
            className={cn(cornerBtn, "hover:text-k-red-fg")}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-1.5 pt-3.5 pb-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-[17px] leading-[1.2] font-bold tracking-[-0.3px] text-k-text-primary">
            {name}
          </h3>
          <CategorySelect value={category} label={name} onChange={(c) => onChange({ category: c })} />
        </div>

        <div className="flex items-center justify-between gap-2">
          <MasteryStars value={mastery} name={name} onChange={(m) => onChange({ mastery: m })} />
          <div className="flex flex-col items-end gap-1.5">
            <Switch
              checked={active}
              onLabel="Active"
              offLabel="Inactive"
              ariaLabel={`${name} currently played`}
              tone="green"
              // Going inactive also takes the champ out of Ranked
              onChange={(a) => onChange(a ? { active: true } : { active: false, ranked: false })}
            />
            <Switch
              checked={ranked}
              onLabel="Ranked"
              offLabel="Ranked"
              ariaLabel={`${name} played in Ranked`}
              tone="purple"
              disabled={!active}
              disabledHint="Set the champion to Active first"
              onChange={(r) => onChange({ ranked: r })}
            />
          </div>
        </div>
      </div>
    </article>
  )
}

function MasteryStars({
  value,
  name,
  onChange,
}: {
  value: Mastery
  name: string
  onChange: (m: Mastery) => void
}) {
  const [hover, setHover] = useState<Mastery | null>(null)
  const shown = hover ?? value

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <div
        role="radiogroup"
        aria-label={`Mastery for ${name}`}
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHover(null)}
      >
        {([1, 2, 3] as const).map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={MASTERY_LABEL[n]}
            title={MASTERY_LABEL[n]}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            className="cursor-pointer rounded-sm p-0.5 transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-k-cloud-mid"
          >
            <Star
              size={17}
              className={cn(
                "transition-colors duration-150",
                n <= shown ? "fill-current text-k-yellow-fg" : "text-k-text-tertiary"
              )}
            />
          </button>
        ))}
      </div>
      <span className="pl-0.5 text-[10px] font-medium tracking-[0.4px] text-k-text-secondary uppercase">
        {MASTERY_LABEL[shown]}
      </span>
    </div>
  )
}

/** Every tone a switch can light up in — full class strings (nimbus-styling.md §17.5). */
const SWITCH_TONE = {
  green: { label: "text-k-green-fg", track: "bg-k-green-bg", knob: "bg-k-green-fg" },
  purple: { label: "text-k-purple-fg", track: "bg-k-purple-bg", knob: "bg-k-purple-fg" },
} as const

function Switch({
  checked,
  onLabel,
  offLabel,
  ariaLabel,
  tone,
  disabled,
  disabledHint,
  onChange,
}: {
  checked: boolean
  onLabel: string
  offLabel: string
  ariaLabel: string
  tone: keyof typeof SWITCH_TONE
  disabled?: boolean
  disabledHint?: string
  onChange: (v: boolean) => void
}) {
  const t = SWITCH_TONE[tone]
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      title={disabled ? disabledHint : undefined}
      onClick={() => onChange(!checked)}
      className="group/sw flex shrink-0 cursor-pointer items-center justify-end gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-k-cloud-mid disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span
        className={cn(
          "text-[11px] font-medium transition-colors duration-200",
          checked ? t.label : "text-k-text-tertiary group-enabled/sw:group-hover/sw:text-k-text-secondary"
        )}
      >
        {checked ? onLabel : offLabel}
      </span>
      <span
        className={cn(
          "relative h-[22px] w-[40px] rounded-full shadow-inset-sm transition-colors duration-200",
          checked ? t.track : "bg-k-bg"
        )}
      >
        <span
          className={cn(
            "absolute top-[3px] left-[3px] size-4 rounded-full shadow-raised-xs transition-[transform,background-color] duration-200",
            checked ? cn("translate-x-[18px]", t.knob) : "bg-k-bg"
          )}
        />
      </span>
    </button>
  )
}
