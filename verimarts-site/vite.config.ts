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
              "<title>FASHYN | Modern style, thoughtfully chosen.</title>",
              '<meta name="robots" content="noindex, nofollow"/><title>Owner portal | FASHYN</title>',
            )
          : html;
      },
    },
  ],
}));
