import { Button } from "../../system/Controls/Controls.jsx";
/* eslint-disable react/prop-types */
import { forwardRef, useRef, useEffect } from "react";
import { gsap } from "gsap";

// 散布在作品集窗口里的可拖拽卡片：悬浮探出"眼睛"按钮，点击打开作品窗口
const WorkCard = forwardRef(({ work, onOpen }, ref) => {
    const cardRef = useRef(null);
    const buttonRef = useRef(null);
    const buttonContainerRef = useRef(null);
    const lineRef = useRef(null);

    useEffect(() => {
        if (ref) {
            if (typeof ref === "function") ref(cardRef.current);
            else ref.current = cardRef.current;
        }
    }, [ref]);

    const handleButtonClick = () => {
        // 立即开窗，收起动画只是余韵（不能把导航拴在动画回调上）
        onOpen(work);
        const button = buttonRef.current;
        const buttonContainer = buttonContainerRef.current;
        const line = lineRef.current;
        if (!button || !buttonContainer || !line) return;

        gsap.set(line, { transformOrigin: "top" });
        const tl = gsap.timeline();
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

    useEffect(() => {
        const card = cardRef.current;
        const buttonContainer = buttonContainerRef.current;
        const button = buttonRef.current;
        const line = lineRef.current;
        if (!card || !buttonContainer || !button || !line) return;

        gsap.set(buttonContainer, { x: "-50%", y: "-100%", scale: 0.2 });
        let hoverTl = null;
        let btnHoverTl = null;

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
                    boxShadow: "0px 8px 28px rgba(0,0,0,0.18)",
                })
                .to(buttonContainer, { y: 0, duration: 0.5, ease: "power2.out", scale: 1, opacity: 1 }, "<")
                .to(line, { scaleY: 1, duration: 0.5, ease: "power2.out" }, "<");
        };

        const onLeave = () => {
            if (hoverTl) hoverTl.kill();
            hoverTl = gsap.timeline();
            hoverTl
                .to(card, { scale: 1, rotation: 0, duration: 0.4, ease: "elastic.out(1,0.4)", boxShadow: "none" })
                .to(buttonContainer, { y: "-100%", duration: 0.4, ease: "power2.in", opacity: 0, scale: 0.2 }, "<")
                .to(line, { scaleY: 0, duration: 0.4, ease: "power2.in" }, "<");
        };

        const onButtonEnter = () => {
            if (btnHoverTl) btnHoverTl.kill();
            btnHoverTl = gsap.timeline();
            btnHoverTl.to(button, { scale: 1.3, y: -4, duration: 0.3, ease: "power2.out" });
        };

        const onButtonLeave = () => {
            if (btnHoverTl) btnHoverTl.kill();
            btnHoverTl = gsap.timeline();
            btnHoverTl.to(button, { scale: 1, y: 0, duration: 0.3, ease: "power2.inOut" });
        };

        card.addEventListener("mouseenter", onEnter);
        card.addEventListener("mouseleave", onLeave);
        button.addEventListener("mouseenter", onButtonEnter);
        button.addEventListener("mouseleave", onButtonLeave);

        return () => {
            card.removeEventListener("mouseenter", onEnter);
            card.removeEventListener("mouseleave", onLeave);
            button.removeEventListener("mouseenter", onButtonEnter);
            button.removeEventListener("mouseleave", onButtonLeave);
            if (hoverTl) hoverTl.kill();
            if (btnHoverTl) btnHoverTl.kill();
        };
    }, []);

    return (
        <div ref={cardRef} className="work-card">
            <div ref={buttonContainerRef} className="work-button-container">
                <div ref={lineRef} className="work-line"></div>
                <Button appearance="plain" ref={buttonRef} className="work-button" onClick={handleButtonClick} title={work.title}>
                    <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                        <ellipse cx="9" cy="15" rx="6" ry="10" fill="white" stroke="black" strokeWidth="2" />
                        <ellipse cx="21" cy="15" rx="6" ry="10" fill="white" stroke="black" strokeWidth="2" />
                        <circle cx="7" cy="15" r="4" fill="black" />
                        <circle cx="19" cy="15" r="4" fill="black" />
                    </svg>
                </Button>
            </div>
            <div className="work-image">
                <img src={work.image} alt={work.title} draggable="false" />
            </div>
        </div>
    );
});

WorkCard.displayName = "WorkCard";

export default WorkCard;
