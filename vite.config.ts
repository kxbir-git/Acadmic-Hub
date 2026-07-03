// @lovable.dev/vite-tanstack-config already includes tanstackStart, viteReact, tailwindcss,
// tsConfigPaths, nitro (default: cloudflare), componentTagger (dev-only), VITE_* env injection,
// @ path alias, React/TanStack dedupe, error logger plugins, and sandbox detection.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: {
    config: {
      preset: "vercel",
    },
  },
});
