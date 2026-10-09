import { useEffect, useRef } from 'react';
import { useDesign } from '../Design/DesignContext.jsx';
import { resolveAppIcon } from '../Design/iconThemes.js';
import { Button } from "../Controls/Controls.jsx";
import { useWindowManager } from "../../wm/WindowManager.jsx";
import { DOCK_APPS } from "../../config/desktop.js";
import { getApp } from "../../apps/meta.js";
import PaperSurface from "../Window/PaperSurface.jsx";
import "./Dock.css";

// Use resting centers: animated widths must not feed back into the hover target.
function useDockMagnification(dockRef, itemKey) {
    useEffect(() => {
        const dock = dockRef.current;
        const items = [...dock.querySelectorAll('.os-dock-item')];
        const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const amounts = items.map(() => 0);
        let pointerX = null;
        let frame = 0;
        let previousTime = 0;

        const animate = time => {
            frame = 0;
            const elapsed = previousTime ? Math.min(time - previousTime, 64) : 16;
            previousTime = time;
            const blend = reducedMotion.matches ? 1 : 1 - Math.exp(-elapsed / 65);
            const totalGrowth = amounts.reduce((sum, amount) => sum + amount * 26, 0);
            let precedingGrowth = 0;
            // Read all geometry before writing styles.
            const targets = items.map((item, index) => {
                const center = item.getBoundingClientRect().left
                    - precedingGrowth + totalGrowth / 2 + 23;
                precedingGrowth += amounts[index] * 26;
                const distance = pointerX === null ? 1 : Math.min(Math.abs(pointerX - center) / 110, 1);
                return (1 + Math.cos(Math.PI * distance)) / 2;
            });
            let unsettled = false;
            items.forEach((item, index) => {
                const next = amounts[index] + (targets[index] - amounts[index]) * blend;
                amounts[index] = Math.abs(targets[index] - next) < 0.0005 ? targets[index] : next;
                unsettled ||= amounts[index] !== targets[index];
                item.style.setProperty('--dock-magnification', amounts[index]);
            });
            if (unsettled) frame = requestAnimationFrame(animate);
            else previousTime = 0;
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(animate);
        };
        const move = event => {
            if (event.pointerType === 'touch' || !finePointer.matches) return;
            pointerX = event.clientX;
            schedule();
        };
        const leave = () => {
            pointerX = null;
            schedule();
        };
        dock.addEventListener('pointermove', move);
        dock.addEventListener('pointerleave', leave);
        dock.addEventListener('pointercancel', leave);
        window.addEventListener('blur', leave);
        window.addEventListener('resize', leave);
        return () => {
            cancelAnimationFrame(frame);
            dock.removeEventListener('pointermove', move);
            dock.removeEventListener('pointerleave', leave);
            dock.removeEventListener('pointercancel', leave);
            window.removeEventListener('blur', leave);
            window.removeEventListener('resize', leave);
            items.forEach(item => item.style.removeProperty('--dock-magnification'));
        };
    }, [dockRef, itemKey]);
}

const Dock = () => {
    const dockRef = useRef(null);
    const { params: { iconTheme } } = useDesign();
    const { windows, openApp, focus } = useWindowManager();

    const pinned = DOCK_APPS.map((appId) => getApp(appId)).filter(Boolean);
    // 未固定在 Dock 但已打开的窗口（如作品详情），动态追加
    const extras = windows.filter((win) => !DOCK_APPS.includes(win.id) && win.appId !== "trash");

    useDockMagnification(dockRef, extras.map(win => win.id).join('|'));

    const windowsOf = (appOrWinId) => windows.filter((win) => win.id === appOrWinId);

    return (
        <footer ref={dockRef} className="os-dock" data-icon-theme={iconTheme}>
            <PaperSurface seed={2718} className="os-dock-paper" />
            {pinned.map((app) => {
                const related = windowsOf(app.id);
                const isOpen = related.length > 0;
                return (
                    <Button appearance="plain"
                        key={app.id}
                        className="os-dock-item"
                        title={app.title}
                        onClick={() => (isOpen ? focus(app.id) : openApp(app.id))}>
                        <img src={resolveAppIcon(app, iconTheme)} alt={app.title} draggable="false" />
                        <span className={`os-dock-dot ${isOpen ? "on" : ""}`} />
                    </Button>
                );
            })}

            {extras.length > 0 && <span className="os-dock-sep" />}

            {extras.map((win) => {
                const app = getApp(win.appId);
                return (
                    <Button appearance="plain" key={win.id} className="os-dock-item" title={win.title} onClick={() => focus(win.id)}>
                        <img src={resolveAppIcon(app, iconTheme)} alt={win.title} draggable="false" />
                        <span className="os-dock-dot on" />
                    </Button>
                );
            })}

            <span className="os-dock-sep" />
            <Button appearance="plain" className="os-dock-item" title="废纸篓" onClick={() => openApp('trash')}>
                <img src={resolveAppIcon(getApp('trash'), iconTheme)} alt="废纸篓" draggable="false" />
            </Button>
        </footer>
    );
};

export default Dock;
