import { createRoot } from "react-dom/client";
import "./styles/os.css";
import "./system/Controls/Controls.css";
import App from "./App.jsx";
import { hydratePaperMaterial } from "./system/paperMaterial.js";

if (window.location.pathname === '/about') {
    window.location.replace(`/about/${window.location.search}${window.location.hash}`);
} else {
    hydratePaperMaterial();
    createRoot(document.getElementById("root")).render(<App />);
}
