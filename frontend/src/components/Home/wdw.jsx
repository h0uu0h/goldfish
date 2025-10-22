import { useState, useEffect, useRef } from "react";
import "./Home.css";
import { gsap } from "gsap";

const Home = () => {
    const [works, setWorks] = useState([]);
    const containerRef = useRef(null);
    // 使用gsap.context来管理所有动画，便于清理
    const ctx = useRef();

    useEffect(() => {
        fetch("/goldfish/works/works.json")
            .then((response) => response.json())
            .then((data) => setWorks(data))
            .catch((error) => console.error("加载作品数据失败:", error));
    }, []);

    useEffect(() => {
        if (!containerRef.current || works.length === 0) return;

        ctx.current = gsap.context(() => {
            const cards = gsap.utils.toArray(".work-card");

            if (window.innerWidth > 768) {
                cards.forEach((card) => {
                    gsap.set(card, {
                        x: gsap.utils.random(-200, 200) + containerRef.current.offsetWidth / 2 - 100,
                        y: gsap.utils.random(-150, 150) + containerRef.current.offsetHeight / 2 - 100,
                        rotation: gsap.utils.random(-10, 10),
                    });
                });

                cards.forEach((card) => {
                    let hoverAnimation;

                    card.addEventListener("mouseenter", () => {
                        // 停止任何正在进行的动画
                        gsap.killTweensOf(card);

                        hoverAnimation = gsap.to(card, {
                            x: `+=${gsap.utils.random(-30, 30)}`,
                            y: `+=${gsap.utils.random(-30, 30)}`,
                            rotation: `+=${gsap.utils.random(-20, 20)}`,
                            scale: 1.1,
                            duration: 0.4,
                            ease: "elastic.out(1, 0.4)",
                        });

                        gsap.to(card.querySelector(".work-overlay"), {
                            opacity: 1,
                            duration: 0.3,
                        });
                    });

                    card.addEventListener("mouseleave", () => {
                        // 停止悬停动画
                        if (hoverAnimation) hoverAnimation.kill();

                        // 直接回到当前位置（不改变x,y，只重置旋转和缩放）
                        gsap.to(card, {
                            // rotation: 0,
                            scale: 1,
                            duration: 0.6,
                            ease: "power2.out",
                        });

                        gsap.to(card.querySelector(".work-overlay"), {
                            opacity: 0,
                            duration: 0.2,
                        });
                    });
                });
            }
        }, containerRef);

        return () => ctx.current && ctx.current.revert();
    }, [works]);

    return (
        <div className="home">
            <div className="home-container">
                <div className="works-grid" ref={containerRef}>
                    {works.map((work) => (
                        <div key={work.id} className="work-card">
                            <div className="work-image">
                                <img src={work.image} alt={work.title} />
                                <div className="work-overlay">
                                    <button className="view-btn">
                                        查看详情
                                    </button>
                                    <button className="like-btn">
                                        ❤️ {work.likes}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;