import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Home from "./components/Home";
import WorkDetail from "./components/WorkDetail";
import "./App.css";

function App() {
    useEffect(() => {
        const handleContextMenu = (e) => e.preventDefault();
        document.addEventListener("contextmenu", handleContextMenu);

        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
        };
    }, []);

    return (
        <Router basename="/">
            <Sidebar />
            <div className="container">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/work/:slug" element={<WorkDetail />} />
                    {/* <Route path="*" element={<Home />} /> */}
                </Routes>
            </div>
        </Router>
    );
}

export default App;
