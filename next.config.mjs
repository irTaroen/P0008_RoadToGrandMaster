// Exposes package.json version as NEXT_PUBLIC_APP_VERSION (nimbus-styling.md §3.7)
import { createRequire } from "module"
const require = createRequire(import.meta.url)
const { version } = require("./package.json")

// Portraits live in the public Supabase Storage bucket "portraits"
const PORTRAIT_PATH = "/storage/v1/object/public/portraits/"

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_PORTRAIT_BASE: process.env.SUPABASE_URL ? new URL(PORTRAIT_PATH, process.env.SUPABASE_URL).href : "",
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: `${PORTRAIT_PATH}**` }],
  },
}

export default nextConfig
