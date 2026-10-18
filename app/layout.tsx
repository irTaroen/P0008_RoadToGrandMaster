/**
 * Root layout — Poppins font, fixed starfield (painted only in dark mode),
 * and the provider stack. Content sits in a relative z-[1] wrapper above the stars.
 */
import type { Metadata, Viewport } from "next"
import { Poppins } from "next/font/google"

import "./globals.css"
import { AppProviders } from "@/providers"
import { cn } from "@/lib/utils"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Road to Grandmaster",
  description: "My League of Legends champion pool",
}

// Cover the notch (pages pad with env(safe-area-inset-*)); browser chrome matches --k-bg
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f0eb" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1626" },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("antialiased", poppins.variable, "font-sans")}>
      <body>
        <div className="starfield" aria-hidden="true" />
        <AppProviders>
          <div className="relative z-[1]">{children}</div>
        </AppProviders>
        <span className="pointer-events-none fixed right-[max(0.75rem,env(safe-area-inset-right))] bottom-[max(0.5rem,env(safe-area-inset-bottom))] text-[10px] text-k-text-tertiary/60 select-none">
          v{process.env.NEXT_PUBLIC_APP_VERSION ?? "dev"}
        </span>
      </body>
    </html>
  )
}
