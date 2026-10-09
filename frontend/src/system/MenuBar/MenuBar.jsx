import { useEffect, useRef, useState } from 'react';
import { MenuSurface, MenuItem, MenuSeparator } from '../Menu/Menu.jsx';
import { useWindowManager } from '../../wm/WindowManager.jsx';
import './MenuBar.css';

export default function MenuBar() {
    const { windows, topWindowId, openApp, focus, minimize, toggleMaximize, close } = useWindowManager();
    const [now, setNow] = useState(() => new Date());
    const bar = useRef(null);
    const active = windows.find(win => win.id === topWindowId);
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        const dismiss = event => {
            if (event.type === 'keydown' && event.key !== 'Escape') return;
            if (event.type === 'pointerdown' && bar.current?.contains(event.target)) return;
            bar.current?.querySelectorAll('details[open]').forEach(el => { el.open = false; });
        };
        document.addEventListener('pointerdown', dismiss);
        document.addEventListener('keydown', dismiss);
        return () => { clearInterval(timer); document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', dismiss); };
    }, []);
    const run = action => {
        action();
        bar.current?.querySelectorAll('details[open]').forEach(el => { el.open = false; });
    };
    const openMenu = event => {
        if (event.currentTarget.open) bar.current?.querySelectorAll('details[open]').forEach(el => { if (el !== event.currentTarget) el.open = false; });
    };
    return <header className="os-menu-bar" ref={bar}>
        <nav aria-label="系统菜单">
            <details onToggle={openMenu}>
                <summary className="os-menu-brand" aria-label="Goldfish 系统菜单"><img src="/eye2.svg" alt="" draggable="false" /></summary>
                <MenuSurface className="os-menu-dropdown">
                    <MenuItem onClick={() => run(() => openApp('about'))}>关于我</MenuItem>
                    <MenuSeparator />
                    <MenuItem onClick={() => run(() => openApp('paperlab'))}>系统样式…</MenuItem>
                    <MenuItem onClick={() => run(() => openApp('wallpaper'))}>更换壁纸…</MenuItem>
                    <MenuSeparator />
                    <MenuItem onClick={() => run(() => openApp('trash'))}>打开废纸篓</MenuItem>
                </MenuSurface>
            </details>
            <span className="os-menu-current" title={active?.title ?? '桌面'}>{active?.title ?? '桌面'}</span>
            <details onToggle={openMenu}>
                <summary>窗口</summary>
                <MenuSurface className="os-menu-dropdown">
                    <MenuItem disabled={!active} onClick={() => run(() => minimize(active.id))}>最小化当前窗口</MenuItem>
                    <MenuItem disabled={!active} onClick={() => run(() => toggleMaximize(active.id))}>{active?.maximized ? '还原当前窗口' : '最大化当前窗口'}</MenuItem>
                    <MenuItem disabled={!active} onClick={() => run(() => close(active.id))}>关闭当前窗口</MenuItem>
                    {windows.length > 0 && <MenuSeparator />}
                    {windows.map(win => <MenuItem key={win.id} onClick={() => run(() => focus(win.id))}><span aria-hidden="true">{win.id === topWindowId ? '✓ ' : ''}</span>{win.title}{win.minimized ? '（已最小化）' : ''}</MenuItem>)}
                </MenuSurface>
            </details>
        </nav>
        <time className="os-menu-clock" dateTime={now.toISOString()} title={now.toLocaleString('zh-CN')}>
            <span className="os-menu-date">{now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}</span>
            <span>{now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
        </time>
    </header>;
}
