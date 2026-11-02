import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

// Fallback de SPA para o GitHub Pages: copia o index.html para 404.html no fim
// do build. Como o 404.html é idêntico ao index (com os assets já hasheados),
// um deep link recarregado (ex: /projeto/macropad) carrega o app e o
// BrowserRouter resolve a rota — sem flash de redirect.
const spaFallback404 = () => ({
  name: "spa-fallback-404",
  apply: "build" as const,
  closeBundle() {
    const index = path.resolve(__dirname, "dist/index.html");
    const notFound = path.resolve(__dirname, "dist/404.html");
    if (fs.existsSync(index)) fs.copyFileSync(index, notFound);
  },
});

// three.js e o que só existe por causa dele (r3f, drei e as dependências deles).
const THREE_DEPS =
  /node_modules[\\/](three|@react-three|three-stdlib|three-mesh-bvh|troika-[^\\/]+|meshoptimizer|maath|camera-controls|@monogrid|detect-gpu|stats-gl|stats\.js|@use-gesture|its-fine|react-reconciler|suspend-react|zustand|tunnel-rat|hls\.js|@mediapipe|glsl-noise|webgl-sdf-generator|bidi-js|@dimforge)[\\/]/;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    spaFallback404(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // O helper de preload do Vite é usado por todo import() do site. Solto,
          // o Rollup o colocava no chunk do three — e todo import() puxava o 3D.
          if (id.includes('vite/preload-helper')) return 'vendor';
          if (!id.includes('node_modules')) return;
          // O 3D tem chunk próprio: só a vista explodida e o visualizador do case
          // o importam (sob demanda). No 'vendor' ele viraria download de toda página.
          if (THREE_DEPS.test(id)) return 'three';
          return 'vendor';
        },
      },
    },
  },
}));
