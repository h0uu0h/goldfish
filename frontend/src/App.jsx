import './system/Desktop/DesktopChrome.css';
import MenuBar from './system/MenuBar/MenuBar.jsx';
import { DesignProvider } from "./system/Design/DesignContext.jsx";
import { useEffect } from "react";
import { WindowManagerProvider, useWindowManager } from "./wm/WindowManager.jsx";
import { WallpaperProvider } from "./system/Wallpaper/WallpaperContext.jsx";
import Desktop from "./system/Desktop/Desktop.jsx";
import Dock from "./system/Dock/Dock.jsx";

// 轻量深链：/work/:slug 与 /about 打开对应窗口；聚焦切换时回写地址栏
const UrlSync = () => {
    const { openApp, topWindowId } = useWindowManager();

    useEffect(() => {
        const path = window.location.pathname;
        const workMatch = path.match(/^\/work\/([^/]+)\/?$/);
        if (workMatch) {
            const slug = decodeURIComponent(workMatch[1]);
            openApp("works");
            fetch("/works/works.json")
                .then((res) => res.json())
                .then((data) => {
                    const work = data.find((item) => item.slug === slug);
                    if (work) openApp("workviewer", { slug }, { id: `work:${slug}`, title: work.title });
                })
                .catch(() => {});
        } else if (path.startsWith("/settings")) {
            openApp("paperlab");
        } else if (path.startsWith("/browser")) {
            openApp("browser");
        } else if (path.startsWith("/about")) {
            openApp("about");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let path = "/";
        if (topWindowId?.startsWith("work:")) path = `/work/${encodeURIComponent(topWindowId.slice(5))}`;
        else if (topWindowId === "browser") path = "/browser";
        else if (topWindowId === "paperlab") path = "/settings";
        if (window.location.pathname !== path) window.history.replaceState(null, "", path);
    }, [topWindowId]);

    return null;
};

function DesktopShell() {
    const { windows, topWindowId } = useWindowManager();
    const immersive = windows.some(win => win.id === topWindowId && win.maximized && !win.minimized);
    return <div className={`os-shell${immersive ? " is-immersive" : ""}`}>
        <UrlSync />
        <div className="os-menu-edge" aria-hidden="true" />
        <MenuBar />
        <Desktop />
        <div className="os-dock-edge" aria-hidden="true" />
        <Dock />
    </div>;
}

function App() {
    return (
        <WallpaperProvider>
            <DesignProvider>
            <WindowManagerProvider>
                <DesktopShell />
            </WindowManagerProvider>
            </DesignProvider>
        </WallpaperProvider>
    );
}

export default App;
