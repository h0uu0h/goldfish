/* eslint-disable react/prop-types */
import { useRef, useEffect, useMemo } from "react";
import { gsap } from "gsap";
import "./StaplePhotoAlbum.css";

// 单独的StapleLabel组件
const StapleLabel = ({ text, position, fixedPoint, onHover, onLeave }) => {
    const labelRef = useRef(null);
    const lineRef = useRef(null);

    useEffect(() => {
        if (!labelRef.current || !lineRef.current) return;

        const labelEl = labelRef.current;

        // 🪶 定义一个递归函数让标签持续随机漂浮
        const randomFloat = () => {
            const dx = gsap.utils.random(-10, 10, true);
            const dy = gsap.utils.random(-8, 8, true);
            const duration = gsap.utils.random(2, 4, true);
            gsap.to(labelEl, {
                x: dx,
                y: dy,
                rotation: gsap.utils.random(-2, 2, true),
                duration,
                ease: "sine.inOut",
                onComplete: randomFloat, // 每次结束后再随机新路径
            });
        };

        // 🌈 初始淡入 + 启动漂浮
        gsap.fromTo(labelEl, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1, ease: "power2.out", onComplete: randomFloat });

        // 🔗 连线更新函数
        const updateLine = () => {
            if (!labelRef.current || !lineRef.current) return;

            const labelRect = labelRef.current.getBoundingClientRect();
            const containerRect = labelRef.current.parentElement.getBoundingClientRect();

            // label 左侧中心点
            const labelX = labelRect.left - containerRect.left + labelRect.width / 2;
            const labelY = labelRect.top - containerRect.top + labelRect.height / 2;

            // 把 fixedPoint 从百分比转为像素坐标
            const x1 = (parseFloat(fixedPoint.x) / 100) * containerRect.width;
            const y1 = (parseFloat(fixedPoint.y) / 100) * containerRect.height;

            lineRef.current.setAttribute("x1", x1);
            lineRef.current.setAttribute("y1", y1);
            lineRef.current.setAttribute("x2", labelX);
            lineRef.current.setAttribute("y2", labelY);

            requestAnimationFrame(updateLine);
        };

        updateLine();

        return () => {
            gsap.killTweensOf(labelEl);
        };
    }, [fixedPoint]);

    const handleMouseEnter = () => {
        if (labelRef.current) {
            gsap.to(labelRef.current, {
                scale: 1.1,
                y: -6,
                duration: 0.3,
                ease: "power2.out",
            });
            onHover?.(labelRef.current);
        }
    };

    const handleMouseLeave = () => {
        if (labelRef.current) {
            gsap.to(labelRef.current, {
                scale: 1,
                y: -3,
                duration: 0.3,
                ease: "power2.inOut",
            });
            onLeave?.(labelRef.current);
        }
    };

    return (
        <>
            <svg
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: -2,
                }}>
                <line ref={lineRef} stroke="rgba(255, 255, 255, 1)" strokeWidth="2" strokeDasharray="40,2" />
            </svg>
            <div
                ref={labelRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="staple-label"
                style={{
                    position: "absolute",
                    left: position.x,
                    top: position.y,
                    cursor: "pointer",
                    zIndex: -1,
                }}>
                {text}
            </div>
        </>
    );
};

const StaplePhotoAlbum = ({ centerOffsetX = 0, centerOffsetY = 0, baseAngle = 10, duration = 0.5 }) => {
    const images = useMemo(
        () => [
            "/works/details/1/book/1.png",
            "/works/details/1/book/2.png",
            "/works/details/1/book/3.png",
            "/works/details/1/book/4.png",
            "/works/details/1/book/5.png",
            "/works/details/1/book/6.png",
            "/works/details/1/book/7.png",
            "/works/details/1/book/8.png",
            "/works/details/1/book/9.png",
        ],
        []
    );

    const cardsRef = useRef([]);
    const isOpenRef = useRef(false);
    const isAnimatingRef = useRef(false);

    // 🪞 初始状态 - 保持原有图片逻辑完全不变
    useEffect(() => {
        cardsRef.current.forEach((card, i) => {
            if (!card) return;
            gsap.set(card, {
                rotation: -baseAngle * i,
            });
        });

        // 入场动画
        gsap.fromTo(
            ".book-page",
            { opacity: 0, scale: 0.9 },
            {
                opacity: 1,
                scale: 1,
                duration: 1.2,
                stagger: 0.08,
                ease: "back.out(1.6)",
            }
        );
    }, [baseAngle, centerOffsetX, centerOffsetY]);

    // 📖 点击展开 / 收起 - 保持原有逻辑完全不变
    const handleToggle = () => {
        if (isAnimatingRef.current) return;
        isAnimatingRef.current = true;

        const tl = gsap.timeline({
            onComplete: () => (isAnimatingRef.current = false),
        });

        if (!isOpenRef.current) {
            // 🌸 展开
            cardsRef.current.forEach((card, i) => {
                tl.to(
                    card,
                    {
                        rotation: 0,
                        duration,
                        ease: "power4.out",
                    },
                    i * 0.05
                );
            });
        } else {
            // 🍂 收起
            cardsRef.current
                .slice()
                .reverse()
                .forEach((card, i) => {
                    const idx = cardsRef.current.length - 1 - i;
                    tl.to(
                        card,
                        {
                            rotation: -baseAngle * idx,
                            duration,
                            ease: "power4.in",
                        },
                        i * 0.04
                    );
                });
        }

        isOpenRef.current = !isOpenRef.current;
    };

    // 🌟 悬浮相对动效 - 保持原有逻辑完全不变
    const handleHover = (el) => {
        gsap.to(el, {
            scale: "1.05",
            duration: 0.3,
            ease: "power2.out",
        });
    };

    const handleLeave = (el) => {
        gsap.to(el, {
            scale: "1",
            duration: 0.3,
            ease: "power2.inOut",
        });
    };

    // 定义标签数据
    const labels = [
        {
            text: "标准化组件",
            position: { x: "60%", y: "20%" },
            fixedPoint: { x: "70%", y: "50%" },
        },
        {
            text: "交互设计",
            position: { x: "80%", y: "30%" },
            fixedPoint: { x: "70%", y: "50%" },
        },
        {
            text: "用户体验",
            position: { x: "75%", y: "25%" },
            fixedPoint: { x: "70%", y: "50%" },
        },
    ];

    return (
        <div className="bound-book" onClick={handleToggle}>
            <div className="book-container">
                {images.map((src, i) => (
                    <img
                        key={i}
                        ref={(el) => (cardsRef.current[i] = el)}
                        src={src}
                        alt={`Page ${i + 1}`}
                        className="book-page"
                        style={{
                            zIndex: images.length - i,
                            cursor: "pointer",
                        }}
                        draggable="false"
                        onMouseEnter={() => handleHover(cardsRef.current[i])}
                        onMouseLeave={() => handleLeave(cardsRef.current[i])}
                    />
                ))}
            </div>

            {/* 渲染多个标签 */}
            {labels.map((label, index) => (
                <StapleLabel
                    key={index}
                    text={label.text}
                    position={label.position}
                    fixedPoint={label.fixedPoint}
                    onHover={handleHover}
                    onLeave={handleLeave}
                />
            ))}
        </div>
    );
};

export default StaplePhotoAlbum;
