import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBook, validateBook, hitsStroke, strokePath, STORAGE_KEY } from '../src/apps/InkPad/ink.js';
import { boardSvg as exportSvg } from '../src/apps/InkPad/board.js';
const stroke = { id: 'ink', pen: 'fountain', size: 1, color: '#303732', pressure: true, points: [[10, 20, .2], [100, 20, .8], [200, 20, .4]] };
test('new book and saved multi-page drawing survive serialization', () => {
    const { book } = loadBook({ getItem: () => null });
    book.pages[0].strokes = [stroke];
    const restored = loadBook({ getItem: key => { assert.equal(key, STORAGE_KEY); return JSON.stringify(book); } });
    assert.equal(restored.error, '');
    assert.deepEqual(restored.book, book);
    assert.equal(strokePath(restored.book.pages[0].strokes[0]), strokePath(stroke));
});
test('corrupt or inaccessible storage is reported without writing over it', () => {
    for (const getItem of [() => '{broken', () => '{"version":2}', () => { throw new Error('denied'); }]) {
        const result = loadBook({ getItem });
        assert.ok(result.error); assert.equal(result.book.pages.length, 1);
    }
});
test('unsafe stored SVG attributes and nonfinite geometry are rejected', () => {
    const { book } = loadBook({ getItem: () => null });
    for (const changes of [{ color: '" onload="alert(1)' }, { points: [[Infinity, 0, .5]] }, { pen: 'unknown' }]) {
        book.pages[0].strokes = [{ ...stroke, ...changes }];
        assert.throws(() => validateBook(book));
    }
});
test('fast eraser crossing a sparsely sampled stroke hits the segment', () => {
    assert.equal(hitsStroke(stroke, [55, 0], [55, 50], 1), true);
    assert.equal(hitsStroke(stroke, [300, 0], [300, 50], 1), false);
    assert.equal(hitsStroke(stroke, [50, 20], [50, 20], 1), true);
});
test('export includes paper and same ink geometry, including a single dot', () => {
    const dot = { ...stroke, points: [[400, 300, .5]] };
    assert.ok(strokePath(dot).length > 20);
    const svg = exportSvg({ title: '<script>', strokes: [stroke, dot] });
    assert.ok(svg.includes(strokePath(stroke))); assert.ok(svg.includes(strokePath(dot)));
    assert.ok(svg.includes('fill="#faf7ef"')); assert.ok(!svg.includes('<script>'));
});
test('completed stroke reaches the release position without smoothing lag', () => {
    const path = strokePath({ ...stroke, pen: 'fine', pressure: false });
    const xs = [...path.matchAll(/(?:M|L)(-?[\d.]+),/g)].map(m => Number(m[1]));
    assert.ok(Math.max(...xs) >= 199, `stroke ends at ${Math.max(...xs)}`);
});

test('legacy paper pages gain an empty object list and a camera without losing ink', () => {
    const legacy = { version: 1, activeId: 'old', pages: [{ id: 'old', title: '旧画笺', strokes: [stroke] }] };
    const restored = validateBook(legacy);
    assert.deepEqual(restored.pages[0].objects, []);
    assert.deepEqual(restored.pages[0].camera, { x: 0, y: 0, zoom: 1 });
    assert.deepEqual(restored.pages[0].strokes, [stroke]);
});
test('only embedded raster images and safe note colors can enter the notebook', () => {
    const { book } = loadBook({ getItem: () => null });
    const object = { id: 'o', type: 'image', x: -200, y: -100, width: 100, height: 50, src: 'data:image/png;base64,aGVsbG8=' };
    book.pages[0].objects = [object]; assert.doesNotThrow(() => validateBook(book));
    for (const src of ['https://example.com/tracker.png', 'data:image/svg+xml;base64,aGVsbG8=', 'javascript:alert(1)']) {
        book.pages[0].objects = [{ ...object, src }]; assert.throws(() => validateBook(book));
    }
});
