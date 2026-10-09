/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { INTERVALS, normalizeSettings, nextWallpaper, hydrateFavorites, availableWallpapers, toggleSavedFavorite } from './wallpaperSettings.js';

const WallpaperContext = createContext(null);
const STORAGE_KEY = 'gfos.wallpaper.settings';

function readSettings() {
    let legacyId = null;
    try {
        legacyId = localStorage.getItem('gfos.wallpaper');
        return normalizeSettings(JSON.parse(localStorage.getItem(STORAGE_KEY)), legacyId);
    } catch {
        return normalizeSettings(null, legacyId);
    }
}

export function WallpaperProvider({ children }) {
    const [library, setLibrary] = useState([]);
    const [settings, setSettings] = useState(readSettings);
    const list = useMemo(() => availableWallpapers(library, settings), [library, settings]);
    const [timerVersion, setTimerVersion] = useState(0);
    const current = list.find(wp => wp.id === settings.currentId) ?? list[Math.floor(Date.now() / 86400000) % list.length] ?? null;

    useEffect(() => {
        let cancelled = false;
        fetch('/wallpapers/manifest.json')
            .then(res => res.json())
            .then(data => {
                if (cancelled) return;
                const wallpapers = Array.isArray(data) ? data : [];
                setLibrary(wallpapers);
                setSettings(previous => hydrateFavorites(previous, wallpapers));
            })
            .catch(error => console.error('壁纸清单加载失败:', error));
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); }
        catch { /* 隐私模式下仍可在本次访问中使用 */ }
    }, [settings]);

    useEffect(() => {
        if (!settings.minutes || !list.length || (list.length === 1 && list[0].id === current?.id)) return;
        const delay = settings.minutes * 60000;
        const deadline = Date.now() + delay;
        let advanced = false;
        const advance = () => {
            if (advanced || Date.now() < deadline) return;
            advanced = true;
            setSettings(previous => ({ ...previous, currentId: nextWallpaper(list, current?.id) }));
        };
        const timer = window.setTimeout(advance, delay);
        const resume = () => { if (document.visibilityState === 'visible') advance(); };
        document.addEventListener('visibilitychange', resume);
        window.addEventListener('focus', advance);
        return () => {
            window.clearTimeout(timer);
            document.removeEventListener('visibilitychange', resume);
            window.removeEventListener('focus', advance);
        };
    }, [settings.minutes, list, current?.id, timerVersion]);

    const select = id => {
        setSettings(previous => ({ ...previous, currentId: id }));
        setTimerVersion(version => version + 1);
    };
    const next = () => select(nextWallpaper(list, current?.id));
    const setMinutes = value => {
        const minutes = Number(value);
        if (INTERVALS.includes(minutes)) setSettings(previous => ({ ...previous, minutes }));
    };
    const toggleFavorite = id => {
        const wallpaper = list.find(wp => wp.id === id);
        if (wallpaper) setSettings(previous => toggleSavedFavorite(previous, wallpaper));
    };

    return <WallpaperContext.Provider value={{ list, current, select, next, ...settings, setMinutes, toggleFavorite, rotationCount: list.length }}>{children}</WallpaperContext.Provider>;
}

export function useWallpaper() {
    const ctx = useContext(WallpaperContext);
    if (!ctx) throw new Error('useWallpaper 必须在 WallpaperProvider 内使用');
    return ctx;
}
