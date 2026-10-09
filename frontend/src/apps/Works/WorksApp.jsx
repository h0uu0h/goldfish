import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import WorkCard from "./WorkCard.jsx";
import { useWindowManager } from "../../wm/WindowManager.jsx";
import "./WorksApp.css";

gsap.registerPlugin(Draggable);

// 原首页的散布卡片布局，移植到窗口容器内：随机撒开 → 分离算法推开重叠 → 可拖拽
const WorksApp = () => {
    const [works, setWorks] = useState([]);
    const { openApp } = useWindowManager();
    const containerRef = useRef(null);
    const cardRefs = useRef([]);
    const draggableInstances = useRef([]);
    const zIndexCounter = useRef(1);

    useEffect(() => {
        fetch("/works/works.json")
            .then((res) => res.json())
            .then(setWorks)
            .catch((error) => console.error("加载作品数据失败:", error));
    }, []);

    const openWork = (work) => {
        openApp("workviewer", { slug: work.slug }, { id: `work:${work.slug}`, title: work.title });
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container || works.length === 0) return;

        const cards = () => cardRefs.current.filter(Boolean);

        function layoutCards() {
            const rect = container.getBoundingClientRect();
            const list = cards();

            // 初始随机放置在容器中部
            list.forEach((card) => {
                gsap.set(card, {
                    x: gsap.utils.random(-100, 100) + rect.width / 2 - card.offsetWidth / 2,
                    y: gsap.utils.random(-10, 10) + rect.height / 2 - card.offsetHeight / 2,
                });
            });

            // 分离算法：迭代推开互相重叠的卡片
            const separation = Math.min(200, rect.width / 3);
            const data = list.map((el) => ({
                el,
                x: gsap.getProperty(el, "x"),
                y: gsap.getProperty(el, "y"),
                w: el.offsetWidth,
                h: el.offsetHeight,
            }));
            for (let i = 0; i < 80; i++) {
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

            // 边界内收
            data.forEach((c) => {
                c.x = gsap.utils.clamp(8, Math.max(8, rect.width - c.w - 8), c.x);
                c.y = gsap.utils.clamp(8, Math.max(8, rect.height - c.h - 8), c.y);
            });
            data.forEach((c) => {
                gsap.to(c.el, { x: c.x, y: c.y, duration: 1, ease: "power3.out" });
            });
        }

        function initDraggables() {
            draggableInstances.current.forEach((instance) => instance.kill());
            draggableInstances.current = [];

            cards().forEach((card) => {
                const buttonContainer = card.querySelector(".work-button-container");
                const buttonPupils = card.querySelectorAll(".work-button circle");

                const draggable = Draggable.create(card, {
                    bounds: container,
                    onPress() {
                        zIndexCounter.current++;
                        gsap.set(card, { zIndex: zIndexCounter.current });
                        gsap.set(buttonContainer, { transformOrigin: "top center" });
                        gsap.to(buttonContainer, { rotation: 0, duration: 0.2 });
                    },
                    onDrag() {
                        const rotation = gsap.utils.clamp(-30, 30, this.deltaX);
                        gsap.to(buttonContainer, { rotation, duration: 0.15, ease: "power2.out" });
                        gsap.to(buttonPupils, {
                            cx: (i) => (i === 0 ? 9 : 21) + gsap.utils.clamp(-2, 2, this.deltaX),
                            duration: 0.1,
                        });
                        gsap.to(card, { rotation: 0, scale: 1, duration: 0.2 });
                    },
                    onRelease() {
                        gsap.to(buttonContainer, { rotation: 0, duration: 1.2, ease: "elastic.out(1, 0.3)" });
                        gsap.to(buttonPupils, { cx: (i) => (i === 0 ? 7 : 19), duration: 0.1 });
                    },
                });
                draggableInstances.current.push(draggable[0]);
            });
        }

        // 等图片加载完再布局，避免尺寸不准
        const images = container.querySelectorAll("img");
        gsap.set(images, { visibility: "hidden" });
        Promise.all(
            Array.from(images).map((img) =>
                img.complete ? Promise.resolve() : new Promise((resolve) => {
                    img.addEventListener("load", resolve);
                    img.addEventListener("error", resolve);
                })
            )
        ).then(() => {
            gsap.set(images, { visibility: "visible" });
            layoutCards();
            initDraggables();
        });

        // 窗口被缩放/最大化时重新布局并更新拖拽边界（防抖）
        let resizeTimer = null;
        const observer = new ResizeObserver(() => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                layoutCards();
                draggableInstances.current.forEach((instance) => instance.applyBounds(container));
            }, 200);
        });
        observer.observe(container);

        return () => {
            observer.disconnect();
            clearTimeout(resizeTimer);
            draggableInstances.current.forEach((instance) => instance.kill());
            draggableInstances.current = [];
            gsap.killTweensOf(cards());
        };
    }, [works]);

    return (
        <div className="works-scatter" ref={containerRef}>
            {works.map((work, index) => (
                <WorkCard key={work.slug} work={work} onOpen={openWork} ref={(el) => (cardRefs.current[index] = el)} />
            ))}
        </div>
    );
};

export default WorksApp;
