import { Button } from "../Controls/Controls.jsx";
/* eslint-disable react/prop-types */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useWindowManager } from "../../wm/WindowManager.jsx";
import { getAppComponent } from "../../apps/registry.jsx";
import { PAPER_MOTION_EVENT } from "../paperMaterial.js";
import { WindowToolbarContext } from "./WindowToolbarContext.js";
import PaperSurface from "./PaperSurface.jsx";
import "./Window.css";

const MIN_W = 340;
const MIN_H = 240;
const RESIZE_EDGES = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

const between = (min, max) => min + Math.random() * (max - min);
const isWindowControl = target => target.closest("button, input, label, select, textarea, a, [role=option], [data-window-no-drag]");

// 开合只改变运动；纸张身份在窗口的整个生命周期内保持稳定。
function createPaperMotion(cycle = 0) {
    const direction = Math.random() > 0.5 ? 1 : -1;
    const duration = Math.round(between(340, 460));
    return {
        cycle,
        duration,
        style: {
            "--paper-open-duration": `${duration}ms`,
            "--paper-open-x": `${(between(6, 20) * direction).toFixed(1)}px`,
            "--paper-open-y": `${between(6, 18).toFixed(1)}px`,
        },
    };
}

const Window = ({ win }) => {
    const { focus, close, minimize, toggleMaximize, setRect, topWindowId } = useWindowManager();
    const frameRef = useRef(null);
    const [toolbarHost, setToolbarHost] = useState(null);
    const maximizedRef = useRef(win.maximized);
    const minimizedRef = useRef(win.minimized);
    const cycleRef = useRef(0);
    const closingRef = useRef(null);
    const [paperMotion, setPaperMotion] = useState(() => createPaperMotion());
    const [paperIdentity] = useState(() => ({
        seed: between(1, 9999),
        style: {
            "--paper-texture-x": `${between(-280, 40).toFixed(0)}px`,
            "--paper-texture-y": `${between(-220, 40).toFixed(0)}px`,
        },
    }));
    const [closingAction, setClosingAction] = useState(null);
    const focused = topWindowId === win.id;

    const replayPaperMotion = useCallback(() => {
        if (closingRef.current) return;
        cycleRef.current += 1;
        setPaperMotion(createPaperMotion(cycleRef.current));
    }, []);

    const beginPaperClose = (action) => {
        if (closingRef.current) return;
        closingRef.current = action;
        cycleRef.current += 1;
        setPaperMotion(createPaperMotion(cycleRef.current));
        setClosingAction(action);
    };

    const finishPaperClose = (event) => {
        if (event.target !== event.currentTarget || !closingAction) return;
        const action = closingAction;
        closingRef.current = null;
        setClosingAction(null);
        if (action === "close") close(win.id);
        else minimize(win.id);
    };

    useEffect(() => {
        window.addEventListener(PAPER_MOTION_EVENT, replayPaperMotion);
        return () => window.removeEventListener(PAPER_MOTION_EVENT, replayPaperMotion);
    }, [replayPaperMotion]);

    useEffect(() => {
        if (minimizedRef.current && !win.minimized) replayPaperMotion();
        minimizedRef.current = win.minimized;
        // 只响应最小化状态边沿；动画参数每次都会重新生成。
    }, [win.minimized, replayPaperMotion]);

    useLayoutEffect(() => {
        if (maximizedRef.current === win.maximized) return;
        maximizedRef.current = win.maximized;
        const frame = frameRef.current;
        frame.classList.add("is-maximizing");
        const timer = window.setTimeout(() => frame.classList.remove("is-maximizing"), 380);
        return () => {
            window.clearTimeout(timer);
            frame.classList.remove("is-maximizing");
        };
    }, [win.maximized]);

    // 拖拽期间直接改 DOM（transform / 尺寸），松手后一次性提交回 reducer
    const startDrag = (event) => {
        if (win.maximized || event.button !== 0 || isWindowControl(event.target)) return;
        event.preventDefault();
        const frame = frameRef.current;
        const startX = event.clientX;
        const startY = event.clientY;
        let dx = 0;
        let dy = 0;
        let frameRequest = 0;

        frame.classList.add("is-dragging");

        const onMove = (ev) => {
            dx = ev.clientX - startX;
            dy = Math.max(28 - win.y, ev.clientY - startY);
            if (frameRequest) return;
            frameRequest = window.requestAnimationFrame(() => {
                frameRequest = 0;
                frame.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
            });
        };
        const onUp = () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
            if (frameRequest) window.cancelAnimationFrame(frameRequest);
            frame.classList.remove("is-dragging");
            frame.style.transform = "";
            const x = Math.min(Math.max(win.x + dx, 72 - win.w), window.innerWidth - 72);
            const y = Math.min(Math.max(win.y + dy, 28), window.innerHeight - 48);
            setRect(win.id, { x, y });
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
    };

    const startResize = (edge) => (event) => {
        if (win.maximized || event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        const frame = frameRef.current;
        const startX = event.clientX;
        const startY = event.clientY;
        const start = { x: win.x, y: win.y, w: win.w, h: win.h };
        let rect = { ...start };
        let frameRequest = 0;

        frame.classList.add("is-resizing");

        const onMove = (ev) => {
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;
            rect = { ...start };
            if (edge.includes("e")) rect.w = Math.max(MIN_W, start.w + dx);
            if (edge.includes("s")) rect.h = Math.max(MIN_H, start.h + dy);
            if (edge.includes("w")) {
                rect.w = Math.max(MIN_W, start.w - dx);
                rect.x = start.x + start.w - rect.w;
            }
            if (edge.includes("n")) {
                rect.h = Math.min(start.y + start.h - 28, Math.max(MIN_H, start.h - dy));
                rect.y = start.y + start.h - rect.h;
            }
            if (frameRequest) return;
            frameRequest = window.requestAnimationFrame(() => {
                frameRequest = 0;
                frame.style.left = `${rect.x}px`;
                frame.style.top = `${rect.y}px`;
                frame.style.width = `${rect.w}px`;
                frame.style.height = `${rect.h}px`;
            });
        };
        const onUp = () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
            if (frameRequest) window.cancelAnimationFrame(frameRequest);
            frame.classList.remove("is-resizing");
            setRect(win.id, rect);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
    };

    const maximizeFromToolbar = event => {
        if (!isWindowControl(event.target)) toggleMaximize(win.id);
    };

    const AppContent = getAppComponent(win.appId);

    const frameStyle = win.maximized
        ? { left: 0, top: 0, width: "100%", height: "100%", zIndex: win.z, ...paperMotion.style }
        : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z, ...paperMotion.style };

    return (
        <section
            ref={frameRef}
            aria-label={win.title}
            className={`os-window ${focused ? "focused" : ""} ${win.maximized ? "maximized" : ""} paper-phase-${closingAction ? "close" : "open"} paper-cycle-${paperMotion.cycle % 2 ? "b" : "a"}`}
            style={{ ...frameStyle, ...paperIdentity.style }}
            hidden={win.minimized}
            onAnimationEnd={finishPaperClose}
            onPointerDown={() => focus(win.id)}>
            <PaperSurface seed={paperIdentity.seed} />
            <header className="os-window-titlebar" onPointerDown={startDrag} onDoubleClick={maximizeFromToolbar}>
                <div className="os-window-controls">
                    <Button appearance="plain" className="os-window-btn os-tl-close" title="关闭" onClick={() => beginPaperClose("close")}>
                        <svg viewBox="0 0 10 10"><line x1="2.4" y1="2.4" x2="7.6" y2="7.6" /><line x1="7.6" y1="2.4" x2="2.4" y2="7.6" /></svg>
                    </Button>
                    <Button appearance="plain" className="os-window-btn os-tl-min" title="最小化" onClick={() => beginPaperClose("minimize")}>
                        <svg viewBox="0 0 10 10"><line x1="2" y1="5" x2="8" y2="5" /></svg>
                    </Button>
                    <Button appearance="plain" className="os-window-btn os-tl-max" title={win.maximized ? "还原" : "最大化"} onClick={() => toggleMaximize(win.id)}>
                        <svg viewBox="0 0 10 10"><line x1="5" y1="2" x2="5" y2="8" /><line x1="2" y1="5" x2="8" y2="5" /></svg>
                    </Button>
                </div>
                <div className="os-window-toolbar-host" ref={setToolbarHost} />
            </header>
            <WindowToolbarContext.Provider value={{ host: toolbarHost, onPointerDown: startDrag, onDoubleClick: maximizeFromToolbar }}>
                <div className="os-window-body">{AppContent ? <AppContent {...win.props} windowId={win.id} /> : null}</div>
            </WindowToolbarContext.Provider>
            {!win.maximized && RESIZE_EDGES.map((edge) => <div key={edge} className={`os-resize os-resize-${edge}`} onPointerDown={startResize(edge)} />)}
        </section>
    );
};

export default Window;
