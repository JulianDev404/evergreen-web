// @ts-check
import { defineConfig } from "astro/config";
import { loadEnv } from "payload/node";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import node from "@astrojs/node";

loadEnv();

// https://astro.build/config
export default defineConfig({
  site: "https://evergreenplumbingri.com",
  output: "server",
  adapter: node({
    mode: "standalone",
  }),

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ["payload"],
      noExternal: ["evergreen-payload"],
    },
  },

  integrations: [icon()],
});
