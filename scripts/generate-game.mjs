#!/usr/bin/env node

// Generates GRID.BREACH — an animated "contribution raid" SVG built from the
// live GitHub contribution calendar. A breach bot snakes through the grid,
// extracting every contribution node while firewall drones patrol, with an
// exfiltration progress bar. Same cyber console style as the other cards.
// Usage: node scripts/generate-game.mjs

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const USERNAME = "kangajie";
const CELL = 16;
const GAP = 5;
const STEP = CELL + GAP;
const GRID_X = 34;
const GRID_Y = 74;
const SWEEP_SECONDS = 26;
const SWEEP_BEGIN = 0.6;

const scriptDirectory = fileURLToPath(new URL(".", import.meta.url));
const outputDirectory = resolve(scriptDirectory, "../assets/game");

const palettes = {
  dark: {
    backgroundStart: "#020617",
    backgroundEnd: "#0F172A",
    primary: "#E5E7EB",
    muted: "#64748B",
    cyan: "#22D3EE",
    blue: "#38BDF8",
    violet: "#7C3AED",
    green: "#10B981",
    red: "#F87171",
    yellow: "#FACC15",
    emptyCell: "#111C33",
    levels: ["#111C33", "#0E4429", "#006D32", "#26A641", "#39D353"],
    extracted: "#7C3AED",
    flash: "#F8FAFC"
  },
  light: {
    backgroundStart: "#F8FBFF",
    backgroundEnd: "#F5F3FF",
    primary: "#172554",
    muted: "#64748B",
    cyan: "#0891B2",
    blue: "#2563EB",
    violet: "#6D28D9",
    green: "#047857",
    red: "#DC2626",
    yellow: "#CA8A04",
    emptyCell: "#E7EDF7",
    levels: ["#E7EDF7", "#9BE9A8", "#40C463", "#30A14E", "#216E39"],
    extracted: "#6D28D9",
    flash: "#0F172A"
  }
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function fetchCalendar() {
  const response = await fetch(`https://github.com/users/${USERNAME}/contributions`, {
    headers: { "User-Agent": "kangajie-profile-game" }
  });
  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status} for the contribution calendar.`);
  }

  const html = await response.text();
  const cellPattern = /data-date="(\d{4}-\d{2}-\d{2})"\s+id="contribution-day-component-(\d)-(\d+)"\s+data-level="(\d)"/g;
  const cells = [];

  for (const match of html.matchAll(cellPattern)) {
    cells.push({
      date: match[1],
      day: Number(match[2]),
      week: Number(match[3]),
      level: Number(match[4])
    });
  }

  if (!cells.length) {
    throw new Error("Could not parse any contribution cells from GitHub's HTML.");
  }

  return cells;
}

// Snake order: even weeks top->bottom, odd weeks bottom->up.
function snakeIndex(week, day) {
  return week * 7 + (week % 2 === 0 ? day : 6 - day);
}

function cellPosition(week, day) {
  return { x: GRID_X + week * STEP, y: GRID_Y + day * STEP };
}

function buildMonthLabels(cells, colors) {
  const seen = new Set();
  const labels = [];

  for (const cell of cells) {
    if (cell.day !== 0) continue;
    const month = Number(cell.date.slice(5, 7)) - 1;
    const key = cell.date.slice(0, 7);
    if (seen.has(key)) continue;
    seen.add(key);
    const { x } = cellPosition(cell.week, 0);
    labels.push(`<text x="${x}" y="${GRID_Y - 12}" class="month" fill="${colors.muted}">${MONTH_NAMES[month]}</text>`);
  }

  return labels.join("");
}

function buildSnakePath(weekCount) {
  const top = GRID_Y + CELL / 2;
  const bottom = GRID_Y + 6 * STEP + CELL / 2;
  const parts = [];

  for (let week = 0; week < weekCount; week += 1) {
    const x = GRID_X + week * STEP + CELL / 2;
    const from = week % 2 === 0 ? top : bottom;
    const to = week % 2 === 0 ? bottom : top;
    parts.push(week === 0 ? `M ${x} ${from}` : `L ${x} ${from}`);
    parts.push(`L ${x} ${to}`);
  }

  return parts.join(" ");
}

function createGameSvg(cells, mode) {
  const colors = palettes[mode];
  const weekCount = Math.max(...cells.map((cell) => cell.week)) + 1;
  const width = GRID_X * 2 + weekCount * STEP - GAP;
  const gridBottom = GRID_Y + 7 * STEP - GAP;
  const progressY = gridBottom + 26;
  const height = progressY + 44;
  const totalSlots = weekCount * 7;
  const nodes = cells.filter((cell) => cell.level > 0);
  const sweepEnd = SWEEP_BEGIN + SWEEP_SECONDS;

  const cellRects = cells.map((cell) => {
    const { x, y } = cellPosition(cell.week, cell.day);
    const base = colors.levels[cell.level] || colors.emptyCell;

    if (cell.level === 0) {
      return `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="3" fill="${colors.emptyCell}" opacity="0.55"/>`;
    }

    const arrival = (SWEEP_BEGIN + (snakeIndex(cell.week, cell.day) / totalSlots) * SWEEP_SECONDS).toFixed(2);
    return `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="3" fill="${base}">
  <animate attributeName="fill" values="${base};${colors.flash};${colors.extracted}" dur="0.55s" begin="${arrival}s" fill="freeze"/>
</rect>`;
  }).join("\n");

  const snakePath = buildSnakePath(weekCount);

  const bot = `<g>
  <animateMotion dur="${SWEEP_SECONDS}s" begin="${SWEEP_BEGIN}s" fill="freeze" path="${snakePath}"/>
  <rect x="-11" y="-11" width="22" height="22" rx="5" fill="none" stroke="${colors.cyan}" stroke-width="1.5" opacity="0.7">
    <animate attributeName="opacity" values="0.7;0.25;0.7" dur="0.8s" repeatCount="indefinite"/>
  </rect>
  <rect x="-7" y="-7" width="14" height="14" rx="3" fill="${colors.cyan}">
    <animate attributeName="fill" values="${colors.cyan};${colors.blue};${colors.cyan}" dur="1.6s" repeatCount="indefinite"/>
  </rect>
  <circle cx="0" cy="0" r="2.5" fill="${mode === "dark" ? "#020617" : "#FFFFFF"}"/>
</g>
<g opacity="0.45">
  <animateMotion dur="${SWEEP_SECONDS}s" begin="${(SWEEP_BEGIN + 0.35).toFixed(2)}s" fill="freeze" path="${snakePath}"/>
  <rect x="-5" y="-5" width="10" height="10" rx="2" fill="${colors.violet}"/>
</g>`;

  const droneTrackTop = GRID_Y - STEP / 2 + 3;
  const droneTrackBottom = gridBottom + 6;
  const drones = [
    { path: `M ${GRID_X} ${droneTrackTop} H ${width - GRID_X} H ${GRID_X}`, dur: 17, color: colors.red },
    { path: `M ${width - GRID_X} ${droneTrackBottom} H ${GRID_X} H ${width - GRID_X}`, dur: 21, color: colors.yellow }
  ].map((drone, index) => `<g>
  <animateMotion dur="${drone.dur}s" begin="${index * 2}s" repeatCount="indefinite" path="${drone.path}"/>
  <path d="M -6 0 L 0 -5 L 6 0 L 0 5 Z" fill="${drone.color}" opacity="0.85"/>
  <circle cx="0" cy="0" r="1.8" fill="${mode === "dark" ? "#020617" : "#FFFFFF"}"/>
</g>`).join("\n");

  const progressWidth = width - GRID_X * 2 - 320;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Contribution grid raid game for ${USERNAME}">
<defs>
  <linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${colors.backgroundStart}"/><stop offset="1" stop-color="${colors.backgroundEnd}"/></linearGradient>
  <linearGradient id="border" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${colors.violet}"/><stop offset="0.48" stop-color="${colors.cyan}"/><stop offset="1" stop-color="${colors.green}"/></linearGradient>
  <linearGradient id="progress" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${colors.cyan}"/><stop offset="1" stop-color="${colors.violet}"/></linearGradient>
  <style>
    .title { font-family: 'Courier New', Consolas, monospace; font-size: 11px; letter-spacing: 2px; fill: ${colors.blue}; opacity: 0.78; }
    .month { font-family: 'Courier New', Consolas, monospace; font-size: 10px; letter-spacing: 1px; }
    .hud { font-family: 'Courier New', Consolas, monospace; font-size: 12px; letter-spacing: 1px; }
    .hud-strong { font-family: 'Courier New', Consolas, monospace; font-size: 12px; font-weight: 700; letter-spacing: 1px; }
    text, tspan { white-space: pre; }
  </style>
</defs>
<rect width="${width}" height="${height}" rx="14" fill="url(#background)"/>
<rect x="2" y="2" width="${width - 4}" height="${height - 4}" rx="12" fill="none" stroke="url(#border)" stroke-width="1.5" opacity="0.6"><animate attributeName="opacity" values="0.4;0.8;0.4" dur="3.4s" repeatCount="indefinite"/></rect>
<text x="${GRID_X}" y="34" class="title">GRID.BREACH / CONTRIBUTION.RAID</text>
<circle cx="${width - 46}" cy="29" r="4" fill="${colors.green}"><animate attributeName="opacity" values="1;0.2;1" dur="1.4s" repeatCount="indefinite"/></circle>
<text x="${width - 38}" y="33" class="title" fill="${colors.green}">LIVE</text>
${buildMonthLabels(cells, colors)}
${cellRects}
${drones}
${bot}
<text x="${GRID_X}" y="${progressY + 12}" class="hud" fill="${colors.muted}">EXFILTRATING <tspan fill="${colors.cyan}" font-weight="700">${nodes.length}</tspan> DATA.NODES</text>
<rect x="${GRID_X + 250}" y="${progressY + 2}" width="${progressWidth}" height="10" rx="5" fill="${colors.emptyCell}"/>
<rect x="${GRID_X + 250}" y="${progressY + 2}" width="0" height="10" rx="5" fill="url(#progress)">
  <animate attributeName="width" from="0" to="${progressWidth}" dur="${SWEEP_SECONDS}s" begin="${SWEEP_BEGIN}s" fill="freeze"/>
</rect>
<g opacity="0">
  <animate attributeName="opacity" from="0" to="1" dur="0.6s" begin="${sweepEnd.toFixed(2)}s" fill="freeze"/>
  <text x="${width - GRID_X}" y="${progressY + 12}" text-anchor="end" class="hud-strong" fill="${colors.green}">BREACH COMPLETE ✓</text>
</g>
<g opacity="1">
  <animate attributeName="opacity" from="1" to="0" dur="0.4s" begin="${sweepEnd.toFixed(2)}s" fill="freeze"/>
  <text x="${width - GRID_X}" y="${progressY + 12}" text-anchor="end" class="hud" fill="${colors.yellow}">FIREWALL EVASION: ACTIVE</text>
</g>
</svg>`;
}

async function main() {
  const cells = await fetchCalendar();
  const nodes = cells.filter((cell) => cell.level > 0).length;

  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(resolve(outputDirectory, "game-dark.svg"), createGameSvg(cells, "dark")),
    writeFile(resolve(outputDirectory, "game-light.svg"), createGameSvg(cells, "light"))
  ]);

  console.log(`Generated GRID.BREACH with ${cells.length} cells (${nodes} contribution nodes) in assets/game/.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
