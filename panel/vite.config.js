import { defineConfig } from "vite";

export default defineConfig({
  // Rutas relativas: el panel funciona en /admin/ de cualquier dominio
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 4000
  }
});
