import { defineConfig } from "tsup";

export default defineConfig([
  // {
  //   name: "cloud-api",
  //   entry: ["./tmp/src/index.ts"],
  //   outDir: "dist/cloud-api",
  //   dts: true,
  //   format: ["cjs"],
  //   target: "node16",
  //   tsconfig: "tsconfig.cloudapi.json",
  // },
  {
    // name: "core",
    entry: ["./src/index.ts"],
    outDir: "dist",
    dts: true,
    format: ["cjs"],
    target: "node16",
    tsconfig: "tsconfig.json",
  },
]);
