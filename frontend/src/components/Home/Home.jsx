import { useState, useEffect, useRef } from "react";
import "./Home.css";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import WorkCard from "./WorkCard";

const Home = () => {
    const [works, setWorks] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const containerRef = useRef(null);
    const ctx = useRef();
    const draggableInstances = useRef([]);
    const cardRefs = useRef([]);

    useEffect(() => {
        fetch("/works/works.json")
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
            const cards = cardRefs.current.filter((ref) => ref !== null);
            let zIndexCounter = 1;

            // 布局函数
            function layoutCards() {
                const containerRect = container.getBoundingClientRect();

                // 初始随机放置
                cards.forEach((card) => {
                    const randomX = gsap.utils.random(-100, 100) + containerRect.width / 2 - card.offsetWidth / 2;
                    const randomY = gsap.utils.random(-10, 10) + containerRect.height / 2 - card.offsetHeight / 2;
                    console.log("Placing card at:", randomX, randomY);
                    console.log("Container size:", containerRect.width, containerRect.height);
                    console.log("Card size:", card.offsetWidth, card.offsetHeight);
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
                    c.y = Math.max(0, Math.min(c.y, containerRect.height - c.h));
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
            requestAnimationFrame(() => {
                layoutCards();
            });
            const handleResize = () => layoutCards();
            window.addEventListener("resize", handleResize);

            // 把监听器保存到容器上，方便清理时移除
            container._handleResize = handleResize;

            // 悬浮效果 & 层级
            cards.forEach((card) => {
                const buttonContainer = card.querySelector(".work-button-container");
                const button = card.querySelector(".work-button");
                const line = card.querySelector(".work-line");
                const buttonPupils = card.querySelectorAll(".work-button circle");

                gsap.set(buttonContainer, { x: "-50%", y: "-100%", scale: 0.2 });
                let hoverTl = null;

                const onEnter = () => {
                    gsap.set(line, { scaleY: 0, transformOrigin: "bottom" });
                    if (hoverTl) hoverTl.kill();
                    zIndexCounter++;
                    gsap.set(card, { zIndex: zIndexCounter });
                    hoverTl = gsap.timeline();
                    hoverTl
                        .to(card, {
                            scale: 1.1,
                            rotation: "+=" + gsap.utils.random(-15, 15),
                            duration: 0.4,
                            ease: "elastic.out(1,0.4)",
                            boxShadow: "0px 0px 20px rgba(255,255,255,1)",
                        })
                        .to(
                            buttonContainer,
                            {
                                y: 0,
                                duration: 0.5,
                                ease: "power2.out",
                                scale: 1,
                                opacity: 1,
                            },
                            "<"
                        )
                        .to(line, { scaleY: 1, duration: 0.5, ease: "power2.out" }, "<");
                };

                const onLeave = () => {
                    if (hoverTl) hoverTl.kill();
                    hoverTl = gsap.timeline();
                    hoverTl
                        .to(card, {
                            scale: 1,
                            rotation: 0,
                            duration: 0.4,
                            ease: "elastic.out(1,0.4)",
                            boxShadow: "none",
                        })
                        .to(
                            buttonContainer,
                            {
                                y: "-100%",
                                duration: 0.4,
                                ease: "power2.in",
                                opacity: 0,
                                scale: 0.2,
                            },
                            "<"
                        )
                        .to(line, { scaleY: 0, duration: 0.4, ease: "power2.in" }, "<");
                };

                card.addEventListener("mouseenter", onEnter);
                card.addEventListener("mouseleave", onLeave);

                // ✅ 保存引用用于后续清理
                card._onEnter = onEnter;
                card._onLeave = onLeave;

                let btnHoverTl = null;
                const onButtonEnter = () => {
                    if (btnHoverTl) btnHoverTl.kill();
                    btnHoverTl = gsap.timeline();
                    btnHoverTl.to(button, {
                        scale: 1.3,
                        y: -4,
                        boxShadow: "0px 0px 10px rgba(255,255,255,0.8)",
                        duration: 0.3,
                        ease: "power2.out",
                    });
                };

                const onButtonLeave = () => {
                    if (btnHoverTl) btnHoverTl.kill();
                    btnHoverTl = gsap.timeline();
                    btnHoverTl.to(button, {
                        scale: 1,
                        y: 0,
                        boxShadow: "none",
                        duration: 0.3,
                        ease: "power2.inOut",
                    });
                };

                button.addEventListener("mouseenter", onButtonEnter);
                button.addEventListener("mouseleave", onButtonLeave);
                card._onButtonEnter = onButtonEnter;
                card._onButtonLeave = onButtonLeave;

                // 拖拽功能
                const draggable = Draggable.create(card, {
                    bounds: container,
                    inertia: true,
                    onPress() {
                        zIndexCounter++;
                        gsap.set(card, { zIndex: zIndexCounter });
                        gsap.set(buttonContainer, {
                            transformOrigin: "top center",
                        });
                        gsap.to(buttonContainer, {
                            rotation: 0,
                            duration: 0.2,
                        });
                    },
                    onDrag() {
                        const rotation = gsap.utils.clamp(-30, 30, this.deltaX);
                        gsap.to(buttonContainer, {
                            rotation,
                            duration: 0.15,
                            ease: "power2.out",
                        });
                        gsap.to(buttonPupils, {
                            cx: (i) => {
                                const baseCx = i === 0 ? 9 + gsap.utils.clamp(-2, 2, this.deltaX) : 21 + gsap.utils.clamp(-2, 2, this.deltaX);
                                return baseCx;
                            },
                            duration: 0.1,
                        });
                        gsap.to(card, {
                            rotation: 0,
                            scale: 1,
                            duration: 0.2,
                        });
                    },
                    onRelease() {
                        gsap.to(buttonContainer, {
                            rotation: 0,
                            duration: 1.2,
                            ease: "elastic.out(1, 0.3)",
                        });
                        gsap.to(buttonPupils, {
                            cx: (i) => {
                                const baseCx = i === 0 ? 7 : 19;
                                return baseCx;
                            },
                            duration: 0.1,
                        });
                    },
                });

                draggableInstances.current.push(draggable[0]);
            });
        }, containerRef);
    };

    // 清理桌面端效果
    const cleanupDesktopEffects = () => {
        if (draggableInstances.current.length > 0) {
            draggableInstances.current.forEach((instance) => instance.kill());
            draggableInstances.current = [];
        }

        if (ctx.current) {
            try {
                ctx.current.revert();
            } catch (e) {
                console.warn("ctx.revert() failed:", e);
            }
            ctx.current = null;
        }

        const container = containerRef.current;
        if (container && container._handleResize) {
            window.removeEventListener("resize", container._handleResize);
            delete container._handleResize;
        }

        const cards = cardRefs.current.filter((ref) => ref !== null);
        cards.forEach((card) => {
            if (card._onEnter) {
                card.removeEventListener("mouseenter", card._onEnter);
                card.removeEventListener("mouseleave", card._onLeave);
                delete card._onEnter;
                delete card._onLeave;
            }
            if (card._onButtonEnter) {
                const button = card.querySelector(".work-button");
                button.removeEventListener("mouseenter", card._onButtonEnter);
                button.removeEventListener("mouseleave", card._onButtonLeave);
                delete card._onButtonEnter;
                delete card._onButtonLeave;
            }
            card.style.transform = "";
        });
        gsap.killTweensOf(".work-card");
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

    // 重置 cardRefs
    useEffect(() => {
        cardRefs.current = cardRefs.current.slice(0, works.length);
    }, [works]);

    const setCardRef = (index) => (el) => {
        cardRefs.current[index] = el;
    };

    return (
        <div className="home">
            <div className="home-container">
                <div className="works-grid" ref={containerRef}>
                    {works.map((work, index) => (
                        <WorkCard key={work.slug} work={work} isMobile={isMobile} index={index} ref={setCardRef(index)} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;
