import { HEIGHT, WIDTH, PENS, strokePath } from './ink.js';
export const DEFAULT_CAMERA = { x: 0, y: 0, zoom: 1 };
export const clampZoom = n => Math.max(0.15, Math.min(4, n));
export function screenToWorld(p, camera) { return [(p[0] - camera.x) / camera.zoom, (p[1] - camera.y) / camera.zoom]; }
export function zoomAt(camera, nextZoom, point) {
    const zoom = clampZoom(nextZoom), world = screenToWorld(point, camera);
    return { x: point[0] - world[0] * zoom, y: point[1] - world[1] * zoom, zoom };
}
export function noteLines(text, width = 260) {
    const lines = [];
    for (const paragraph of text.split('\n')) {
        let line = '', length = 0;
        for (const char of paragraph) {
            const advance = char.codePointAt(0) > 255 ? 16 : 9;
            if (length + advance > width - 36 && line) { lines.push(line); line = ''; length = 0; }
            line += char; length += advance;
        }
        lines.push(line);
    }
    return lines;
}
export function objectHeight(object) {
    return object.type === 'note' ? Math.max(150, noteLines(object.text, object.width).length * 24 + 40) : object.height;
}
export function contentBounds(page) {
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    const include = (x, y, w = 0, h = 0) => { left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x + w); bottom = Math.max(bottom, y + h); };
    for (const s of page.strokes) {
        const r = (PENS.find(p => p.id === s.pen)?.size ?? 5) * s.size;
        for (const [x, y] of s.points) include(x - r, y - r, r * 2, r * 2);
    }
    for (const o of page.objects ?? []) include(o.x, o.y, o.width, objectHeight(o));
    if (!Number.isFinite(left)) return { x: 0, y: 0, width: WIDTH, height: HEIGHT };
    return { x: left - 40, y: top - 40, width: right - left + 80, height: bottom - top + 80 };
}
export function fitCamera(page, viewport) {
    const b = contentBounds(page);
    const zoom = clampZoom(Math.min((viewport.width - 100) / b.width, (viewport.height - 160) / b.height, 1.5));
    return { x: (viewport.width - b.width * zoom) / 2 - b.x * zoom, y: (viewport.height - b.height * zoom) / 2 - b.y * zoom, zoom };
}
const escapeXml = s => String(s).replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
export function objectMarkup(o) {
    if (o.type === 'image') return `<image x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}" href="${escapeXml(o.src)}" preserveAspectRatio="none"/>`;
    const lines = noteLines(o.text, o.width);
    return `<rect x="${o.x}" y="${o.y}" width="${o.width}" height="${objectHeight(o)}" rx="2" fill="${o.color}"/><text fill="#34372f" font-family="system-ui, sans-serif" font-size="16">${lines.map((line, i) => `<tspan x="${o.x + 18}" y="${o.y + 32 + i * 24}">${escapeXml(line)}</tspan>`).join('')}</text>`;
}
export function boardSvg(page) {
    const b = contentBounds(page);
    const paths = page.strokes.map(s => `<path d="${strokePath(s)}" fill="${s.color}" opacity="${PENS.find(p => p.id === s.pen).opacity}"/>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(b.width)}" height="${Math.ceil(b.height)}" viewBox="${b.x} ${b.y} ${b.width} ${b.height}"><rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="#faf7ef"/>${(page.objects ?? []).map(objectMarkup).join('')}${paths}</svg>`;
}
