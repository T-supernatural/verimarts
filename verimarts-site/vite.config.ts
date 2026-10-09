import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "portal-metadata",
      transformIndexHtml(html: string) {
        return mode === "portal"
          ? html.replace(
              "<title>Verimarts | Find your next drive</title>",
              '<meta name="robots" content="noindex, nofollow"/><title>Owner portal | Verimarts</title>',
            )
          : html;
      },
    },
  ],
}));
