"use client"

import { useEffect } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Token-built modal (nimbus-styling.md §10.11): dimmed + blurred backdrop,
 * cream panel with shadow-modal, hairlines between header / body / footer.
 */
export function Modal({
  title,
  subtitle,
  eyebrow,
  onClose,
  footer,
  children,
  className,
}: {
  title: string
  subtitle?: string
  eyebrow?: string
  onClose: () => void
  footer: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "flex max-h-[90vh] w-full max-w-[540px] animate-[float-up_0.15s_ease-out_both] flex-col overflow-hidden rounded-2xl bg-k-bg shadow-modal",
          className
        )}
      >
        <div className="flex items-center justify-between gap-4 px-6 pt-4 pb-3">
          <div className="min-w-0">
            {eyebrow && (
              <div className="mb-0.5 text-[10px] font-medium tracking-[0.6px] text-k-text-tertiary uppercase">{eyebrow}</div>
            )}
            <h2 id="modal-title" className="text-lg font-semibold tracking-[-0.3px] text-k-text-primary">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-[11.5px] text-k-text-secondary">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="neu-icon-btn">
            <X size={16} />
          </button>
        </div>

        {children && (
          <>
            <div className="mx-6 h-px bg-k-divider" />
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>
          </>
        )}

        <div className="mx-6 h-px bg-k-divider" />
        <div className="flex items-center justify-between gap-4 px-6 py-3">{footer}</div>
      </div>
    </div>,
    document.body
  )
}
