import "./Footer.css";
import { useLocation } from "react-router-dom";

const Footer = () => {
    const location = useLocation();
    const isHomePage = location.pathname === "/";
    const isWorkPage = location.pathname.startsWith("/work");

    return (
        <footer className={`footer ${isHomePage ? "footer-home" : ""} ${isWorkPage ? "footer-work" : ""}`}>
            <p>© 2025 Goldfish Portfolio. All rights reserved.</p>
        </footer>
    );
};

export default Footer;
