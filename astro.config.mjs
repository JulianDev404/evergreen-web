// @ts-check
import { defineConfig } from "astro/config";
import { loadEnv } from "payload/node";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel/serverless";
import icon from "astro-icon";

loadEnv();

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: vercel({}),

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ["payload"],
      noExternal: ["evergreen-payload"],
    },
  },

  integrations: [icon()],
});
