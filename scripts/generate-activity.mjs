#!/usr/bin/env node

// Generates the themed ACTIVITY.STREAM SVG cards from recent public GitHub
// events. Runs locally and in the scheduled workflow, then gets committed —
// no external services involved. Usage: node scripts/generate-activity.mjs

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const USERNAME = "kangajie";
const WIDTH = 1180;
const LINE_HEIGHT = 26;
const PADDING_TOP = 64;
const PADDING_BOTTOM = 28;
const MAX_EVENTS = 6;

const scriptDirectory = fileURLToPath(new URL(".", import.meta.url));
const outputDirectory = resolve(scriptDirectory, "../assets/activity");

const palettes = {
  dark: {
    backgroundStart: "#020617",
    backgroundEnd: "#0F172A",
    primary: "#E5E7EB",
    muted: "#64748B",
    cyan: "#22D3EE",
    blue: "#38BDF8",
    violet: "#7C3AED",
    green: "#10B981"
  },
  light: {
    backgroundStart: "#F8FBFF",
    backgroundEnd: "#F5F3FF",
    primary: "#172554",
    muted: "#64748B",
    cyan: "#0891B2",
    blue: "#2563EB",
    violet: "#6D28D9",
    green: "#047857"
  }
};

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

function eventToEntry(event) {
  const repo = event.repo?.name;
  if (!repo) return null;

  const date = formatDate(event.created_at);

  switch (event.type) {
    case "PushEvent": {
      const commits = event.payload?.commits?.length || 1;
      return { date, verb: "push", detail: `${commits} commit${commits === 1 ? "" : "s"} -> ${repo}` };
    }
    case "CreateEvent": {
      const refType = event.payload?.ref_type || "resource";
      return { date, verb: "create", detail: `new ${refType} -> ${repo}` };
    }
    case "PullRequestEvent": {
      const action = event.payload?.action || "updated";
      const number = event.payload?.pull_request?.number;
      return { date, verb: "pr", detail: `${action} #${number ?? "?"} -> ${repo}` };
    }
    case "IssuesEvent": {
      const action = event.payload?.action || "updated";
      const number = event.payload?.issue?.number;
      return { date, verb: "issue", detail: `${action} #${number ?? "?"} -> ${repo}` };
    }
    case "WatchEvent":
      return { date, verb: "star", detail: `starred -> ${repo}` };
    case "ForkEvent":
      return { date, verb: "fork", detail: `forked -> ${repo}` };
    default:
      return null;
  }
}

async function fetchEntries() {
  const headers = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "kangajie-profile-activity"
  };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`https://api.github.com/users/${USERNAME}/events/public?per_page=40`, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} ${response.statusText}`);
  }

  const events = await response.json();
  const seen = new Set();
  const entries = [];

  for (const event of events) {
    const entry = eventToEntry(event);
    if (!entry) continue;
    const key = `${entry.date}|${entry.verb}|${entry.detail}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push(entry);
    if (entries.length >= MAX_EVENTS) break;
  }

  return entries;
}

function verbColor(verb, colors) {
  switch (verb) {
    case "push": return colors.green;
    case "create": return colors.cyan;
    case "pr": return colors.violet;
    case "issue": return colors.blue;
    default: return colors.muted;
  }
}

function createActivitySvg(entries, mode) {
  const colors = palettes[mode];
  const rowCount = Math.max(entries.length, 1);
  const height = PADDING_TOP + rowCount * LINE_HEIGHT + PADDING_BOTTOM;

  const rows = entries.length
    ? entries.map((entry, index) => {
        const y = PADDING_TOP + index * LINE_HEIGHT;
        const begin = (0.3 + index * 0.12).toFixed(2);
        return `<g opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="${begin}s" fill="freeze"/>
  <text x="34" y="${y}" class="row"><tspan fill="${colors.muted}">${escapeXml(entry.date)}</tspan><tspan fill="${colors.muted}">  |  </tspan><tspan fill="${verbColor(entry.verb, colors)}" font-weight="700">${escapeXml(entry.verb.padEnd(6))}</tspan><tspan fill="${colors.primary}">${escapeXml(entry.detail)}</tspan></text>
</g>`;
      }).join("\n")
    : `<text x="34" y="${PADDING_TOP}" class="row" fill="${colors.muted}">no recent public activity detected...</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-label="Recent GitHub activity for ${USERNAME}">
<defs>
  <linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${colors.backgroundStart}"/><stop offset="1" stop-color="${colors.backgroundEnd}"/></linearGradient>
  <linearGradient id="border" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${colors.violet}"/><stop offset="0.48" stop-color="${colors.cyan}"/><stop offset="1" stop-color="${colors.green}"/></linearGradient>
  <style>
    .title { font-family: 'Courier New', Consolas, monospace; font-size: 11px; letter-spacing: 2px; fill: ${colors.blue}; opacity: 0.78; }
    .row { font-family: 'Courier New', Consolas, monospace; font-size: 14px; }
    text, tspan { white-space: pre; }
  </style>
</defs>
<rect width="${WIDTH}" height="${height}" rx="14" fill="url(#background)"/>
<rect x="2" y="2" width="${WIDTH - 4}" height="${height - 4}" rx="12" fill="none" stroke="url(#border)" stroke-width="1.5" opacity="0.6"><animate attributeName="opacity" values="0.4;0.8;0.4" dur="3.4s" repeatCount="indefinite"/></rect>
<text x="34" y="34" class="title">ACTIVITY.STREAM / LIVE.FEED</text>
<circle cx="${WIDTH - 46}" cy="29" r="4" fill="${colors.green}"><animate attributeName="opacity" values="1;0.2;1" dur="1.4s" repeatCount="indefinite"/></circle>
<text x="${WIDTH - 38}" y="33" class="title" fill="${colors.green}">LIVE</text>
${rows}
</svg>`;
}

async function main() {
  const entries = await fetchEntries();

  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(resolve(outputDirectory, "activity-dark.svg"), createActivitySvg(entries, "dark")),
    writeFile(resolve(outputDirectory, "activity-light.svg"), createActivitySvg(entries, "light"))
  ]);

  console.log(`Generated activity cards with ${entries.length} entries in assets/activity/.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
