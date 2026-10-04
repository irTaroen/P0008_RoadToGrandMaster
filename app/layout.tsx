/**
 * Root layout — Poppins font, fixed starfield (painted only in dark mode),
 * and the provider stack. Content sits in a relative z-[1] wrapper above the stars.
 */
import type { Metadata } from "next"
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("antialiased", poppins.variable, "font-sans")}>
      <body>
        <div className="starfield" aria-hidden="true" />
        <AppProviders>
          <div className="relative z-[1]">{children}</div>
        </AppProviders>
        <span className="pointer-events-none fixed right-3 bottom-2 text-[10px] text-k-text-tertiary/60 select-none">
          v{process.env.NEXT_PUBLIC_APP_VERSION ?? "dev"}
        </span>
      </body>
    </html>
  )
}
