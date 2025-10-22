import { useState } from "react";
import "./Sidebar.css";

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(true);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };
    return (
        <>
            <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
                <div className="sidebar-header">
                    <button className="toggle-btn" onClick={toggleSidebar}>
                        {/* {isCollapsed ? "→" : "←"} */}
                        <span
                            className={`logo-icon ${
                                isCollapsed ? "collapsed" : ""
                            }`}>
                            ⚛️
                        </span>
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {!isCollapsed && (
                        <>
                            <div className="sidebar-title">Goldfish</div>
                            <div className="sidebar-title">eyeye</div>
                        </>
                    )}
                </nav>
            </div>
            <div className="topbar">works</div>
        </>
    );
};

export default Sidebar;
