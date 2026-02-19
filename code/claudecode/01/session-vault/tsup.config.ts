import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    server: "src/server.ts",
    "hooks/auto-save": "src/hooks/auto-save.ts",
  },
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  splitting: true,
  treeshake: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
