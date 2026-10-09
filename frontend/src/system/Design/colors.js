// Small, deterministic RGB histogram. Weight chromatic clusters without discarding neutrals.
export const FALLBACK_COLOR = '#586b64';
export const toHex = (rgb) => `#${rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
export const fromHex = (hex) => /^#[\da-f]{6}$/i.test(hex) ? [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) : [88, 107, 100];
export const mix = (a, b, amount) => a.map((v, i) => Math.round(v * (1 - amount) + b[i] * amount));
export function luminance(rgb) {
    const linear = rgb.map(v => v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
export function contrast(a, b) {
    const x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export function paletteFromPixels(pixels) {
    const buckets = new Map();
    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] < 128) continue;
        const rgb = [pixels[i], pixels[i + 1], pixels[i + 2]];
        const key = rgb.map(v => v >> 5).join(',');
        const bucket = buckets.get(key) ?? { count: 0, sums: [0, 0, 0] };
        bucket.count++;
        rgb.forEach((v, j) => bucket.sums[j] += v);
        buckets.set(key, bucket);
    }
    const ranked = [...buckets.values()].map(({ count, sums }) => {
        const rgb = sums.map(v => v / count);
        const saturation = (Math.max(...rgb) - Math.min(...rgb)) / 255;
        const light = luminance(rgb);
        return { rgb, score: count * (0.25 + saturation * 2) * (light < 0.015 || light > 0.9 ? 0.15 : 1) };
    }).sort((a, b) => b.score - a.score);
    const chosen = [];
    for (const { rgb } of ranked) {
        if (chosen.every(other => Math.hypot(...rgb.map((v, i) => v - other[i])) > 65)) chosen.push(rgb);
        if (chosen.length === 5) break;
    }
    return chosen.length ? chosen.map(toHex) : [FALLBACK_COLOR];
}
export function themeColors(hex) {
    const source = fromHex(hex);
    let accent = source;
    // White button labels must retain >= 4.5:1 contrast, even for pale wallpapers.
    for (let i = 0; contrast(accent, [255, 255, 255]) < 4.5 && i < 100; i++) accent = mix(accent, [0, 0, 0], 0.04);
    // Text sits on translucent paper, so give it more contrast than a solid fill.
    // Expand chroma around the RGB midpoint; neutral colors remain neutral.
    const midpoint = (Math.max(...source) + Math.min(...source)) / 2;
    let accentText = source.map(value => Math.round(Math.max(0, Math.min(255, midpoint + (value - midpoint) * 1.3))));
    for (let i = 0; contrast(accentText, [224, 224, 224]) < 7 && i < 100; i++) accentText = mix(accentText, [0, 0, 0], 0.04);
    return {
        accent: toHex(accent), hover: toHex(mix(accent, [0, 0, 0], 0.15)),
        accentText: toHex(accentText),
        soft: toHex(mix(source, [255, 255, 255], 0.9)),
        ink: toHex(mix(source, [15, 18, 17], 0.9)),
        muted: toHex(mix(source, [65, 68, 66], 0.9)),
        paper: toHex(mix(source, [255, 255, 255], 0.98)),
    };
}

const cache = new Map();
export function extractWallpaperPalette(src) {
    if (cache.has(src)) return Promise.resolve(cache.get(src));
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const timer = setTimeout(() => reject(new Error('Wallpaper sampling timed out')), 10000);
        img.onload = () => {
            clearTimeout(timer);
            try {
                const canvas = document.createElement('canvas');
                canvas.width = canvas.height = 64;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(img, 0, 0, 64, 64);
                const palette = paletteFromPixels(ctx.getImageData(0, 0, 64, 64).data);
                cache.set(src, palette);
                resolve(palette);
            } catch (error) { reject(error); }
        };
        img.onerror = () => { clearTimeout(timer); reject(new Error('Wallpaper unavailable')); };
        img.src = src;
    });
}
