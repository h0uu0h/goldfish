// Sidebar.jsx
import { useEffect, useState } from "react";
import { useMatch, useLocation } from "react-router-dom"; // 新增 useLocation
import MagicLink from "../common/MagicLink";
import "./Sidebar.css";

const Sidebar = () => {
    const match = useMatch("/work/:slug");
    const location = useLocation(); // 新增
    const slug = match?.params?.slug;
    const [isCollapsed, setIsCollapsed] = useState(true);
    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    useEffect(() => {
        console.log("Current slug:", slug);
    }, [slug]);

    // 获取当前页面路径用于面包屑
    // const getCurrentPage = () => {
    //     if (location.pathname === "/about") return "about";
    //     if (location.pathname === "/") return "works";
    //     if (slug) return slug;
    //     return "works";
    // };

    const Dot = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="15" r="5" fill="white" />
        </svg>
    );

    return (
        <>
            <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
                <div className="sidebar-header">
                    <button className="toggle-btn" onClick={toggleSidebar}>
                        <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                            <ellipse cx="9" cy="15" rx="6" ry="10" fill="black" stroke="white" strokeWidth="2" />
                            <ellipse cx="21" cy="15" rx="6" ry="10" fill="black" stroke="white" strokeWidth="2" />
                            <circle cx={isCollapsed ? 11 : 7} cy="15" r="4" fill="white" />
                            <circle cx={isCollapsed ? 23 : 19} cy="15" r="4" fill="white" />
                        </svg>
                    </button>
                </div>

                <nav className={`sidebar-nav ${isCollapsed ? "collapsed" : ""}`}>
                    {!isCollapsed && (
                        <>
                            <MagicLink href="/" className="sidebar-title">
                                Goldfish
                            </MagicLink>
                            <MagicLink href="/about" className="sidebar-title">
                                About
                            </MagicLink>
                        </>
                    )}
                </nav>
            </div>
            <div className="topbar">
                hjq
                <Dot />
                <MagicLink href="/" className="custom-link">
                    works
                </MagicLink>
                {/* 统一的面包屑逻辑 */}
                {(location.pathname === "/about" || slug) && (
                    <>
                        <Dot />
                        <MagicLink href={location.pathname === "/about" ? "/about" : `/work/${slug}`} className="custom-link">
                            {location.pathname === "/about" ? "about" : slug}
                        </MagicLink>
                    </>
                )}
            </div>
        </>
    );
};

export default Sidebar;
