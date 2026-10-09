import test from 'node:test';
import assert from 'node:assert/strict';
import { paletteFromPixels, themeColors, contrast, fromHex, FALLBACK_COLOR } from '../src/system/Design/colors.js';
import { normalizeDesign, designCssVars, DENSITY_OPTIONS, spacingScale, horizontalSpacingScale } from '../src/system/Design/designTokens.js';
import { PAPER_DEFAULTS, paperCssVars, normalizePaperParams } from '../src/system/paperMaterial.js';

test('wallpaper extraction ranks a chromatic region above a similarly sized neutral one', () => {
    const pixels = new Uint8ClampedArray([
        ...Array.from({ length: 40 }, () => [190, 55, 30, 255]).flat(),
        ...Array.from({ length: 60 }, () => [170, 170, 170, 255]).flat(),
    ]);
    assert.equal(paletteFromPixels(pixels)[0], '#be371e');
    assert.equal(paletteFromPixels(pixels).length, 2);
    assert.deepEqual(paletteFromPixels(new Uint8ClampedArray([255, 0, 0, 0])), [FALLBACK_COLOR]);
});

test('light, saturated and neutral sources produce readable semantic colors', () => {
    for (const hex of ['#ffffff', '#eeeeee', '#ffff00', '#00ff00', '#ff00ff', '#cc3007', '#000000', '#526c73']) {
        const theme = themeColors(hex);
        assert.ok(contrast(fromHex(theme.accent), [255, 255, 255]) >= 4.5, hex);
        assert.ok(contrast(fromHex(theme.ink), fromHex(theme.paper)) >= 7, hex);
        assert.ok(contrast(fromHex(theme.muted), fromHex(theme.paper)) >= 4.5, hex);
    }
});

test('manual color is stable across wallpaper changes; automatic color follows wallpaper', () => {
    assert.equal(designCssVars({ mode: 'manual', accent: '#cc3007' }, '#ffff00')['--os-accent'], '#cc3007');
    assert.notEqual(designCssVars({ mode: 'wallpaper' }, '#cc3007')['--os-accent'], designCssVars({ mode: 'wallpaper' }, '#526c73')['--os-accent']);
});

test('stored settings cannot inject CSS and values remain within usable ranges', () => {
    const p = normalizeDesign({ radius: 1000, spacing: -20, fontSize: 'bad', accent: 'red;display:none', font: 'url(evil)' });
    assert.equal(p.radius, 16); assert.equal(p.densityY, 'dense'); assert.equal(p.fontSize, 12);
    assert.equal(p.font, 'system'); assert.equal(p.accent, '#a8b3b8');
    assert.equal(normalizeDesign(null).fontSize, 12);
});

test('default material matches the supplied CSS, including formation seed and alpha', () => {
    const vars = paperCssVars(PAPER_DEFAULTS);
    assert.equal(vars['--paper-rgb'], '255, 254, 253');
    assert.equal(vars['--paper-alpha'], '0.63');
    assert.equal(vars['--paper-blur'], '14px');
    assert.equal(vars['--paper-saturate'], '0.7');
    assert.equal(vars['--paper-shader-fiber'], '0.38');
    assert.equal(vars['--paper-shader-roughness'], '0.3');
    assert.equal(vars['--paper-shader-fiber-size'], '0.3');
    assert.equal(vars['--paper-shader-contrast'], '0.48');
    assert.equal(vars['--paper-shader-fade'], '0.28');
    assert.equal(vars['--paper-shader-drops'], '0.025');
    assert.equal(vars['--paper-edge-color'], 'rgba(54, 55, 50, 0.026)');
    assert.match(decodeURIComponent(vars['--paper-formation-img']), /seed='705'/);
    assert.match(decodeURIComponent(vars['--paper-formation-img']), /0\.185/);
    assert.equal(normalizePaperParams({ alpha: 0.9, fiber: 0.7 }).fiber, 0.7);
});


test('vertical density spacing descends by layer and grows monotonically by preset', () => {
    let previous = null;
    for (const { value } of DENSITY_OPTIONS) {
        const scale = spacingScale(value);
        const levels = Object.values(scale);
        for (let i = 1; i < levels.length; i++) {
            assert.ok(levels[i] < levels[i - 1]);
            assert.ok(Math.abs(levels[i] - levels[i - 1] / 2) <= 0.5);
        }
        if (previous) levels.forEach((n, i) => assert.ok(n >= previous[i]));
        previous = levels;
        for (const fontSize of [12, 18]) {
            const vars = designCssVars({ density: value, fontSize });
            assert.ok(parseInt(vars['--os-control-h']) >= 24);
        }
    }
    assert.deepEqual(spacingScale('dense'), { panel: 8, group: 4, row: 2, control: 1 });
});

test('legacy spacing migrates without overwriting other settings or a selected density', () => {
    const old = normalizeDesign({ spacing: 3, fontSize: 12, radius: 12, border: 0.16 });
    assert.equal(old.densityY, 'dense');
    assert.equal(old.fontSize, 12);
    assert.equal(old.radius, 12);
    assert.equal(old.border, 0.16);
    assert.equal(normalizeDesign({ density: 'relaxed', spacing: 3 }).densityY, 'relaxed');
    assert.equal(normalizeDesign({ spacing: 4 }).densityY, 'standard');
    assert.equal(normalizeDesign({ density: 'unknown' }).densityY, 'dense');
    assert.deepEqual(normalizeDesign(old), old);
});


test('horizontal and vertical spacing vary independently and persist through normalization', () => {
    const base = { densityX: 'relaxed', densityY: 'compact', fontSize: 12, radius: 12 };
    const initial = designCssVars(base);
    const narrow = designCssVars({ ...base, densityX: 'dense' });
    const tall = designCssVars({ ...base, densityY: 'relaxed' });
    for (const level of ['panel', 'group', 'row', 'control']) {
        assert.equal(initial[`--os-space-${level}-y`], narrow[`--os-space-${level}-y`]);
        assert.equal(initial[`--os-space-${level}-x`], tall[`--os-space-${level}-x`]);
    }
    assert.equal(initial['--os-control-h'], narrow['--os-control-h']);
    assert.equal(initial['--os-titlebar-h'], narrow['--os-titlebar-h']);
    assert.equal(initial['--os-space-row-x'], '8px');
    assert.equal(initial['--os-space-row-y'], '3px');
    const saved = normalizeDesign(base);
    assert.deepEqual(normalizeDesign(saved), saved);
    assert.equal(saved.radius, 12);
    const migrated = normalizeDesign({ density: 'compact', fontSize: 12 });
    assert.equal(migrated.densityX, 'compact');
    assert.equal(migrated.densityY, 'compact');
    assert.equal(normalizeDesign({ density: 'dense', densityY: 'relaxed' }).densityY, 'relaxed');
});


test('horizontal density compresses outer layers while protecting control padding', () => {
    const expected = [
        ['relaxed', [12, 8, 4]],
        ['standard', [10, 6, 4]],
        ['compact', [8, 6, 4]],
        ['dense', [2, 2, 2]],
    ];
    for (const [densityX, values] of expected) {
        const { panel, row, control } = horizontalSpacingScale(densityX);
        assert.deepEqual([panel, row, control], values);
        assert.ok(panel >= row && row >= control && control >= 2);
        const vars = designCssVars({ densityX });
        assert.equal(vars['--os-space-control-x'], `${control}px`);
    }
    assert.equal(horizontalSpacingScale('relaxed').control, horizontalSpacingScale('compact').control);
});


test('accent text stays legible on gray paper without changing the selected color', () => {
    for (const hex of ['#706658', '#ffffff', '#eeeeee', '#808080', '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#000000']) {
        const theme = themeColors(hex);
        assert.ok(contrast(fromHex(theme.accentText), [224, 224, 224]) >= 7, hex);
        assert.equal(normalizeDesign({ mode: 'manual', accent: hex }).accent, hex);
        assert.equal(designCssVars({ mode: 'manual', accent: hex })['--os-accent-text'], theme.accentText);
    }
    const neutral = fromHex(themeColors('#808080').accentText);
    assert.equal(neutral[0], neutral[1]);
    assert.equal(neutral[1], neutral[2]);
    const brown = fromHex(themeColors('#706658').accentText);
    assert.ok(brown[0] > brown[1] && brown[1] > brown[2]);
});
