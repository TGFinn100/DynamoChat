export interface ThemeColors {
  bg: string;
  text: string;
  accent: string;
}

export interface ThemeDefinition {
  name: string;
  light: ThemeColors;
  dark: ThemeColors;
}

export const PRESET_THEMES: ThemeDefinition[] = [
  {
    name: "Blue",
    light: { bg: "#f7f8fa", text: "#1c1f26", accent: "#3b82f6" },
    dark: { bg: "#14161a", text: "#e5e7eb", accent: "#60a5fa" },
  },
  {
    name: "Forest",
    light: { bg: "#f4f9f5", text: "#16241b", accent: "#2e9e5b" },
    dark: { bg: "#10170f", text: "#dff0e4", accent: "#4ade80" },
  },
  {
    name: "Ember",
    light: { bg: "#fbf6f3", text: "#2a1a12", accent: "#e0622f" },
    dark: { bg: "#1a1210", text: "#f3e6df", accent: "#ff8a5c" },
  },
  {
    name: "Violet",
    light: { bg: "#f8f6fb", text: "#211a2c", accent: "#7c5cff" },
    dark: { bg: "#15121c", text: "#ece7f5", accent: "#a78bfa" },
  },
  // Colors eyeballed from the game's official key art (dark SWAT operator
  // silhouette against a near-black background with dramatic red lighting/
  // haze, white logo text) - approximate, not sampled with a color picker.
  // Auto-applied when Ready or Not is detected running - see
  // useAutoGameTheme.ts and overlayGameChannel.ts's themeName field.
  {
    name: "Ready or Not",
    light: { bg: "#f2ece6", text: "#171010", accent: "#a8112a" },
    dark: { bg: "#100a09", text: "#f2ece6", accent: "#d1263f" },
  },
];

const CUSTOM_THEMES_KEY = "ron-voice:custom-themes";
const ACTIVE_THEME_KEY = "ron-voice:active-theme";
const AUTO_THEME_SWITCH_KEY = "ron-voice:auto-theme-switch";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const value = parseInt(clean, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return (
    "#" +
    [r, g, b]
      .map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0"))
      .join("")
  );
}

function mix(hexA: string, hexB: string, ratio: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return rgbToHex([
    a[0] + (b[0] - a[0]) * ratio,
    a[1] + (b[1] - a[1]) * ratio,
    a[2] + (b[2] - a[2]) * ratio,
  ]);
}

function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface DerivedColors extends ThemeColors {
  surface: string;
  border: string;
  muted: string;
  accentBg: string;
}

function derive(colors: ThemeColors): DerivedColors {
  return {
    ...colors,
    surface: mix(colors.bg, colors.text, 0.06),
    border: mix(colors.bg, colors.text, 0.2),
    muted: mix(colors.text, colors.bg, 0.35),
    accentBg: hexToRgba(colors.accent, 0.12),
  };
}

export function applyTheme(theme: ThemeDefinition): void {
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const colors = derive(isDark ? theme.dark : theme.light);
  const root = document.documentElement.style;
  root.setProperty("--bg", colors.bg);
  root.setProperty("--text", colors.text);
  root.setProperty("--muted", colors.muted);
  root.setProperty("--border", colors.border);
  root.setProperty("--surface", colors.surface);
  root.setProperty("--accent", colors.accent);
  root.setProperty("--accent-bg", colors.accentBg);
}

export function getCustomThemes(): ThemeDefinition[] {
  try {
    const raw = localStorage.getItem(CUSTOM_THEMES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ThemeDefinition[];
  } catch {
    return [];
  }
}

export function saveCustomTheme(theme: ThemeDefinition): void {
  const existing = getCustomThemes().filter((t) => t.name !== theme.name);
  localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify([...existing, theme]));
}

export function deleteCustomTheme(name: string): void {
  const remaining = getCustomThemes().filter((t) => t.name !== name);
  localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(remaining));
}

export function getAllThemes(): ThemeDefinition[] {
  return [...PRESET_THEMES, ...getCustomThemes()];
}

export function isPresetTheme(name: string): boolean {
  return PRESET_THEMES.some((t) => t.name === name);
}

export function getActiveThemeName(): string {
  return localStorage.getItem(ACTIVE_THEME_KEY) ?? PRESET_THEMES[0].name;
}

export function setActiveThemeName(name: string): void {
  localStorage.setItem(ACTIVE_THEME_KEY, name);
}

export function getActiveTheme(): ThemeDefinition {
  const name = getActiveThemeName();
  return getAllThemes().find((t) => t.name === name) ?? PRESET_THEMES[0];
}

// Off by default - never silently change the app's look without the user
// opting in first.
export function getAutoThemeSwitchEnabled(): boolean {
  return localStorage.getItem(AUTO_THEME_SWITCH_KEY) === "true";
}

export function setAutoThemeSwitchEnabled(enabled: boolean): void {
  localStorage.setItem(AUTO_THEME_SWITCH_KEY, String(enabled));
}
