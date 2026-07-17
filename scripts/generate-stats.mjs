#!/usr/bin/env node

// Generates the themed STATS.CORE SVG cards from live GitHub data:
// profile stats (repos, stars, followers, commits) and a top-language bar.
// Same cyber console style as the hero. Usage: node scripts/generate-stats.mjs

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const USERNAME = "kangajie";
const WIDTH = 1180;
const HEIGHT = 250;

const scriptDirectory = fileURLToPath(new URL(".", import.meta.url));
const outputDirectory = resolve(scriptDirectory, "../assets/stats");

const palettes = {
  dark: {
    backgroundStart: "#020617",
    backgroundEnd: "#0F172A",
    panel: "#07111F",
    primary: "#E5E7EB",
    muted: "#64748B",
    cyan: "#22D3EE",
    blue: "#38BDF8",
    violet: "#7C3AED",
    green: "#10B981",
    yellow: "#FACC15",
    orange: "#F97316",
    pink: "#F472B6"
  },
  light: {
    backgroundStart: "#F8FBFF",
    backgroundEnd: "#F5F3FF",
    panel: "#FFFFFF",
    primary: "#172554",
    muted: "#64748B",
    cyan: "#0891B2",
    blue: "#2563EB",
    violet: "#6D28D9",
    green: "#047857",
    yellow: "#CA8A04",
    orange: "#EA580C",
    pink: "#DB2777"
  }
};

// Rough brand-adjacent colors for common languages, keyed to palette slots.
const LANGUAGE_COLORS = ["cyan", "violet", "green", "yellow", "blue", "orange", "pink"];

const headers = {
  "Accept": "application/vnd.github+json",
  "User-Agent": "kangajie-profile-stats"
};
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (token) headers.Authorization = `Bearer ${token}`;

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function fetchJson(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${url}`);
  }
  return response.json();
}

async function fetchStats() {
  const [user, repos, events] = await Promise.all([
    fetchJson(`https://api.github.com/users/${USERNAME}`),
    fetchJson(`https://api.github.com/users/${USERNAME}/repos?per_page=100`),
    fetchJson(`https://api.github.com/users/${USERNAME}/events/public?per_page=100`)
  ]);

  const ownRepos = repos.filter((repo) => !repo.fork);
  const stars = ownRepos.reduce((total, repo) => total + repo.stargazers_count, 0);
  const recentCommits = events
    .filter((event) => event.type === "PushEvent")
    .reduce((total, event) => total + (event.payload?.commits?.length || 1), 0);

  // Language totals weighted by repo size per language endpoint would cost
  // one request per repo; language field per repo is a good cheap proxy.
  const languageCounts = new Map();
  for (const repo of ownRepos) {
    if (!repo.language) continue;
    languageCounts.set(repo.language, (languageCounts.get(repo.language) || 0) + 1);
  }
  const totalLanguageRepos = [...languageCounts.values()].reduce((a, b) => a + b, 0) || 1;
  const languages = [...languageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, share: count / totalLanguageRepos }));

  return {
    repos: ownRepos.length,
    stars,
    followers: user.followers,
    recentCommits,
    languages
  };
}

function statBlock(x, label, value, color, colors, beginSeconds) {
  return `<g opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="${beginSeconds}s" fill="freeze"/>
  <text x="${x}" y="108" text-anchor="middle" class="stat-value" fill="${color}">${escapeXml(String(value))}</text>
  <text x="${x}" y="132" text-anchor="middle" class="stat-label" fill="${colors.muted}">${escapeXml(label)}</text>
</g>`;
}

function createStatsSvg(stats, mode) {
  const colors = palettes[mode];
  const columns = [
    { label: "REPOSITORIES", value: stats.repos, color: colors.cyan },
    { label: "STARS EARNED", value: stats.stars, color: colors.yellow },
    { label: "FOLLOWERS", value: stats.followers, color: colors.violet },
    { label: "RECENT COMMITS", value: stats.recentCommits, color: colors.green }
  ];

  const blockWidth = (WIDTH - 68) / columns.length;
  const blocks = columns
    .map((column, index) =>
      statBlock(34 + blockWidth * index + blockWidth / 2, column.label, column.value, column.color, colors, 0.3 + index * 0.15)
    )
    .join("\n");

  // Language bar: one segmented gradient bar with a legend underneath.
  const barX = 34;
  const barY = 168;
  const barWidth = WIDTH - 68;
  const barHeight = 12;

  let cursor = 0;
  const segments = [];
  const legends = [];
  stats.languages.forEach((language, index) => {
    const segmentWidth = Math.max(barWidth * language.share, 8);
    const color = colors[LANGUAGE_COLORS[index % LANGUAGE_COLORS.length]];
    const begin = (0.9 + index * 0.12).toFixed(2);
    segments.push(
      `<rect x="${(barX + cursor).toFixed(1)}" y="${barY}" width="0" height="${barHeight}" rx="3" fill="${color}" opacity="0.85"><animate attributeName="width" from="0" to="${segmentWidth.toFixed(1)}" dur="0.6s" begin="${begin}s" fill="freeze"/></rect>`
    );
    const legendX = barX + (index % 6) * (barWidth / 6);
    legends.push(
      `<g opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="${begin}s" fill="freeze"/>
  <circle cx="${(legendX + 6).toFixed(1)}" cy="${barY + 34}" r="4" fill="${color}"/>
  <text x="${(legendX + 16).toFixed(1)}" y="${barY + 38}" class="legend" fill="${colors.primary}">${escapeXml(language.name)} <tspan fill="${colors.muted}">${Math.round(language.share * 100)}%</tspan></text>
</g>`
    );
    cursor += segmentWidth;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="GitHub stats for ${USERNAME}">
<defs>
  <linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${colors.backgroundStart}"/><stop offset="1" stop-color="${colors.backgroundEnd}"/></linearGradient>
  <linearGradient id="border" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${colors.violet}"/><stop offset="0.48" stop-color="${colors.cyan}"/><stop offset="1" stop-color="${colors.green}"/></linearGradient>
  <style>
    .title { font-family: 'Courier New', Consolas, monospace; font-size: 11px; letter-spacing: 2px; fill: ${colors.blue}; opacity: 0.78; }
    .stat-value { font-family: 'Courier New', Consolas, monospace; font-size: 42px; font-weight: 700; }
    .stat-label { font-family: 'Courier New', Consolas, monospace; font-size: 11px; letter-spacing: 2px; }
    .legend { font-family: 'Courier New', Consolas, monospace; font-size: 12px; }
    text, tspan { white-space: pre; }
  </style>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" rx="14" fill="url(#background)"/>
<rect x="2" y="2" width="${WIDTH - 4}" height="${HEIGHT - 4}" rx="12" fill="none" stroke="url(#border)" stroke-width="1.5" opacity="0.6"><animate attributeName="opacity" values="0.4;0.8;0.4" dur="3.4s" repeatCount="indefinite"/></rect>
<text x="34" y="34" class="title">STATS.CORE / GITHUB.METRICS</text>
<circle cx="${WIDTH - 46}" cy="29" r="4" fill="${colors.green}"><animate attributeName="opacity" values="1;0.2;1" dur="1.4s" repeatCount="indefinite"/></circle>
<text x="${WIDTH - 38}" y="33" class="title" fill="${colors.green}">LIVE</text>
${blocks}
${segments.join("\n")}
${legends.join("\n")}
</svg>`;
}

async function main() {
  const stats = await fetchStats();

  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(resolve(outputDirectory, "stats-dark.svg"), createStatsSvg(stats, "dark")),
    writeFile(resolve(outputDirectory, "stats-light.svg"), createStatsSvg(stats, "light"))
  ]);

  console.log(
    `Generated stats cards: ${stats.repos} repos, ${stats.stars} stars, ${stats.followers} followers, ${stats.recentCommits} recent commits, top languages: ${stats.languages.map((l) => l.name).join(", ")}.`
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
