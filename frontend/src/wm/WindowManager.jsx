/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { createContext, useContext, useReducer, useMemo, useCallback } from "react";
import { getApp } from "../apps/meta.js";

const WindowManagerContext = createContext(null);

const BASE_Z = 100;
const CASCADE_STEP = 32;

let openCount = 0;

function spawnRect(size = {}) {
    const w = Math.min(size.w ?? 760, window.innerWidth - 48);
    const h = Math.min(size.h ?? 520, window.innerHeight - 110);
    const cascade = (openCount++ % 7) * CASCADE_STEP;
    const x = Math.max(16, (window.innerWidth - w) / 2 + cascade - 3 * CASCADE_STEP);
    const y = Math.max(36, (window.innerHeight - h) / 2.4 + cascade - 2 * CASCADE_STEP);
    return { x: Math.round(x), y: Math.round(y), w, h };
}

function reducer(state, action) {
    switch (action.type) {
        case "OPEN": {
            const { id, appId, props, title } = action;
            const existing = state.windows.find((win) => win.id === id);
            const nextZ = state.nextZ + 1;
            if (existing) {
                return {
                    nextZ,
                    windows: state.windows.map((win) => (win.id === id ? { ...win, props: { ...win.props, ...props }, z: nextZ, minimized: false } : win)),
                };
            }
            const app = getApp(appId);
            const rect = spawnRect(app?.defaultSize);
            return {
                nextZ,
                windows: [
                    ...state.windows,
                    {
                        id,
                        appId,
                        props: props ?? {},
                        title: title ?? app?.title ?? id,
                        ...rect,
                        z: nextZ,
                        minimized: false,
                        maximized: app?.openMaximized ?? false,
                        prevRect: null,
                    },
                ],
            };
        }
        case "CLOSE":
            return { ...state, windows: state.windows.filter((win) => win.id !== action.id) };
        case "FOCUS": {
            const target = state.windows.find((win) => win.id === action.id);
            if (!target || (target.z === state.nextZ && !target.minimized)) return state;
            const nextZ = state.nextZ + 1;
            return {
                nextZ,
                windows: state.windows.map((win) => (win.id === action.id ? { ...win, z: nextZ, minimized: false } : win)),
            };
        }
        case "MINIMIZE":
            return {
                ...state,
                windows: state.windows.map((win) => (win.id === action.id ? { ...win, minimized: true } : win)),
            };
        case "TOGGLE_MAXIMIZE": {
            const nextZ = state.nextZ + 1;
            return {
                nextZ,
                windows: state.windows.map((win) => {
                    if (win.id !== action.id) return win;
                    if (win.maximized) {
                        const prev = win.prevRect ?? spawnRect();
                        return { ...win, ...prev, maximized: false, prevRect: null, z: nextZ };
                    }
                    return { ...win, maximized: true, prevRect: { x: win.x, y: win.y, w: win.w, h: win.h }, z: nextZ };
                }),
            };
        }
        case "SET_BROWSER_URL": {
            if (state.windows.find(win => win.id === action.id)?.browserUrl === action.url) return state;
            return { ...state, windows: state.windows.map(win => win.id === action.id ? { ...win, browserUrl: action.url } : win) };
        }
        case "SET_RECT":
            return {
                ...state,
                windows: state.windows.map((win) => (win.id === action.id ? { ...win, ...action.rect } : win)),
            };
        default:
            return state;
    }
}

export function WindowManagerProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, { windows: [], nextZ: BASE_Z });

    const openApp = useCallback((appId, props = {}, options = {}) => {
        if (appId === "about") {
            appId = "browser";
            props = { ...props, navigation: { url: "/about/" } };
        }
        const app = getApp(appId);
        if (!app) return;
        if (app.href) {
            window.open(app.href, "_blank", "noopener");
            return;
        }
        dispatch({ type: "OPEN", id: options.id ?? appId, appId, props, title: options.title });
    }, []);

    const setBrowserUrl = useCallback((id, url) => dispatch({ type: "SET_BROWSER_URL", id, url }), []);

    const value = useMemo(() => {
        const topWindow = state.windows.reduce((top, win) => (!win.minimized && (!top || win.z > top.z) ? win : top), null);
        return {
            setBrowserUrl,
            windows: state.windows,
            topWindowId: topWindow?.id ?? null,
            openApp,
            close: (id) => dispatch({ type: "CLOSE", id }),
            focus: (id) => dispatch({ type: "FOCUS", id }),
            minimize: (id) => dispatch({ type: "MINIMIZE", id }),
            toggleMaximize: (id) => dispatch({ type: "TOGGLE_MAXIMIZE", id }),
            setRect: (id, rect) => dispatch({ type: "SET_RECT", id, rect }),
        };
    }, [state, openApp, setBrowserUrl]);

    return <WindowManagerContext.Provider value={value}>{children}</WindowManagerContext.Provider>;
}

export function useWindowManager() {
    const ctx = useContext(WindowManagerContext);
    if (!ctx) throw new Error("useWindowManager 必须在 WindowManagerProvider 内使用");
    return ctx;
}
