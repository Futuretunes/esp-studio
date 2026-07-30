#!/usr/bin/env node
/**
 * Generates public/build.json for production deploys and the About page.
 *
 * Fields: version (package.json), commit (GITHUB_SHA or git), builtAt (ISO UTC).
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(rootDir, "..");
const packageJsonPath = path.join(repoRoot, "package.json");
const outputPath = path.join(repoRoot, "public", "build.json");

/**
 * @returns {string}
 */
function readPackageVersion() {
  const raw = readFileSync(packageJsonPath, "utf8");
  const parsed = JSON.parse(raw);
  if (typeof parsed.version !== "string" || parsed.version.length === 0) {
    throw new Error("package.json is missing a version string.");
  }
  return parsed.version;
}

/**
 * @returns {string}
 */
function resolveCommitHash() {
  const fromEnv =
    process.env.GITHUB_SHA?.trim() ||
    process.env.COMMIT_SHA?.trim() ||
    process.env.VITE_COMMIT_SHA?.trim();
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv;
  }

  try {
    return execSync("git rev-parse HEAD", {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "development";
  }
}

const buildInfo = {
  version: readPackageVersion(),
  commit: resolveCommitHash(),
  builtAt: new Date().toISOString(),
};

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(buildInfo, null, 2)}\n`, "utf8");

console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
console.log(JSON.stringify(buildInfo));
