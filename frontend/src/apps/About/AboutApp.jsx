// components/About.jsx
import "./AboutApp.css";
import MagicLink from "../shared/MagicLink.jsx";

const AboutApp = () => {
    return (
        <div className="about-author os-scroll"><div className="about">
            <div className="about-container">
                <div className="about-info">
                    <h1>侯家祺 </h1>
                    <div className="about-meta">
                        <div className="about-m">Interactive Design, Graphic Design</div>
                        <div style={{ whiteSpace: "pre-line", fontWeight: "300" }}>{"北京邮电大学 2020 级本科生\n北京邮电大学 2024 级硕士在读"}</div>
                        <div className="about-m">{"PS, AI, AE, PR\nBlender, Unity, C#\nPython, React, JavaScript, HTML, CSS"}</div>
                        <img src="/hjq.JPG" alt="hjq" style={{ width: "clamp(108px, 24cqw, 252px)", maxWidth: "100%", height: "auto" }} />
                        <MagicLink href="mailto:1978708083@qq.com">1978708083@qq.com</MagicLink>
                    </div>
                </div>
            </div>
        </div></div>
    );
};

export default AboutApp;
