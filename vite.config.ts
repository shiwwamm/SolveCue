import { existsSync } from "node:fs";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { build as viteBuild, defineConfig } from "vite";

function extensionBuildPlugin() {
  return {
    name: "solvecue-extension-build",
    async closeBundle() {
      const distDir = resolve(__dirname, "dist");
      const nestedPopup = resolve(distDir, "src/popup/popup.html");

      if (existsSync(nestedPopup)) {
        const popupHtml = readFileSync(nestedPopup, "utf8")
          .replace('src="../../popup.js"', 'src="./popup.js"')
          .replace('href="../../assets/popup.css"', 'href="./assets/popup.css"');
        writeFileSync(resolve(distDir, "popup.html"), popupHtml);
        rmSync(resolve(distDir, "src"), { recursive: true, force: true });
      }

      await viteBuild({
        configFile: false,
        base: "./",
        build: {
          outDir: distDir,
          emptyOutDir: false,
          rollupOptions: {
            input: resolve(__dirname, "src/content/content-script.ts"),
            output: {
              format: "iife",
              name: "SolveCueContent",
              entryFileNames: "content.js",
              assetFileNames: "assets/[name][extname]",
              inlineDynamicImports: true,
            },
          },
        },
      });
    },
  };
}

export default defineConfig({
  base: "./",
  publicDir: "public",
  plugins: [extensionBuildPlugin()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/popup.html"),
        background: resolve(__dirname, "src/background/service-worker.ts"),
      },
      output: {
        format: "es",
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
