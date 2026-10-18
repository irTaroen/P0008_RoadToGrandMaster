import type { MetadataRoute } from "next"

// Installable from the phone's home screen. No service worker: the pool is read live from Supabase.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Road to Grandmaster",
    short_name: "RTGM",
    description: "My League of Legends champion pool",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f0eb",
    theme_color: "#f5f0eb",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
