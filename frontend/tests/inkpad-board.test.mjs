import test from 'node:test';
import assert from 'node:assert/strict';
import { boardSvg, contentBounds, fitCamera, noteLines, objectHeight, screenToWorld, zoomAt } from '../src/apps/InkPad/board.js';
const note = { id: 'note', type: 'note', x: -1400, y: 1200, width: 260, height: 150, text: '纸与墨\n<script>&"', color: '#ede3b6' };
test('zoom keeps the world point beneath the pointer fixed, even outside the old page', () => {
    const camera = { x: -1800, y: 1200, zoom: .4 }, pointer = [315, 204];
    const before = screenToWorld(pointer, camera), next = zoomAt(camera, 2, pointer);
    assert.deepEqual(screenToWorld(pointer, next), before);
    assert.equal(zoomAt(camera, 100, pointer).zoom, 4);
    assert.equal(zoomAt(camera, 0, pointer).zoom, .15);
});
test('bounds include offscreen notes, image edges, and negative-coordinate ink', () => {
    const page = { strokes: [{ id: 's', pen: 'fine', size: 1, color: '#303732', points: [[-2200, -1800, .5]] }], objects: [note, { id: 'img', type: 'image', x: 9000, y: 4000, width: 300, height: 200, src: 'data:image/png;base64,aGVsbG8=' }] };
    const b = contentBounds(page);
    assert.ok(b.x < -2200 && b.y < -1800); assert.ok(b.x + b.width > 9300 && b.y + b.height > 4200);
    const svg = boardSvg(page);
    assert.match(svg, /<image /); assert.match(svg, /&lt;script&gt;&amp;&quot;/); assert.ok(!svg.includes('<script>'));
});
test('note layout and exports expand to contain wrapped multilingual text', () => {
    const long = { ...note, text: '这是可以不断延伸的想法。'.repeat(30) };
    assert.ok(noteLines(long.text, 160).length > noteLines(long.text, 400).length);
    const height = objectHeight(long); assert.ok(height > 150);
    const b = contentBounds({ strokes: [], objects: [long] }); assert.equal(b.height, height + 80);
});
test('fit-content centers normal content in a resized window', () => {
    const page = { strokes: [], objects: [note] }, viewport = { width: 800, height: 600 };
    const c = fitCamera(page, viewport), b = contentBounds(page);
    assert.ok(Math.abs((b.x + b.width / 2) * c.zoom + c.x - 400) < .001);
    assert.ok(Math.abs((b.y + b.height / 2) * c.zoom + c.y - 300) < .001);
});
