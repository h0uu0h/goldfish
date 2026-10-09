import { MenuSurface, MenuItem, MenuSeparator } from "../Menu/Menu.jsx";
/* eslint-disable react/prop-types */
import { useEffect, useRef } from "react";
import "./ContextMenu.css";

const ContextMenu = ({ x, y, items, onClose }) => {
    const ref = useRef(null);

    // 菜单不越出视口
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        el.style.left = `${Math.max(4, Math.min(x, window.innerWidth - rect.width - 4))}px`;
        el.style.top = `${Math.max(4, Math.min(y, window.innerHeight - rect.height - 4))}px`;
    }, [x, y]);

    useEffect(() => {
        const onKey = (event) => event.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <MenuSurface ref={ref} className="os-context-menu" style={{ left: x, top: y }} onClick={(event) => event.stopPropagation()} onContextMenu={(event) => event.preventDefault()}>
            {items.map((item, index) =>
                item.divider ? (
                    <MenuSeparator key={index} />
                ) : (
                    <MenuItem
                        key={index}
                        onClick={() => {
                            item.onClick?.();
                            onClose();
                        }}>
                        {item.label}
                    </MenuItem>
                )
            )}
        </MenuSurface>
    );
};

export default ContextMenu;
