import { defineConfig } from "tsup";
import { copyFileSync, mkdirSync } from "fs";

export default defineConfig({
  entry: {
    server: "src/server.ts",
    "hooks/auto-save": "src/hooks/auto-save.ts",
    "viewer/standalone": "src/viewer/standalone.ts",
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
  onSuccess: async () => {
    // Copy app.html to dist/viewer/ so the server can find it at runtime
    mkdirSync("dist/viewer", { recursive: true });
    copyFileSync("src/viewer/app.html", "dist/viewer/app.html");
  },
});
