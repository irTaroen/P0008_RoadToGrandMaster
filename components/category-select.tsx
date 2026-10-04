"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"

import { CATEGORIES, CATEGORY_TONE, type Category } from "@/lib/champions"
import { cn } from "@/lib/utils"

/**
 * Category badge that opens a neu-popover listbox. Keyboard: Enter/Space/↓ to
 * open, ↑/↓ to move, Enter to pick, Escape to close.
 */
export function CategorySelect({
  value,
  label,
  onChange,
}: {
  value: Category
  label: string
  onChange: (c: Category) => void
}) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(CATEGORIES.indexOf(value))
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const tone = CATEGORY_TONE[value]
  const uid = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  const openList = () => {
    setHighlight(CATEGORIES.indexOf(value))
    setOpen(true)
  }

  const pick = (c: Category) => {
    setOpen(false)
    buttonRef.current?.focus()
    if (c !== value) onChange(c)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault()
        openList()
      }
      return
    }
    if (e.key === "Escape") {
      e.preventDefault()
      setOpen(false)
      buttonRef.current?.focus()
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      const step = e.key === "ArrowDown" ? 1 : -1
      setHighlight((h) => (h + step + CATEGORIES.length) % CATEGORIES.length)
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      pick(CATEGORIES[highlight])
    } else if (e.key === "Tab") {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} data-open={open} className="relative shrink-0" onKeyDown={onKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Category for ${label}: ${value}`}
        onClick={() => (open ? setOpen(false) : openList())}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1 rounded-full py-0.5 pr-1.5 pl-2 text-[10px] font-semibold whitespace-nowrap shadow-inset-sm transition-shadow duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-k-cloud-mid",
          "hover:shadow-[var(--k-shadow-inset-sm),0_0_0_2px_var(--k-cloud-light)]",
          open && "shadow-[var(--k-shadow-inset-sm),0_0_0_2px_var(--k-cloud-light)]",
          tone.fill,
          tone.text
        )}
      >
        <span className={cn("size-[5px] shrink-0 rounded-full", tone.dot)} />
        {value}
        <ChevronDown size={11} className={cn("transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Category"
          aria-activedescendant={`${uid}-${CATEGORIES[highlight]}`}
          className="absolute top-[calc(100%+8px)] right-0 z-20 w-[150px] animate-[float-up_0.2s_ease_both] rounded-lg bg-k-bg p-1.5 shadow-raised"
        >
          {CATEGORIES.map((c, i) => {
            const selected = c === value
            return (
              <li
                key={c}
                id={`${uid}-${c}`}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => e.preventDefault()} // keep focus on the button
                onClick={() => pick(c)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-[10px] px-3 py-2 text-[12.5px] transition-[box-shadow,color] duration-150",
                  i === highlight ? "text-k-cloud-deep shadow-inset-sm" : "text-k-text-primary"
                )}
              >
                <span className={cn("size-[6px] shrink-0 rounded-full", CATEGORY_TONE[c].dot)} />
                <span className="flex-1">{c}</span>
                {selected && <Check size={13} className="shrink-0 text-k-cloud-deep" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
