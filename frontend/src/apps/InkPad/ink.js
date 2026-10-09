import { getStroke } from 'perfect-freehand';

export const STORAGE_KEY = 'gfos.inkpad.v1';
export const WIDTH = 1000;
export const HEIGHT = 700;
export const PENS = [
    { id: 'fine', label: '细墨笔', size: 2.8, thinning: 0.12, opacity: 0.94 },
    { id: 'fountain', label: '钢笔', size: 5, thinning: 0.65, opacity: 0.96 },
    { id: 'marker', label: '标记笔', size: 22, thinning: 0, opacity: 0.26 },
];
export const COLORS = [
    { value: '#303732', label: '松墨' }, { value: '#36596f', label: '蓝墨' },
    { value: '#a44d3f', label: '朱砂' }, { value: '#ba9444', label: '赭黄' },
];
export function newPage(index = 1) {
    return { id: crypto.randomUUID(), title: `画笺 ${index}`, strokes: [], objects: [], camera: { x: 0, y: 0, zoom: 1 }, updatedAt: Date.now() };
}
export function strokePath(stroke) {
    const pen = PENS.find(p => p.id === stroke.pen) ?? PENS[0];
    const outline = getStroke(stroke.points, { size: pen.size * stroke.size, thinning: pen.thinning,
        smoothing: 0.6, streamline: 0.4, last: true, simulatePressure: !stroke.pressure,
        start: { taper: 0 }, end: { taper: pen.id === 'fountain' ? pen.size * 1.5 : 0 } });
    return outline.length ? `M${outline.map(p => p.map(n => n.toFixed(2)).join(',')).join('L')}Z` : '';
}
export function validateBook(book) {
    if (book?.version !== 1 || !Array.isArray(book.pages) || !book.pages.length || !book.pages.some(p => p.id === book.activeId)) throw new Error('Invalid notebook');
    for (const page of book.pages) {
        if (typeof page.id !== 'string' || typeof page.title !== 'string' || !Array.isArray(page.strokes)) throw new Error('Invalid page');
        page.objects ??= [];
        page.camera ??= { x: 0, y: 0, zoom: 1 };
        if (!Array.isArray(page.objects) || ![page.camera.x, page.camera.y, page.camera.zoom].every(Number.isFinite) || page.camera.zoom < .15 || page.camera.zoom > 4) throw new Error('Invalid canvas');
        for (const o of page.objects) {
            if (typeof o.id !== 'string' || ![o.x, o.y, o.width, o.height].every(Number.isFinite) || o.width < 1 || o.height < 1) throw new Error('Invalid object');
            if (o.type === 'image') { if (!/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(o.src)) throw new Error('Invalid image'); }
            else if (o.type === 'note') { if (typeof o.text !== 'string' || !/^#[\da-f]{6}$/i.test(o.color)) throw new Error('Invalid note'); }
            else throw new Error('Unknown object');
        }
        for (const s of page.strokes) {
            if (typeof s.id !== 'string' || !PENS.some(p => p.id === s.pen) || !/^#[\da-f]{6}$/i.test(s.color) || !Number.isFinite(s.size) || s.size <= 0 || s.size > 10 || !Array.isArray(s.points) || !s.points.length || !s.points.every(p => Array.isArray(p) && p.length === 3 && p.every(Number.isFinite))) throw new Error('Invalid stroke');
        }
    }
    return book;
}
export function loadBook(storage) {
    try {
        const raw = storage.getItem(STORAGE_KEY);
        if (raw) return { book: validateBook(JSON.parse(raw)), error: '' };
        const page = newPage();
        return { book: { version: 1, activeId: page.id, pages: [page] }, error: '' };
    } catch {
        const page = newPage();
        return { book: { version: 1, activeId: page.id, pages: [page] }, error: '无法读取原有画笺，已保留原数据。当前内容请先导出。' };
    }
}
export function hitsStroke(stroke, a, b, radius = 12) {
    const pen = PENS.find(p => p.id === stroke.pen);
    const r = radius + pen.size * stroke.size / 2;
    const distance = (p, u, v) => {
        const dx = v[0] - u[0], dy = v[1] - u[1];
        const t = Math.max(0, Math.min(1, ((p[0] - u[0]) * dx + (p[1] - u[1]) * dy) / (dx * dx + dy * dy || 1)));
        return Math.hypot(p[0] - u[0] - t * dx, p[1] - u[1] - t * dy);
    };
    const cross = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    return stroke.points.some((p, i, points) => {
        const q = points[Math.max(0, i - 1)];
        const intersects = cross(a, b, p) * cross(a, b, q) < 0 && cross(p, q, a) * cross(p, q, b) < 0;
        return intersects || Math.min(distance(p, a, b), distance(q, a, b), distance(a, p, q), distance(b, p, q)) <= r;
    });
}
