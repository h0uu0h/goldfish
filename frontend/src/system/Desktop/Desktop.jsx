import { useDesign } from '../Design/DesignContext.jsx';
import { resolveAppIcon } from '../Design/iconThemes.js';
import { useState } from "react";
import Wallpaper from "../Wallpaper/Wallpaper.jsx";
import DesktopIcon from "../DesktopIcon/DesktopIcon.jsx";
import Window from "../Window/Window.jsx";
import ContextMenu from "../ContextMenu/ContextMenu.jsx";
import { useWindowManager } from "../../wm/WindowManager.jsx";
import { useWallpaper } from "../Wallpaper/WallpaperContext.jsx";
import { DESKTOP_ICONS } from "../../config/desktop.js";
import { getApp } from "../../apps/meta.js";
import "./Desktop.css";

const Desktop = () => {
    const { params: { iconTheme } } = useDesign();
    const { windows, openApp } = useWindowManager();
    const { next } = useWallpaper();
    const [selectedId, setSelectedId] = useState(null);
    const [menu, setMenu] = useState(null); // {x, y}

    const handleContextMenu = (event) => {
        // 窗口内部保留浏览器默认右键；只在桌面空白处弹系统菜单
        if (event.target.closest(".os-window")) return;
        event.preventDefault();
        setMenu({ x: event.clientX, y: event.clientY });
    };

    const menuItems = [
        { label: "下一张壁纸", onClick: next },
        { label: "壁纸设置…", onClick: () => openApp("wallpaper") },
        { label: "系统样式…", onClick: () => openApp("paperlab") },
        { divider: true },
        { label: "关于我", onClick: () => openApp("about") },
    ];

    return (
        <div
            className="os-desktop" data-icon-theme={iconTheme}
            onClick={() => {
                setSelectedId(null);
                setMenu(null);
            }}
            onContextMenu={handleContextMenu}>
            <Wallpaper />

            <div className="os-desktop-icons">
                {DESKTOP_ICONS.map((entry) => {
                    const app = getApp(entry.appId);
                    if (!app) return null;
                    return (
                        <DesktopIcon
                            key={entry.appId}
                            icon={resolveAppIcon(app, iconTheme, entry.icon)}
                            label={entry.label ?? app.title}
                            external={Boolean(app.href)}
                            selected={selectedId === entry.appId}
                            // 首次单击选中，已选中后再点即打开（双击同样生效）
                            onSelect={() => (selectedId === entry.appId ? openApp(entry.appId) : setSelectedId(entry.appId))}
                            onOpen={() => openApp(entry.appId)}
                        />
                    );
                })}
            </div>

            {windows.map((win) => (
                <Window key={win.id} win={win} />
            ))}

            {menu && <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />}
        </div>
    );
};

export default Desktop;
