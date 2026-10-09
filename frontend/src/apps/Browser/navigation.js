export const START_URL = 'goldfish://start';
export const ABOUT_URL = '/about/';
export const displayUrl = (url, origin) => url === ABOUT_URL ? new URL(ABOUT_URL, origin).href : url;
export const BOOKMARK_KEY = 'goldfish.browser.bookmarks';
export const DEFAULT_BOOKMARKS = [{ url: ABOUT_URL, title: '关于我 · 侯家祺' }];

export function normalizeUrl(input, origin) {
    const value = input.trim();
    if ([START_URL, ABOUT_URL].includes(value)) return value;
    if (value === '/about' || value === 'goldfish://about') return ABOUT_URL;
    if (!value || /\s/.test(value)) throw new Error('请输入完整网址，例如 https://example.com');
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('仅支持 http 和 https 网址');
    if (url.origin === origin) {
        if (/^\/about\/?$/.test(url.pathname)) return ABOUT_URL;
        throw new Error('这是桌面地址。点击主页可返回浏览器收藏。');
    }
    return url.href;
}

export function navigateHistory(state, url) {
    if (state.entries[state.index] === url) return state;
    return { entries: [...state.entries.slice(0, state.index + 1), url], index: state.index + 1 };
}

export function readBookmarks(storage, origin) {
    try {
        const saved = JSON.parse(storage.getItem(BOOKMARK_KEY));
        if (!Array.isArray(saved)) return [...DEFAULT_BOOKMARKS];
        const seen = new Set();
        return saved.map(item => item?.url === 'goldfish://about' ? { ...item, url: ABOUT_URL } : item).filter(item => {
            try {
                if (!item || typeof item.title !== 'string' || !item.title.trim() || typeof item.url !== 'string') return false;
                if (normalizeUrl(item.url, origin) !== item.url || seen.has(item.url)) return false;
                seen.add(item.url);
                return true;
            } catch { return false; }
        }).map(({ title, url }) => ({ title: title.slice(0, 120), url }));
    } catch { return [...DEFAULT_BOOKMARKS]; }
}
