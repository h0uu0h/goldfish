import { useState, useEffect, useRef } from "react";
import "./Home.css";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";

const Home = () => {
    const [works, setWorks] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const containerRef = useRef(null);
    const ctx = useRef();
    const draggableInstances = useRef([]);

    useEffect(() => {
        fetch("/goldfish/works/works.json")
            .then((response) => response.json())
            .then((data) => setWorks(data))
            .catch((error) => console.error("加载作品数据失败:", error));
    }, []);

    // 检测窗口大小变化
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // 初始化桌面端效果
    const initDesktopEffects = () => {
        if (!containerRef.current || works.length === 0) return;

        gsap.registerPlugin(Draggable);

        // 清理之前的实例
        if (draggableInstances.current.length > 0) {
            draggableInstances.current.forEach((instance) => instance.kill());
            draggableInstances.current = [];
        }

        ctx.current = gsap.context(() => {
            const container = containerRef.current;
            const cards = gsap.utils.toArray(".work-card");
            let zIndexCounter = 1;

            // 布局函数
            function layoutCards() {
                const containerRect = container.getBoundingClientRect();

                // 初始随机放置
                cards.forEach((card) => {
                    const randomX =
                        gsap.utils.random(-100, 100) +
                        containerRect.width / 2 -
                        card.offsetWidth / 2;
                    const randomY =
                        gsap.utils.random(-100, 100) +
                        containerRect.height / 2 -
                        card.offsetHeight / 2;
                    gsap.set(card, {
                        x: randomX,
                        y: randomY,
                        zIndex: 1,
                    });
                });

                // 分离算法
                const maxIterations = 80;
                const separation = 200;
                const data = cards.map((c) => ({
                    el: c,
                    x: gsap.getProperty(c, "x"),
                    y: gsap.getProperty(c, "y"),
                    w: c.offsetWidth,
                    h: c.offsetHeight,
                }));

                for (let i = 0; i < maxIterations; i++) {
                    let moved = false;
                    for (let a = 0; a < data.length; a++) {
                        for (let b = a + 1; b < data.length; b++) {
                            const ca = data[a];
                            const cb = data[b];
                            const dx = cb.x - ca.x;
                            const dy = cb.y - ca.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist < separation) {
                                const angle = Math.atan2(dy, dx);
                                const push = (separation - dist) / 2;
                                ca.x -= Math.cos(angle) * push;
                                ca.y -= Math.sin(angle) * push;
                                cb.x += Math.cos(angle) * push;
                                cb.y += Math.sin(angle) * push;
                                moved = true;
                            }
                        }
                    }
                    if (!moved) break;
                }

                // 边界检测
                data.forEach((c) => {
                    c.x = Math.max(0, Math.min(c.x, containerRect.width - c.w));
                    c.y = Math.max(
                        0,
                        Math.min(c.y, containerRect.height - c.h)
                    );
                });

                // 应用动画
                data.forEach((c) => {
                    gsap.to(c.el, {
                        x: c.x,
                        y: c.y,
                        duration: 1,
                        ease: "power3.out",
                    });
                });
            }

            // 调用初始布局
            layoutCards();

            // 悬浮效果 & 层级
            cards.forEach((card) => {
                let hoverAnim;

                const onEnter = () => {
                    gsap.killTweensOf(card);
                    zIndexCounter++;
                    gsap.set(card, { zIndex: zIndexCounter });

                    hoverAnim = gsap.to(card, {
                        scale: 1.1,
                        rotation: "+=" + gsap.utils.random(-15, 15),
                        duration: 0.4,
                        ease: "elastic.out(1, 0.4)",
                        boxShadow: "0px 0px 20px rgba(255, 255, 255, 1)",
                    });
                };

                const onLeave = () => {
                    hoverAnim && hoverAnim.kill();
                    gsap.to(card, {
                        scale: 1,
                        duration: 0.4,
                        rotation: 0,
                        ease: "elastic.out(1, 0.4)",
                        boxShadow: "none",
                    });
                };

                card.addEventListener("mouseenter", onEnter);
                card.addEventListener("mouseleave", onLeave);

                // ✅ 保存引用用于后续清理
                card._onEnter = onEnter;
                card._onLeave = onLeave;
            });

            // 拖拽功能
            cards.forEach((card) => {
                const draggable = Draggable.create(card, {
                    bounds: container,
                    onPress() {
                        zIndexCounter++;
                        gsap.set(card, { zIndex: zIndexCounter });
                    },
                    onDrag() {
                        gsap.to(card, {
                            rotation: 0,
                            scale: 1,
                            duration: 0.2,
                        });
                    },
                    inertia: true,
                });
                draggableInstances.current.push(draggable[0]);
            });
        }, containerRef);
    };

    // 清理桌面端效果
    const cleanupDesktopEffects = () => {
        if (ctx.current) {
            ctx.current.revert();
        }
        if (draggableInstances.current.length > 0) {
            draggableInstances.current.forEach((instance) => instance.kill());
            draggableInstances.current = [];
        }

        // 重置所有卡片样式
        const cards = document.querySelectorAll(".work-card");
        cards.forEach((card) => {
            card.removeEventListener("mouseenter", card._onEnter);
            card.removeEventListener("mouseleave", card._onLeave);
            delete card._onEnter;
            delete card._onLeave;
            gsap.set(card, {
                x: 0,
                y: 0,
                rotation: 0,
                scale: 1,
                boxShadow: "none",
            });
        });
    };

    // 初始化移动端效果
    const initMobileEffects = () => {
        const cards = document.querySelectorAll(".work-card");
        gsap.fromTo(
            cards,
            { opacity: 0, y: 30 },
            {
                opacity: 1,
                y: 0,
                stagger: 0.1,
                duration: 0.5,
                ease: "power2.out",
            }
        );
    };
    // 清理移动端效果
    const cleanupMobileEffects = () => {
        gsap.killTweensOf(".work-card");
    };
    // 根据屏幕尺寸初始化或清理效果
    useEffect(() => {
        if (works.length === 0) return;

        if (!isMobile) {
            // 桌面端：初始化效果
            cleanupMobileEffects();
            initDesktopEffects();
        } else {
            // 移动端：清理效果
            cleanupDesktopEffects();
            initMobileEffects();
        }

        return () => {
            cleanupDesktopEffects();
        };
    }, [works, isMobile]);

    return (
        <div className="home">
            <div className="home-container">
                <div className="works-grid" ref={containerRef}>
                    {works.map((work) => (
                        <div key={work.id} className="work-card">
                            <div className="work-image">
                                <img src={work.image} alt={work.title} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;
