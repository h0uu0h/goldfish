import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSettings, nextWallpaper, hydrateFavorites, availableWallpapers, toggleSavedFavorite } from '../src/system/Wallpaper/wallpaperSettings.js';

const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
test('migrates fixed selections and defaults new visitors to five minutes', () => {
    assert.equal(normalizeSettings(null).minutes, 5);
    assert.deepEqual(normalizeSettings(null, 'b'), { currentId: 'b', minutes: 0, favorites: [], favoriteWallpapers: [] });
    assert.equal(normalizeSettings({ currentId: 'a', minutes: 15 }, 'b').minutes, 15);
});
test('rejects malformed intervals and favorite entries', () => {
    const result = normalizeSettings({ minutes: -1, favorites: ['a', null, 'a', 12, 'b'] });
    assert.equal(result.minutes, 5);
    assert.deepEqual(result.favorites, ['a', 'b']);
});
test('drops the retired favorites-only setting while preserving favorites and interval', () => {
    const settings = normalizeSettings({ currentId: 'a', minutes: 15, favorites: ['b'], favoritesOnly: true });
    assert.deepEqual(settings, { currentId: 'a', minutes: 15, favorites: ['b'], favoriteWallpapers: [] });
    assert.deepEqual(availableWallpapers(list, settings), list);
    assert.equal(nextWallpaper([], 'a'), 'a');
});
test('rotation wraps and enters the selected pool from an outside wallpaper', () => {
    assert.equal(nextWallpaper(list, 'c'), 'a');
    assert.equal(nextWallpaper([{ id: 'b' }], 'a'), 'b');
    assert.equal(nextWallpaper([{ id: 'b' }], 'b'), 'b');
});

const archived = { id: 'old', src: 'https://example.com/old.jpg', thumb: 'https://example.com/thumb.jpg', photographer: 'Artist', pexelsUrl: 'https://example.com/photo', avgColor: '#123456' };
test('saved favorites survive replacement of the entire library and a storage roundtrip', () => {
    const saved = toggleSavedFavorite(normalizeSettings(null), archived);
    const restored = normalizeSettings(JSON.parse(JSON.stringify(saved)));
    const available = availableWallpapers(list, restored);
    assert.deepEqual(available.at(-1), archived);
    assert.deepEqual(availableWallpapers([], restored), [archived]);
});
test('legacy IDs are hydrated without discarding snapshots or unresolved IDs', () => {
    const legacy = normalizeSettings({ favorites: ['old', 'missing'] });
    const migrated = hydrateFavorites(legacy, [archived]);
    assert.deepEqual(migrated.favoriteWallpapers, [archived]);
    assert.deepEqual(migrated.favorites, ['old', 'missing']);
    assert.equal(hydrateFavorites(migrated, []), migrated);
    assert.equal(hydrateFavorites(migrated, [{ ...archived, src: 'changed' }]), migrated);
});
test('deduplicates current library and removes saved copy when unfavorited', () => {
    const saved = toggleSavedFavorite(normalizeSettings(null), archived);
    assert.equal(availableWallpapers([archived], saved).length, 1);
    const removed = toggleSavedFavorite(saved, archived);
    assert.deepEqual(removed.favoriteWallpapers, []);
    assert.deepEqual(availableWallpapers(list, removed), list);
});
test('rejects broken or unreferenced saved entries', () => {
    const settings = normalizeSettings({ favorites: ['old'], favoriteWallpapers: [null, {}, { id: 'old' }, archived, archived, { id: 'other', src: 'other' }] });
    assert.deepEqual(settings.favoriteWallpapers, [archived]);
});
