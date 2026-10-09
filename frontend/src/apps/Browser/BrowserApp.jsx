/* eslint-disable react/prop-types */
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, House, Star, Globe, ExternalLink, Plus, X } from 'lucide-react';
import { Button, IconButton, Input } from '../../system/Controls/Controls.jsx';
import { WindowToolbar } from '../../system/Window/WindowToolbar.jsx';
import { useWindowManager } from '../../wm/WindowManager.jsx';
import { START_URL, ABOUT_URL, BOOKMARK_KEY, displayUrl, normalizeUrl, navigateHistory, readBookmarks } from './navigation.js';
import BrowserPage from './BrowserPage.jsx';
import './BrowserApp.css';

let nextTabId = 0;
const createTab = navigation => ({ id: ++nextTabId, navigation, title: navigation?.url === ABOUT_URL ? '关于我 · 侯家祺' : '新标签页' });

export default function BrowserApp({ navigation, windowId }) {
    const [session, setSession] = useState(() => {
        const tab = createTab(navigation);
        return { tabs: [tab], activeId: tab.id };
    });
    useEffect(() => {
        if (navigation) setSession(state => ({ ...state, tabs: state.tabs.map(tab => tab.id === state.activeId ? { ...tab, navigation } : tab) }));
    }, [navigation]);
    const updateTitle = useCallback((id, title) => setSession(state => {
        if (state.tabs.find(tab => tab.id === id)?.title === title) return state;
        return { ...state, tabs: state.tabs.map(tab => tab.id === id ? { ...tab, title } : tab) };
    }), []);
    const activate = id => setSession(state => ({ ...state, activeId: id }));
    const addTab = () => {
        const tab = createTab();
        setSession(state => ({ tabs: [...state.tabs, tab], activeId: tab.id }));
    };
    const closeTab = id => setSession(state => {
        const index = state.tabs.findIndex(tab => tab.id === id);
        const tabs = state.tabs.filter(tab => tab.id !== id);
        if (!tabs.length) { const tab = createTab(); return { tabs: [tab], activeId: tab.id }; }
        return { tabs, activeId: state.activeId === id ? tabs[Math.min(index, tabs.length - 1)].id : state.activeId };
    });
    return <div className="browser-session">
        <WindowToolbar label="浏览器标签页" className="browser-tab-strip">
            <div className="browser-tabs" role="tablist" aria-label="打开的网页" data-window-no-drag onKeyDown={event => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || event.target.getAttribute('role') !== 'tab') return;
                event.preventDefault();
                const index = session.tabs.findIndex(tab => tab.id === session.activeId);
                const next = event.key === 'Home' ? 0 : event.key === 'End' ? session.tabs.length - 1 : (index + (event.key === 'ArrowLeft' ? -1 : 1) + session.tabs.length) % session.tabs.length;
                activate(session.tabs[next].id);
                event.currentTarget.querySelectorAll('[role="tab"]')[next].focus();
            }}>
                {session.tabs.map(tab => <div key={tab.id} className={`browser-tab${session.activeId === tab.id ? ' is-active' : ''}`}>
                    <button role="tab" id={`browser-tab-${tab.id}`} aria-controls={`browser-panel-${tab.id}`} aria-selected={session.activeId === tab.id} tabIndex={session.activeId === tab.id ? 0 : -1} onClick={() => activate(tab.id)}><Globe size={13} /><span>{tab.title}</span></button>
                    <IconButton label={`关闭标签页：${tab.title}`} onClick={() => closeTab(tab.id)}><X /></IconButton>
                </div>)}
            </div>
            <IconButton label="新建标签页" onClick={addTab}><Plus /></IconButton>
        </WindowToolbar>
        {session.tabs.map(tab => <div key={tab.id} id={`browser-panel-${tab.id}`} role="tabpanel" aria-labelledby={`browser-tab-${tab.id}`} hidden={session.activeId !== tab.id} className="browser-tab-panel">
            <BrowserTab navigation={tab.navigation} windowId={windowId} active={session.activeId === tab.id} tabId={tab.id} updateTitle={updateTitle} />
        </div>)}
    </div>;
}

function BrowserTab({ navigation, windowId, active, tabId, updateTitle }) {
    const { setBrowserUrl } = useWindowManager();
    const [history, setHistory] = useState(() => ({ entries: [navigation?.url ?? START_URL], index: 0 }));
    const url = history.entries[history.index];
    useEffect(() => { if (active) setBrowserUrl(windowId, url); }, [active, windowId, url, setBrowserUrl]);
    const [draft, setDraft] = useState(displayUrl(url, window.location.origin));
    const [bookmarks, setBookmarks] = useState(() => readBookmarks(localStorage, window.location.origin));
    useEffect(() => { if (active) setBookmarks(readBookmarks(localStorage, window.location.origin)); }, [active]);
    const [reload, setReload] = useState(0);
    const [notice, setNotice] = useState('');
    const [editingBookmark, setEditingBookmark] = useState(false);
    const [bookmarkTitle, setBookmarkTitle] = useState('');
    const title = url === ABOUT_URL ? '关于我 · 侯家祺' : url === START_URL ? '收藏与起始页' : new URL(url).hostname;
    useEffect(() => { updateTitle(tabId, title); }, [tabId, title, updateTitle]);
    const external = url !== ABOUT_URL && url !== START_URL;
    const saved = bookmarks.some(item => item.url === url);
    const go = next => {
        setHistory(state => navigateHistory(state, next));
        setDraft(displayUrl(next, window.location.origin));
        setNotice('');
        setEditingBookmark(false);
    };
    useEffect(() => {
        if (navigation?.url) {
            setHistory(state => navigateHistory(state, navigation.url));
            setDraft(displayUrl(navigation.url, window.location.origin));
            setEditingBookmark(false);
        }
    }, [navigation]);
    const step = offset => {
        const index = Math.max(0, Math.min(history.entries.length - 1, history.index + offset));
        setHistory({ ...history, index });
        setDraft(displayUrl(history.entries[index], window.location.origin));
        setNotice('');
        setEditingBookmark(false);
    };
    const saveBookmarks = next => {
        setBookmarks(next);
        try { localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next)); setNotice(''); }
        catch { setNotice('浏览器未允许保存，收藏仅在本次打开期间保留。'); }
    };
    const toggleBookmark = () => {
        if (saved) saveBookmarks(bookmarks.filter(item => item.url !== url));
        else { setBookmarkTitle(title); setEditingBookmark(true); }
    };
    return <div className="browser-app">
        <div role="group" aria-label="浏览器导航" className="browser-toolbar">
            <IconButton label="后退" disabled={history.index === 0} onClick={() => step(-1)}><ArrowLeft /></IconButton>
            <IconButton label="前进" disabled={history.index === history.entries.length - 1} onClick={() => step(1)}><ArrowRight /></IconButton>
            <IconButton label="刷新页面" onClick={() => { setReload(n => n + 1); setNotice(''); }}><RotateCw /></IconButton>
            <IconButton label="浏览器主页" onClick={() => go(START_URL)}><House /></IconButton>
            <form className="browser-address" data-window-no-drag onSubmit={event => {
                event.preventDefault();
                try { go(normalizeUrl(draft, window.location.origin)); } catch (error) { setNotice(error.message); }
            }}>
                <Globe size={14} aria-hidden="true" />
                <Input aria-label="网址" value={draft} onChange={event => setDraft(event.target.value)} onFocus={event => event.target.select()} spellCheck={false} />
                <IconButton type="submit" label="前往"><ArrowRight /></IconButton>
            </form>
            <IconButton label={saved ? '取消收藏' : '收藏此页'} aria-pressed={saved} onClick={toggleBookmark}><Star fill={saved ? 'currentColor' : 'none'} /></IconButton>
            <IconButton label="在新标签页打开" href={external ? url : url === ABOUT_URL ? ABOUT_URL : '/browser'} target="_blank" rel="noopener noreferrer"><ExternalLink /></IconButton>
        </div>
        <nav className="browser-bookmarks" aria-label="收藏栏">
            {bookmarks.map(item => <Button appearance="plain" key={item.url} onClick={() => go(item.url)} title={displayUrl(item.url, window.location.origin)}><Star size={12} />{item.title}</Button>)}
            {!bookmarks.length && <span className="browser-muted">点击地址栏星标添加收藏</span>}
        </nav>
        {editingBookmark && <form className="browser-bookmark-editor" onSubmit={event => {
            event.preventDefault();
            if (!bookmarkTitle.trim()) return;
            saveBookmarks([...bookmarks, { url, title: bookmarkTitle.trim() }]);
            setEditingBookmark(false);
        }}><Input aria-label="收藏名称" maxLength={120} required value={bookmarkTitle} onChange={event => setBookmarkTitle(event.target.value)} autoFocus /><Button type="submit">保存收藏</Button><IconButton label="取消添加收藏" onClick={() => setEditingBookmark(false)}><X /></IconButton></form>}
        {notice && <div className="browser-notice" role="status">{notice}</div>}
        <div className="browser-page" key={`${url}:${reload}`}>
            {url === START_URL ? <div className="browser-start os-scroll">
                <Globe size={36} strokeWidth={1.2} />
                <h1>从这里出发</h1><p>常去的地方，收在一起。</p>
                <h2>个人收藏 <span>{bookmarks.length}</span></h2>
                <div className="browser-favorites">{bookmarks.map(item => <Button appearance="plain" key={item.url} onClick={() => go(item.url)}>
                    {item.url === ABOUT_URL ? <img src="/hjq.JPG" alt="" /> : <Globe size={30} />}
                    <strong>{item.title}</strong><span>{item.url === ABOUT_URL ? '作者介绍' : item.url}</span>
                </Button>)}</div>
                {!bookmarks.length && <p>还没有收藏。输入网址，点击星标保存。</p>}
            </div> : <BrowserPage url={url} title={title} external={external} />}
        </div>
    </div>;
}
