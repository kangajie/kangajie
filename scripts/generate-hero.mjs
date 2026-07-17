#!/usr/bin/env node

// Generates the animated cyber console hero SVGs committed to the repo.
// BUILD.LOG is pulled live from the GitHub API, so new repos show up
// automatically on each scheduled run. Usage: node scripts/generate-hero.mjs

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildProfileLines, createHeroSvg, fetchBuildLog } from "../lib/hero-core.mjs";

const scriptDirectory = fileURLToPath(new URL(".", import.meta.url));
const outputDirectory = resolve(scriptDirectory, "../assets/hero");

async function main() {
  const buildLog = await fetchBuildLog();
  const profileLines = buildProfileLines(buildLog);

  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(resolve(outputDirectory, "kangajie-console-dark.svg"), createHeroSvg("dark", "desktop", profileLines)),
    writeFile(resolve(outputDirectory, "kangajie-console-light.svg"), createHeroSvg("light", "desktop", profileLines)),
    writeFile(resolve(outputDirectory, "kangajie-console-mobile-dark.svg"), createHeroSvg("dark", "mobile", profileLines)),
    writeFile(resolve(outputDirectory, "kangajie-console-mobile-light.svg"), createHeroSvg("light", "mobile", profileLines))
  ]);

  console.log("Generated kangajie hero assets in assets/hero/.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
