/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import Fish from "./components/Fish";
import Octopus from "./components/Octopus";
import SpikyBall from "./components/SpikyBall";
import Sidebar from "./components/Sidebar";
import Home from "./components/Home";
import "./App.css";

function App() {
    useEffect(() => {
        const handleContextMenu = (e) => e.preventDefault();
        document.addEventListener("contextmenu", handleContextMenu);

        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
        };
    }, []);
    const [isOctopusPinned, setIsOctopusPinned] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

    const handlePinOctopus = () => {
        setIsOctopusPinned(!isOctopusPinned); // 切换固定状态
    };

    const handleToggleSidebar = (collapsed) => {
        setIsSidebarCollapsed(collapsed);
    };

    return (
        <div className="container">
            <Octopus
                isPinned={isOctopusPinned}
                isSidebarCollapsed={isSidebarCollapsed}
            />
            <Sidebar
                onPinOctopus={handlePinOctopus}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={handleToggleSidebar}
            />
            <Home />
            {/* <Fish /> */}
            {/* <SpikyBall /> */}
        </div>
    );
}

export default App;
