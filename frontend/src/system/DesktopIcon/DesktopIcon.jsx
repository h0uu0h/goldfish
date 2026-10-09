import { Button } from "../Controls/Controls.jsx";
/* eslint-disable react/prop-types */
import "./DesktopIcon.css";

const DesktopIcon = ({ icon, label, selected, external, onSelect, onOpen }) => (
    <Button appearance="plain"
        className={`os-desktop-icon ${selected ? "selected" : ""}`}
        onClick={(event) => {
            event.stopPropagation();
            // 鼠标单击选中；键盘 Enter（detail 为 0）直接打开
            if (event.detail === 0) onOpen();
            else onSelect();
        }}
        onDoubleClick={onOpen}
        title={external ? `${label} ↗` : label}>
        <span className="os-desktop-icon-glyph" style={{ "--desktop-icon-mask": `url(${JSON.stringify(icon)})` }}>
            <img src={icon} alt="" draggable="false" />
            {external && <span className="os-desktop-icon-ext os-label">↗</span>}
        </span>
        <span className="os-desktop-icon-label">{label}</span>
    </Button>
);

export default DesktopIcon;
