import { ICON_THEMES } from './iconThemes.js';
import { FALLBACK_COLOR, fromHex, themeColors } from './colors.js';
export const DESIGN_STORAGE_KEY = 'goldfish.design';
export const FONT_OPTIONS = [
    { value: 'system', label: '系统无衬线', family: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", sans-serif' },
    { value: 'serif', label: '衬线 · 宋体', family: '"Songti SC", "Noto Serif CJK SC", Georgia, serif' },
    { value: 'mono', label: '等宽字体', family: '"SFMono-Regular", Menlo, "PingFang SC", monospace' },
];
// Vertical spacing keeps its density scale. Horizontal spacing protects inner padding.
export const DENSITY_OPTIONS = [
    { value: 'dense', label: '极紧凑', outer: 8 },
    { value: 'compact', label: '紧凑', outer: 12 },
    { value: 'standard', label: '标准', outer: 16 },
    { value: 'relaxed', label: '宽松', outer: 24 },
];
export function spacingScale(density) {
    const { outer } = DENSITY_OPTIONS.find(option => option.value === density) ?? DENSITY_OPTIONS[2];
    const [panel, group, row, control] = [0, 1, 2, 3].map(depth => Math.max(1, Math.round(outer / 2 ** depth)));
    return { panel, group, row, control };
}
// Horizontal compression starts at the outside; normal presets keep 4px inside controls.
const HORIZONTAL_SPACING = {
    dense: [2, 2, 2],
    compact: [8, 6, 4],
    standard: [10, 6, 4],
    relaxed: [12, 8, 4],
};
export function horizontalSpacingScale(density) {
    const [panel, row, control] = HORIZONTAL_SPACING[density] ?? HORIZONTAL_SPACING.standard;
    return { panel, group: row, row, control };
}
export const DESIGN_DEFAULTS = { iconTheme: 'haiku', mode: 'manual', accent: '#a8b3b8', font: 'system', fontSize: 12, densityX: 'compact', densityY: 'dense', radius: 12, border: 0.16 };
export function normalizeDesign(value) {
    const p = value && typeof value === 'object' ? value : {};
    const next = { ...DESIGN_DEFAULTS };
    for (const [key, min, max] of [['fontSize', 12, 18], ['radius', 0, 16], ['border', 0.08, 0.4]]) {
        const n = Number(p[key] ?? next[key]);
        if (Number.isFinite(n)) next[key] = Math.max(min, Math.min(max, n));
    }
    if (DENSITY_OPTIONS.some(option => option.value === p.densityX)) next.densityX = p.densityX;
    if (DENSITY_OPTIONS.some(option => option.value === p.densityY)) next.densityY = p.densityY;
    else if (DENSITY_OPTIONS.some(option => option.value === p.density)) next.densityY = p.density;
    else if (p.densityY == null && p.density == null && p.spacing != null && Number.isFinite(Number(p.spacing))) {
        // Old spacing=3 was already the user's tightest choice; migrate it to the new minimum.
        const old = Number(p.spacing);
        next.densityY = old <= 3 ? 'dense' : old < 4 ? 'compact' : old <= 4 ? 'standard' : 'relaxed';
    }
    if (ICON_THEMES.some(option => option.value === p.iconTheme)) next.iconTheme = p.iconTheme;
    if (p.mode === 'manual' || p.mode === 'wallpaper') next.mode = p.mode;
    if (/^#[\da-f]{6}$/i.test(p.accent)) next.accent = p.accent;
    if (FONT_OPTIONS.some(f => f.value === p.font)) next.font = p.font;
    return next;
}
export function loadDesign() {
    try { return normalizeDesign(JSON.parse(localStorage.getItem(DESIGN_STORAGE_KEY))); }
    catch { return { ...DESIGN_DEFAULTS }; }
}
export function designCssVars(value, wallpaperColor = FALLBACK_COLOR) {
    const p = normalizeDesign(value);
    const space = spacingScale(p.densityY);
    const horizontal = horizontalSpacingScale(p.densityX);
    const colors = themeColors(p.mode === 'wallpaper' ? wallpaperColor : p.accent);
    return {
        '--os-accent': colors.accent, '--os-accent-hover': colors.hover, '--os-accent-soft': colors.soft,
        '--os-accent-text': colors.accentText,
        '--os-on-accent': '#ffffff', '--os-ink': colors.ink, '--os-muted': colors.muted,
        '--os-paper': colors.paper, '--os-paper-dim': colors.soft,
        '--os-line': `rgba(${fromHex(colors.ink).join(', ')}, ${p.border})`,
        '--os-line-soft': `rgba(${fromHex(colors.ink).join(', ')}, ${p.border * 0.65})`,
        '--os-font': FONT_OPTIONS.find(f => f.value === p.font).family,
        '--os-font-size': `${p.fontSize}px`, '--os-font-sm': `${p.fontSize - 2}px`,
        '--os-font-lg': `${p.fontSize + 8}px`,
        ...Object.fromEntries(Object.entries(space).map(([level, value]) => [`--os-space-${level}-y`, `${value}px`])),
        ...Object.fromEntries(Object.entries(horizontal).map(([level, value]) => [`--os-space-${level}-x`, `${value}px`])),
        '--os-space-panel': `${space.panel}px`, '--os-space-group': `${space.group}px`,
        '--os-space-row': `${space.row}px`, '--os-space-control': `${space.control}px`,
        // Compatibility aliases for older consumers; all values now come from the hierarchy.
        '--os-space': `${space.control}px`, '--os-space-2': `${space.row}px`,
        '--os-space-3': `${space.group}px`, '--os-space-4': `${space.panel}px`,
        '--os-space-6': `${space.panel + space.group}px`,
        '--os-radius': `${p.radius}px`, '--os-control-radius': `${p.radius}px`,
        '--os-control-h': `${Math.max(24, Math.ceil(p.fontSize * 1.3) + space.control * 2 + 2)}px`,
        '--os-titlebar-h': `${Math.max(28, p.fontSize + space.row * 2 + 10)}px`,
    };
}
