/* eslint-disable no-unused-vars */
import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import Fish from "./components/Fish";
import Octopus from "./components/Octopus";
import SpikyBall from "./components/SpikyBall";
import Sidebar from "./components/Sidebar";
import Home from "./components/Home";
import "./App.css";

function App() {
    const [count, setCount] = useState(0);

    return (
        <div className="container">
            <Octopus />
            <Sidebar />
            <Home />
            {/* <Fish /> */}
            {/* <SpikyBall /> */}
        </div>
    );
}

export default App;
