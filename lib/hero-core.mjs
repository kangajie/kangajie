// Shared core for the kangajie animated cyber console hero.
// Used by scripts/generate-hero.mjs. No external dependencies.

export const USERNAME = "kangajie";

// 5x5 pixel font for the ASCII logo.
const GLYPHS = {
  K: ["#...#", "#..#.", "###..", "#..#.", "#...#"],
  A: [".###.", "#...#", "#####", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#"],
  G: [".####", "#....", "#.###", "#...#", ".###."],
  J: ["..###", "...#.", "...#.", "#..#.", ".##.."],
  I: ["#####", "..#..", "..#..", "..#..", "#####"],
  E: ["#####", "#....", "####.", "#....", "#####"],
  " ": [".....", ".....", ".....", ".....", "....."]
};

function renderWordLines(word) {
  const rows = ["", "", "", "", ""];
  for (const letter of word) {
    const glyph = GLYPHS[letter];
    for (let row = 0; row < 5; row += 1) {
      rows[row] += glyph[row].replaceAll("#", "██").replaceAll(".", "  ") + "  ";
    }
  }
  return rows;
}

const LOGO_LINES = [...renderWordLines("KANG"), "", ...renderWordLines("AJIE")];

function truncate(value, maxLength) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

export async function fetchBuildLog() {
  const headers = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "kangajie-profile-hero"
  };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(
      `https://api.github.com/users/${USERNAME}/repos?sort=pushed&per_page=20`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status} ${response.statusText}`);
    }

    const repos = await response.json();
    const picked = repos
      .filter((repo) => !repo.fork && repo.name.toLowerCase() !== USERNAME)
      .slice(0, 3)
      .map((repo) => ({
        type: "row",
        key: truncate(repo.name, 21),
        value: truncate(repo.description || repo.language || "Active project", 28)
      }));

    if (picked.length) return picked;
  } catch (error) {
    console.warn(`BUILD.LOG fallback used: ${error.message}`);
  }

  // Offline / rate-limit fallback so the hero can always be generated.
  return [
    { type: "row", key: "KangAjie AI", value: "AI chat assistant" },
    { type: "row", key: "Portfolio", value: "kangajiedev site" },
    { type: "row", key: "RaspiTunnel", value: "Self-hosted tunneling" }
  ];
}

export function buildProfileLines(buildLog) {
  return [
    { type: "header", value: "kangajie@dev" },
    { type: "row", key: "Subject", value: "Kang Ajie" },
    { type: "row", key: "Role", value: "Fullstack Developer" },
    { type: "row", key: "Base", value: "Indonesia" },
    { type: "row", key: "Status", value: "Building / Learning / Shipping" },
    { type: "blank" },
    { type: "section", value: "STACK.NODE" },
    { type: "row", key: "Frontend", value: "React / Next.js / TypeScript" },
    { type: "row", key: "Backend", value: "Node.js / Laravel / Python" },
    { type: "row", key: "Mobile", value: "Flutter / Kotlin" },
    { type: "row", key: "Database", value: "MySQL / PostgreSQL" },
    { type: "blank" },
    { type: "section", value: "BUILD.LOG" },
    ...buildLog,
    { type: "blank" },
    { type: "section", value: "GRID.LINKS" },
    { type: "row", key: "GitHub", value: "@kangajie" },
    { type: "footer", value: "signal.locked > FULLSTACK / WEB / MOBILE" }
  ];
}

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
    red: "#F87171",
    scanBlend: "screen"
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
    red: "#DC2626",
    scanBlend: "multiply"
  }
};

const layouts = {
  desktop: {
    width: 1180,
    height: 610,
    outerRadius: 18,
    titlebar: { x: 3, y: 3, width: 1174, height: 34, radius: 16 },
    visualPanel: { x: 14, y: 64, width: 488, height: 468, radius: 14 },
    infoPanel: { x: 508, y: 48, width: 655, height: 500, radius: 14 },
    visualTitle: { x: 30, y: 62 },
    infoTitle: { x: 524, y: 62 },
    logo: { x: 258, y: 200, lineHeight: 17, fontSize: 15 },
    tagline: { x: 258, y: 452, fontSize: 13 },
    panelClip: { x: 24, y: 82, width: 470, height: 438, radius: 12 },
    rainColumns: 13,
    system: { x: 528, y: 82, width: 620, lineHeight: 21.5, fontSize: 14 },
    footerY: 585
  },
  mobile: {
    width: 720,
    height: 1080,
    outerRadius: 22,
    titlebar: { x: 20, y: 20, width: 680, height: 42, radius: 14 },
    visualPanel: { x: 48, y: 94, width: 624, height: 350, radius: 14 },
    infoPanel: { x: 48, y: 470, width: 624, height: 526, radius: 14 },
    visualTitle: { x: 66, y: 116 },
    infoTitle: { x: 66, y: 492 },
    logo: { x: 360, y: 205, lineHeight: 14.5, fontSize: 12.5 },
    tagline: { x: 360, y: 412, fontSize: 12 },
    panelClip: { x: 58, y: 122, width: 604, height: 312, radius: 12 },
    rainColumns: 12,
    system: { x: 72, y: 520, width: 574, lineHeight: 21, fontSize: 13 },
    footerY: 1045
  }
};

// Deterministic pseudo-random generator so builds are reproducible.
function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildRainLayer(layout, colors) {
  const clip = layout.panelClip;
  const random = createRandom(20260717);
  const characters = "01<>/{}[];=+*#$_";
  const columns = [];

  for (let column = 0; column < layout.rainColumns; column += 1) {
    const x = clip.x + 14 + (column * (clip.width - 28)) / (layout.rainColumns - 1);
    const glyphCount = 7 + Math.floor(random() * 6);
    const startY = clip.y + 10 + random() * 40;
    const gap = 18 + random() * 8;
    const duration = (5 + random() * 6).toFixed(1);
    const begin = (random() * 6).toFixed(1);
    const color = [colors.cyan, colors.blue, colors.violet, colors.green][Math.floor(random() * 4)];
    const glyphs = [];

    for (let glyph = 0; glyph < glyphCount; glyph += 1) {
      const character = characters[Math.floor(random() * characters.length)];
      const opacity = (0.06 + random() * 0.16).toFixed(2);
      glyphs.push(
        `<text x="${x.toFixed(1)}" y="${(startY + glyph * gap).toFixed(1)}" class="rain" fill="${color}" opacity="${opacity}">${escapeXml(character)}</text>`
      );
    }

    columns.push(
      `<g><animateTransform attributeName="transform" type="translate" from="0 -30" to="0 ${clip.height + 30}" dur="${duration}s" begin="-${begin}s" repeatCount="indefinite"/>${glyphs.join("")}</g>`
    );
  }

  return `<g clip-path="url(#panel-clip)" aria-hidden="true">${columns.join("\n")}</g>`;
}

function buildLogoLayer(layout, colors) {
  const logo = layout.logo;
  const rows = LOGO_LINES.map((line, index) => {
    if (!line) return "";
    return `<tspan x="${logo.x}" y="${(logo.y + index * logo.lineHeight).toFixed(1)}" text-anchor="middle" xml:space="preserve">${escapeXml(line)}</tspan>`;
  }).join("\n");

  return `<g clip-path="url(#panel-clip)" mask="url(#logo-reveal)">
  <text class="logo" fill="url(#ascii-signal)">${rows}</text>
  <text x="${layout.tagline.x}" y="${layout.tagline.y}" text-anchor="middle" class="tagline" fill="${colors.muted}">&lt; FULLSTACK DEVELOPER /&gt;</text>
</g>`;
}

function buildAmbientLayer(layout, colors) {
  const clip = layout.panelClip;
  const centerX = clip.x + clip.width / 2;
  const centerY = clip.y + clip.height * 0.45;
  const orbitWidth = clip.width * 0.88;
  const orbitHeight = clip.height * 0.6;
  const left = clip.x + 30;
  const right = clip.x + clip.width - 30;
  const top = clip.y + 40;
  const bottom = clip.y + clip.height - 36;

  return `<g clip-path="url(#panel-clip)" aria-hidden="true">
  <rect x="${clip.x}" y="${clip.y}" width="${clip.width}" height="${clip.height}" fill="url(#panel-grid)"/>
  <ellipse cx="${centerX.toFixed(1)}" cy="${centerY.toFixed(1)}" rx="${(orbitWidth * 0.54).toFixed(1)}" ry="${(orbitHeight * 0.54).toFixed(1)}" fill="url(#panel-halo)"/>
  <ellipse cx="${centerX.toFixed(1)}" cy="${centerY.toFixed(1)}" rx="${(orbitWidth * 0.5).toFixed(1)}" ry="${(orbitHeight * 0.5).toFixed(1)}" fill="none" stroke="${colors.blue}" stroke-width="1" stroke-dasharray="3 14" opacity="0.13">
    <animateTransform attributeName="transform" type="rotate" from="0 ${centerX.toFixed(1)} ${centerY.toFixed(1)}" to="360 ${centerX.toFixed(1)} ${centerY.toFixed(1)}" dur="42s" repeatCount="indefinite"/>
  </ellipse>
  <ellipse cx="${centerX.toFixed(1)}" cy="${centerY.toFixed(1)}" rx="${(orbitWidth * 0.4).toFixed(1)}" ry="${(orbitHeight * 0.38).toFixed(1)}" fill="none" stroke="${colors.violet}" stroke-width="1" stroke-dasharray="28 24" opacity="0.1">
    <animateTransform attributeName="transform" type="rotate" from="360 ${centerX.toFixed(1)} ${centerY.toFixed(1)}" to="0 ${centerX.toFixed(1)} ${centerY.toFixed(1)}" dur="34s" repeatCount="indefinite"/>
  </ellipse>
  <path d="M ${left} ${top} H ${left + 46} M ${left} ${top} V ${top + 46} M ${right} ${bottom} H ${right - 46} M ${right} ${bottom} V ${bottom - 46}" fill="none" stroke="${colors.cyan}" stroke-width="1.2" opacity="0.25"/>
  <g fill="${colors.cyan}">
    <circle cx="${left}" cy="${top}" r="2.2" opacity="0.42"><animate attributeName="opacity" values="0.2;0.58;0.2" dur="5.6s" repeatCount="indefinite"/></circle>
    <circle cx="${right}" cy="${bottom}" r="2.2" opacity="0.42"><animate attributeName="opacity" values="0.58;0.2;0.58" dur="6.4s" repeatCount="indefinite"/></circle>
  </g>
</g>`;
}

function buildSystemLayer({ x, y, width, lineHeight, fontSize }, colors, profileLines) {
  const clips = [];
  const rows = [];

  profileLines.forEach((line, index) => {
    if (line.type === "blank") return;

    const id = `system-line-${index}`;
    const lineY = y + index * lineHeight;
    const begin = (0.68 + index * 0.105).toFixed(2);

    clips.push(
      `<clipPath id="${id}"><rect x="${x - 3}" y="${(lineY - fontSize - 2).toFixed(2)}" width="0" height="${fontSize + 8}"><animate attributeName="width" from="0" to="${width}" dur="0.36s" begin="${begin}s" fill="freeze"/></rect></clipPath>`
    );

    if (line.type === "header") {
      rows.push(`<g clip-path="url(#${id})"><text x="${x}" y="${lineY}" class="system-head"><tspan fill="${colors.violet}">${escapeXml(line.value)}</tspan><tspan fill="${colors.muted}"> ------------------------------------------</tspan></text></g>`);
      return;
    }

    if (line.type === "section") {
      rows.push(`<g clip-path="url(#${id})"><text x="${x}" y="${lineY}" class="system-section" fill="${colors.green}">- ${escapeXml(line.value)} -----------------------------------</text></g>`);
      return;
    }

    if (line.type === "footer") {
      rows.push(`<g clip-path="url(#${id})"><text x="${x}" y="${lineY}" class="system-footer" fill="${colors.blue}">${escapeXml(line.value)}</text></g>`);
      return;
    }

    const dots = ".".repeat(Math.max(3, 14 - line.key.length));
    rows.push(
      `<g clip-path="url(#${id})"><text x="${x}" y="${lineY}" class="system-row"><tspan fill="${colors.muted}">. </tspan><tspan class="system-key" fill="${colors.cyan}">${escapeXml(line.key)}</tspan><tspan fill="${colors.muted}">: ${dots} </tspan><tspan fill="${colors.primary}">${escapeXml(line.value)}</tspan></text></g>`
    );
  });

  return { clips: clips.join("\n"), rows: rows.join("\n") };
}

export function createHeroSvg(mode, size, profileLines) {
  const colors = palettes[mode];
  const layout = layouts[size];
  const titlebar = layout.titlebar;
  const visual = layout.visualPanel;
  const info = layout.infoPanel;
  const clip = layout.panelClip;
  const ambient = buildAmbientLayer(layout, colors);
  const rain = buildRainLayer(layout, colors);
  const logo = buildLogoLayer(layout, colors);
  const system = buildSystemLayer(layout.system, colors, profileLines);
  const isDesktop = size === "desktop";
  const titleCenter = titlebar.x + titlebar.width / 2;
  const liveX = titlebar.x + titlebar.width - (isDesktop ? 138 : 94);
  const cursorY = layout.system.y + (profileLines.length - 1) * layout.system.lineHeight - 15;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-labelledby="title description">
<title id="title">Kang Ajie - Fullstack Developer</title>
<desc id="description">An animated cyber console with a KANG AJIE ASCII logo, tech stack, featured builds, and profile links.</desc>
<defs>
  <linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${colors.backgroundStart}"/><stop offset="1" stop-color="${colors.backgroundEnd}"/></linearGradient>
  <linearGradient id="ascii-signal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${colors.cyan}"><animate attributeName="stop-color" values="${colors.cyan};${colors.violet};${colors.blue};${colors.cyan}" dur="9s" repeatCount="indefinite"/></stop><stop offset="1" stop-color="${colors.violet}"><animate attributeName="stop-color" values="${colors.violet};${colors.blue};${colors.cyan};${colors.violet}" dur="9s" repeatCount="indefinite"/></stop></linearGradient>
  <linearGradient id="border" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${colors.violet}"/><stop offset="0.48" stop-color="${colors.cyan}"/><stop offset="1" stop-color="${colors.green}"/></linearGradient>
  <linearGradient id="scan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${colors.cyan}" stop-opacity="0"/><stop offset="0.5" stop-color="${colors.cyan}" stop-opacity="0.46"/><stop offset="1" stop-color="${colors.violet}" stop-opacity="0"/></linearGradient>
  <radialGradient id="panel-halo"><stop offset="0" stop-color="${colors.cyan}" stop-opacity="0.12"/><stop offset="0.48" stop-color="${colors.blue}" stop-opacity="0.055"/><stop offset="1" stop-color="${colors.violet}" stop-opacity="0"/></radialGradient>
  <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="${colors.cyan}" opacity="0.052"/></pattern>
  <pattern id="panel-grid" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M 44 0 H 0 V 44" fill="none" stroke="${colors.blue}" stroke-width="0.65" opacity="0.085"/><circle cx="0" cy="0" r="1.2" fill="${colors.cyan}" opacity="0.13"/></pattern>
  <clipPath id="panel-clip"><rect x="${clip.x}" y="${clip.y}" width="${clip.width}" height="${clip.height}" rx="${clip.radius}"/></clipPath>
  <mask id="logo-reveal"><rect x="${clip.x}" y="${clip.y}" width="${clip.width}" height="0" rx="${clip.radius}" fill="white"><animate attributeName="height" from="0" to="${clip.height}" dur="2.1s" begin="0.12s" fill="freeze"/></rect></mask>
  ${system.clips}
  <style>
    .mono { font-family: 'Courier New', Consolas, monospace; }
    .logo { font-family: 'Courier New', Consolas, monospace; font-size: ${layout.logo.fontSize}px; font-weight: 700; letter-spacing: -2px; }
    .tagline { font-family: 'Courier New', Consolas, monospace; font-size: ${layout.tagline.fontSize}px; letter-spacing: 3px; }
    .rain { font-family: 'Courier New', Consolas, monospace; font-size: 12px; }
    .panel-title { font-family: 'Courier New', Consolas, monospace; font-size: ${isDesktop ? 11 : 12}px; letter-spacing: 2px; fill: ${colors.blue}; opacity: 0.78; }
    .terminal-label { font-family: 'Courier New', Consolas, monospace; font-size: ${isDesktop ? 12 : 11}px; letter-spacing: 0.5px; fill: ${colors.muted}; }
    .live-label { font-family: 'Courier New', Consolas, monospace; font-size: ${isDesktop ? 10 : 9}px; letter-spacing: 1px; fill: ${colors.red}; }
    .system-head { font-family: 'Courier New', Consolas, monospace; font-size: ${layout.system.fontSize + 2}px; font-weight: 700; }
    .system-section, .system-footer, .system-row { font-family: 'Courier New', Consolas, monospace; font-size: ${layout.system.fontSize}px; }
    .system-section, .system-key { font-weight: 700; }
    text, tspan { white-space: pre; }
  </style>
</defs>
<rect width="${layout.width}" height="${layout.height}" rx="${layout.outerRadius}" fill="url(#background)"/>
<rect width="${layout.width}" height="${layout.height}" rx="${layout.outerRadius}" fill="url(#scanlines)"/>
<rect x="${titlebar.x}" y="${titlebar.y}" width="${titlebar.width}" height="${titlebar.height}" rx="${titlebar.radius}" fill="${colors.panel}" fill-opacity="0.84"/>
<circle cx="${titlebar.x + 21}" cy="${titlebar.y + titlebar.height / 2}" r="5" fill="#EF4444"><animate attributeName="opacity" values="1;0.55;1" dur="4s" repeatCount="indefinite"/></circle>
<circle cx="${titlebar.x + 39}" cy="${titlebar.y + titlebar.height / 2}" r="5" fill="#F59E0B"><animate attributeName="opacity" values="1;0.55;1" dur="4s" begin="0.3s" repeatCount="indefinite"/></circle>
<circle cx="${titlebar.x + 57}" cy="${titlebar.y + titlebar.height / 2}" r="5" fill="${colors.green}"><animate attributeName="opacity" values="1;0.55;1" dur="4s" begin="0.6s" repeatCount="indefinite"/></circle>
<text x="${titleCenter}" y="${titlebar.y + titlebar.height / 2 + 5}" text-anchor="middle" class="terminal-label">kangajie@dev ~ % ./profile --live</text>
${isDesktop ? `<circle cx="${liveX}" cy="${titlebar.y + titlebar.height / 2}" r="4" fill="${colors.red}"><animate attributeName="opacity" values="1;0.15;1" dur="1.1s" repeatCount="indefinite"/></circle><text x="${liveX + 10}" y="${titlebar.y + titlebar.height / 2 + 4}" class="live-label">ONLINE</text>` : ""}
<rect x="${visual.x}" y="${visual.y}" width="${visual.width}" height="${visual.height}" rx="${visual.radius}" fill="${colors.panel}" fill-opacity="0.38" stroke="url(#border)" stroke-opacity="0.42"/>
<rect x="${info.x}" y="${info.y}" width="${info.width}" height="${info.height}" rx="${info.radius}" fill="${colors.panel}" fill-opacity="0.42" stroke="url(#border)" stroke-opacity="0.42"/>
<text x="${layout.visualTitle.x}" y="${layout.visualTitle.y}" class="panel-title">VISUAL.MAP / LOGO.SIGNAL</text>
<text x="${layout.infoTitle.x}" y="${layout.infoTitle.y}" class="panel-title">SYSTEM.INFO / FULLSTACK.DEV</text>
${ambient}
${rain}
${logo}
${system.rows}
<rect x="${layout.system.x + 2}" y="${cursorY}" width="9" height="${layout.system.fontSize + 2}" fill="${colors.cyan}" opacity="0"><animate attributeName="opacity" values="0;0;1;0;1;0;1;0" keyTimes="0;0.03;0.06;0.32;0.5;0.68;0.84;1" dur="1.4s" begin="3.3s" repeatCount="indefinite"/></rect>
<text x="${layout.width / 2}" y="${layout.footerY}" text-anchor="middle" class="mono" font-size="10" letter-spacing="1.5" fill="${colors.muted}">WEB / MOBILE / FULLSTACK ENGINEERING</text>
<rect x="0" y="-70" width="${layout.width}" height="70" fill="url(#scan)" opacity="0.72" style="mix-blend-mode:${colors.scanBlend}"><animateTransform attributeName="transform" type="translate" from="0 -70" to="0 ${layout.height + 70}" dur="4.5s" repeatCount="indefinite"/></rect>
<rect x="3" y="3" width="${layout.width - 6}" height="${layout.height - 6}" rx="${layout.outerRadius - 2}" fill="none" stroke="url(#border)" stroke-width="2" opacity="0.76"><animate attributeName="opacity" values="0.5;0.94;0.5" dur="3.4s" repeatCount="indefinite"/></rect>
</svg>`;
}

export async function createLiveHeroSvg(mode, size) {
  const buildLog = await fetchBuildLog();
  const profileLines = buildProfileLines(buildLog);
  return createHeroSvg(mode, size, profileLines);
}
