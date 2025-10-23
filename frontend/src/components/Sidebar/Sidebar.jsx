/* eslint-disable react/prop-types */
import { useState } from "react";
import "./Sidebar.css";

const Sidebar = ({
    onPinOctopus,
    isCollapsed: externalIsCollapsed,
    onToggleCollapse,
}) => {
    const [internalIsCollapsed, setInternalIsCollapsed] = useState(true);

    // 使用外部状态或内部状态
    const isCollapsed =
        externalIsCollapsed !== undefined
            ? externalIsCollapsed
            : internalIsCollapsed;

    const toggleSidebar = () => {
        if (onToggleCollapse) {
            onToggleCollapse(!isCollapsed);
        } else {
            setInternalIsCollapsed(!isCollapsed);
        }
    };

    const handleContextMenu = () => {
        onPinOctopus && onPinOctopus();
    };

    return (
        <>
            <div
                className={`sidebar ${isCollapsed ? "collapsed" : ""}`}
                onContextMenu={handleContextMenu}>
                <div className="sidebar-header">
                    <button className="toggle-btn" onClick={toggleSidebar}>
                        <span
                            className={`logo-icon ${
                                isCollapsed ? "collapsed" : ""
                            }`}>
                            🐙
                        </span>
                    </button>
                </div>

                <nav className={`sidebar-nav ${isCollapsed ? "collapsed" : ""}`}>
                    {!isCollapsed && (
                        <>
                            <div className="sidebar-title">Goldfish</div>
                            <div className="sidebar-title">eyeye</div>
                        </>
                    )}
                </nav>
            </div>
            <div className="topbar" onContextMenu={handleContextMenu}>
                works
            </div>
        </>
    );
};

export default Sidebar;
