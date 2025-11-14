/* eslint-disable react/prop-types */
import { forwardRef, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";

const WorkCard = forwardRef(({ work, isMobile, index }, ref) => {
    const navigate = useNavigate();
    const cardRef = useRef(null);
    const buttonRef = useRef(null);
    const buttonContainerRef = useRef(null);
    const lineRef = useRef(null);

    // 将外部 ref 和内部 ref 合并
    useEffect(() => {
        if (ref) {
            if (typeof ref === "function") {
                ref(cardRef.current);
            } else {
                ref.current = cardRef.current;
            }
        }
    }, [ref]);

    const handleButtonClick = () => {
        const card = cardRef.current;
        const buttonContainer = buttonContainerRef.current;
        const button = buttonRef.current;
        const line = lineRef.current;

        if (!card || !buttonContainer || !button || !line) return;

        gsap.set(line, { transformOrigin: "top" });
        const tl = gsap.timeline({
            onComplete: () => {
                navigate(`/work/${work.slug}`);
            },
        });

        tl.to(line, { scaleY: 2, duration: 0.3, ease: "power2.in" })
            .to(button, { y: 50, duration: 0.3, ease: "power2.in" }, "<")
            .to(buttonContainer, {
                y: "-100%",
                scaleY: 1,
                duration: 0.5,
                ease: "elastic.out(1, 0.5)",
                opacity: 0,
                scale: 0.2,
            });
    };
    // 移动端点击跳转处理函数
    const handleMobileClick = () => {
        const card = cardRef.current;
        if (!card) return;

        // 添加点击反馈动画
        gsap.to(card, {
            scale: 0.95,
            duration: 0.1,
            ease: "power2.out",
            onComplete: () => {
                gsap.to(card, {
                    scale: 1,
                    duration: 0.1,
                    ease: "power2.in",
                    onComplete: () => {
                        navigate(`/work/${work.slug}`);
                    },
                });
            },
        });
    };
    // 桌面端悬浮效果
    useEffect(() => {
        if (isMobile || !cardRef.current) return;

        const card = cardRef.current;
        const buttonContainer = buttonContainerRef.current;
        const button = buttonRef.current;
        const line = lineRef.current;

        if (!buttonContainer || !button || !line) return;

        gsap.set(buttonContainer, { x: "-50%", y: "-100%", scale: 0.2 });
        let hoverTl = null;

        const onEnter = () => {
            gsap.set(line, { scaleY: 0, transformOrigin: "bottom" });
            if (hoverTl) hoverTl.kill();
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

        // 清理函数
        return () => {
            card.removeEventListener("mouseenter", onEnter);
            card.removeEventListener("mouseleave", onLeave);
            button.removeEventListener("mouseenter", onButtonEnter);
            button.removeEventListener("mouseleave", onButtonLeave);
            if (hoverTl) hoverTl.kill();
            if (btnHoverTl) btnHoverTl.kill();
        };
    }, [isMobile]);

    // 移动端效果
    useEffect(() => {
        if (!isMobile || !cardRef.current) return;

        const card = cardRef.current;

        const onEnter = () => {
            gsap.to(card, { scale: 0.95, zIndex: 10, duration: 0.3, ease: "power2.out" });
        };
        const onLeave = () => {
            gsap.to(card, { scale: 1, zIndex: 1, duration: 0.3, ease: "power2.out" });
        };
        const onClick = () => {
            handleMobileClick();
        }
        card.addEventListener("click", onClick);
        card.addEventListener("mouseenter", onEnter);
        card.addEventListener("mouseleave", onLeave);

        // 移动端入场动画
        gsap.fromTo(
            card,
            { opacity: 0, y: 30 },
            {
                opacity: 1,
                y: 0,
                delay: index * 0.1,
                duration: 0.5,
                ease: "power2.out",
            }
        );

        return () => {
            card.removeEventListener("click", onClick);
            card.removeEventListener("mouseenter", onEnter);
            card.removeEventListener("mouseleave", onLeave);
        };
    }, [isMobile, index]);

    return (
        <div ref={cardRef} className="work-card">
            {!isMobile && (
                <div ref={buttonContainerRef} className="work-button-container">
                    <div ref={lineRef} className="work-line"></div>
                    <button ref={buttonRef} className="work-button" onClick={handleButtonClick}>
                        <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                            <ellipse cx="9" cy="15" rx="6" ry="10" fill="white" stroke="black" strokeWidth="2" />
                            <ellipse cx="21" cy="15" rx="6" ry="10" fill="white" stroke="black" strokeWidth="2" />
                            <circle cx="7" cy="15" r="4" fill="black" />
                            <circle cx="19" cy="15" r="4" fill="black" />
                        </svg>
                    </button>
                </div>
            )}
            <div className="work-image">
                <img src={work.image} alt={work.title} />
            </div>
        </div>
    );
});

WorkCard.displayName = "WorkCard";

export default WorkCard;
