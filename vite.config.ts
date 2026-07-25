import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Relative base so the build works both on GitHub Pages (subpath) and when the
// single-file build is opened directly from disk / a CDN.
export default defineConfig({
  base: "./",
  plugins: [viteSingleFile()],
  build: {
    target: "es2020",
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
  },
});
