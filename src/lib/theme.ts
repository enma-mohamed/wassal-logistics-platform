export interface ThemeTokens {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  accent: string;
  accentLight: string;
  borderFocus: string;
}

function clamp(value: number, min = 0, max = 255) {
  return Math.max(min, Math.min(max, value));
}

function normalizeHex(hex: string) {
  const cleaned = hex.trim().replace("#", "");
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    return cleaned
      .split("")
      .map((part) => part + part)
      .join("")
      .toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return cleaned.toLowerCase();
  }
  return null;
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel)).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function shadeHexColor(hex: string, percent: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = 1 + percent / 100;
  return rgbToHex(
    rgb.r * factor,
    rgb.g * factor,
    rgb.b * factor
  );
}

export function tintHexColor(hex: string, percent: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const mix = percent / 100;
  return rgbToHex(
    rgb.r + (255 - rgb.r) * mix,
    rgb.g + (255 - rgb.g) * mix,
    rgb.b + (255 - rgb.b) * mix
  );
}

export function createThemeTokens(primaryColor: string): ThemeTokens {
  const safePrimary = normalizeHex(primaryColor) ? `#${normalizeHex(primaryColor)}` : "#1e3a8a";
  const accent = tintHexColor(safePrimary, 8);

  return {
    primary: safePrimary,
    primaryHover: shadeHexColor(safePrimary, -12),
    primaryLight: `rgba(${hexToRgb(safePrimary)?.r ?? 30}, ${hexToRgb(safePrimary)?.g ?? 58}, ${hexToRgb(safePrimary)?.b ?? 138}, 0.12)`,
    accent,
    accentLight: `rgba(${hexToRgb(accent)?.r ?? 59}, ${hexToRgb(accent)?.g ?? 130}, ${hexToRgb(accent)?.b ?? 246}, 0.15)`,
    borderFocus: safePrimary,
  };
}

export function isValidHexColor(value: string) {
  return normalizeHex(value) !== null;
}

