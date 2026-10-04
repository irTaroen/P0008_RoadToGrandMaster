// Exposes package.json version as NEXT_PUBLIC_APP_VERSION (nimbus-styling.md §3.7)
import { createRequire } from "module"
const require = createRequire(import.meta.url)
const { version } = require("./package.json")

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: { NEXT_PUBLIC_APP_VERSION: version },
  // The API routes read public/portraits from disk (listing, existence checks);
  // make sure the folder ships with their serverless functions.
  outputFileTracingIncludes: {
    "/api/portraits": ["./public/portraits/**/*"],
    "/api/champions": ["./public/portraits/**/*"],
  },
}

export default nextConfig
