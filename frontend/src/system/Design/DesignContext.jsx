/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useWallpaper } from '../Wallpaper/WallpaperContext.jsx';
import { extractWallpaperPalette, FALLBACK_COLOR } from './colors.js';
import { DESIGN_DEFAULTS, DESIGN_STORAGE_KEY, designCssVars, loadDesign, normalizeDesign } from './designTokens.js';
const DesignContext = createContext(null);
export function DesignProvider({ children }) {
    const { current } = useWallpaper();
    const [params, setParams] = useState(loadDesign);
    const [sampling, setSampling] = useState({ src: null, palette: [FALLBACK_COLOR], status: 'loading' });
    useEffect(() => {
        if (!current?.src) return;
        let cancelled = false;
        extractWallpaperPalette(current.src).then(palette => {
            if (!cancelled) setSampling({ src: current.src, palette, status: 'ready' });
        }).catch(() => {
            if (!cancelled) setSampling({ src: current.src, palette: [/^#[\da-f]{6}$/i.test(current.avgColor) ? current.avgColor : FALLBACK_COLOR], status: 'fallback' });
        });
        return () => { cancelled = true; };
    }, [current]);
    const vars = useMemo(() => designCssVars(params, sampling.palette[0]), [params, sampling.palette]);
    useEffect(() => {
        for (const [key, value] of Object.entries(vars)) document.documentElement.style.setProperty(key, value);
        try { localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(params)); } catch { /* session-only */ }
    }, [params, vars]);
    return <DesignContext.Provider value={{ params, vars, palette: sampling.palette,
        status: sampling.src === current?.src ? sampling.status : 'loading',
        update: (key, value) => setParams(p => normalizeDesign({ ...p, [key]: value })),
        chooseColor: accent => setParams(p => normalizeDesign({ ...p, mode: 'manual', accent })),
        reset: () => setParams({ ...DESIGN_DEFAULTS }),
    }}>{children}</DesignContext.Provider>;
}
export const useDesign = () => useContext(DesignContext);
