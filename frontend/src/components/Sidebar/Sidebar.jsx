import { useEffect, useState } from "react";
import { useMatch } from "react-router-dom";
import MagicLink from "../common/MagicLink";
import "./Sidebar.css";

const Sidebar = () => {
    const match = useMatch("/work/:slug");
    const slug = match?.params?.slug;
    const [isCollapsed, setIsCollapsed] = useState(true);
    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    useEffect(() => {
        // 可以在这里根据 slug 做一些操作
        console.log("Current slug:", slug);
    }, [slug]);

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
                            {/* <rect fill="#8f8f8fff" stroke="black" strokeWidth="2" width="30" height="30" /> */}
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
                            <MagicLink className="sidebar-title">Goldfish</MagicLink>
                            <MagicLink className="sidebar-title">eyeye</MagicLink>
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
                {slug && (
                    <>
                        <Dot />
                        <MagicLink href={`/work/${slug}`} className="custom-link">
                            {slug}
                        </MagicLink>
                    </>
                )}
            </div>
        </>
    );
};

export default Sidebar;
