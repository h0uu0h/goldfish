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

    // 移动端入场动画
    useEffect(() => {
        if (isMobile && cardRef.current) {
            gsap.fromTo(
                cardRef.current,
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    delay: index * 0.1,
                    duration: 0.5,
                    ease: "power2.out",
                }
            );
        }
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
