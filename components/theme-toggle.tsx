"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"

const emptySubscribe = () => () => {}
const useMounted = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

/**
 * Dark/light toggle (nimbus-styling.md §3.9). The sun gold and moon violet are
 * icon art — the only sanctioned hardcoded colors.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()
  const isDark = mounted && resolvedTheme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      data-active={isDark}
      className="neu-icon-btn focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-k-cloud-mid"
      aria-pressed={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {mounted &&
        (isDark ? (
          <span className="text-[#f5c842] drop-shadow-[0_0_4px_#f5c84266]">☀</span>
        ) : (
          <svg viewBox="0 0 24 24" width={15} height={15} className="drop-shadow-[0_0_4px_#7c5cbf88]" aria-hidden="true">
            <path
              fill="#7c5cbf"
              d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"
            />
          </svg>
        ))}
    </button>
  )
}
