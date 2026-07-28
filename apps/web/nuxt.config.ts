export default defineNuxtConfig({
  compatibilityDate: "2026-07-26",
  css: [
    "@fontsource/quicksand/400.css",
    "@fontsource/quicksand/500.css",
    "@fontsource/quicksand/600.css",
    "@fontsource/quicksand/700.css",
    "@fontsource/ibm-plex-mono/400.css",
    "@fontsource/ibm-plex-mono/500.css",
    "@fontsource/ibm-plex-mono/600.css",
    "@hymui/styles/main.scss",
    "@hymui/ui/styles.scss",
    "~/assets/app.scss",
  ],
  devtools: { enabled: false },
  dir: {
    public: "../../public",
  },
  app: {
    head: {
      htmlAttrs: {
        lang: "en",
      },
      link: [{ rel: "icon", type: "image/svg+xml", href: "/logo/hymui/hymui-mark-vivid.svg" }],
      meta: [
        { name: "theme-color", content: "#0D1211" },
        {
          name: "description",
          content: "Hymui — local-first project planning for people and AI agents.",
        },
      ],
      title: "Hymui",
    },
  },
  modules: ["motion-v/nuxt"],
  nitro: {
    preset: "node-server",
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? "http://127.0.0.1:4000",
    },
  },
  typescript: {
    strict: true,
    typeCheck: true,
  },
  vite: {
    server: {
      fs: {
        allow: ["../.."],
      },
    },
  },
});
