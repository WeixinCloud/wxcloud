import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["./src/index.ts"],
    outDir: "dist",
    dts: true,
    format: ["cjs"],
    target: "node16",
    tsconfig: "tsconfig.json",
  },
]);
