import test from 'node:test';
import assert from 'node:assert/strict';
import { ABOUT_URL, START_URL, normalizeUrl, navigateHistory, readBookmarks, DEFAULT_BOOKMARKS } from '../src/apps/Browser/navigation.js';
const origin = 'http://localhost:5174';
test('addresses resolve author links and reject executable URLs and recursive desktop embeds', () => {
    assert.equal(normalizeUrl('/about', origin), ABOUT_URL);
    assert.equal(normalizeUrl('goldfish://about', origin), ABOUT_URL);
    assert.equal(normalizeUrl(`${origin}/about`, origin), ABOUT_URL);
    assert.equal(normalizeUrl('example.com', origin), 'https://example.com/');
    for (const input of ['javascript:alert(1)', 'data:text/html,hi', `${origin}/browser`, 'https://a:b@example.com', 'not a url']) {
        assert.throws(() => normalizeUrl(input, origin));
    }
});
test('new navigation after going back discards forward entries', () => {
    const state = { entries: [START_URL, ABOUT_URL, 'https://example.com/'], index: 1 };
    assert.deepEqual(navigateHistory(state, 'https://example.org/'), { entries: [START_URL, ABOUT_URL, 'https://example.org/'], index: 2 });
    assert.equal(navigateHistory(state, ABOUT_URL), state);
});
test('bookmarks survive reload, respect an empty list and filter invalid stored links', () => {
    const storage = value => ({ getItem: () => value });
    assert.deepEqual(readBookmarks(storage(null), origin), DEFAULT_BOOKMARKS);
    assert.deepEqual(readBookmarks(storage('[]'), origin), []);
    assert.deepEqual(readBookmarks(storage(JSON.stringify([{ url: 'goldfish://about', title: '旧收藏' }])), origin), [{ url: ABOUT_URL, title: '旧收藏' }]);
    assert.deepEqual(readBookmarks(storage('broken'), origin), DEFAULT_BOOKMARKS);
    assert.deepEqual(readBookmarks(storage(JSON.stringify([{ url: ABOUT_URL, title: '关于我' }, { url: ABOUT_URL, title: '重复' }, { url: 'javascript:alert(1)', title: '无效' }])), origin), [{url: ABOUT_URL, title: '关于我'}]);
});
