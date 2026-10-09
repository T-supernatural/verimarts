import { execFileSync } from "node:child_process";
import process from "node:process";
const target = process.env.BUILD_TARGET || "storefront";
if (!["storefront", "portal"].includes(target))
  throw new Error("BUILD_TARGET must be storefront or portal.");
execFileSync(
  process.execPath,
  ["node_modules/typescript/bin/tsc", "--noEmit"],
  { stdio: "inherit" },
);
execFileSync(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "build",
    "--mode",
    target,
    "--outDir",
    "dist",
  ],
  { stdio: "inherit" },
);
