/* eslint-disable react/prop-types */
import { useEffect, useRef } from "react";
import gsap from "gsap";

// 沿用旧版逐字跳动链接；收起时回到当前窗口的文字颜色，而非旧黑底页的白色。
export default function MagicLink({ children, href, ...props }) {
    const ref = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;

        const idleColor = getComputedStyle(el).color;
        const chars = String(children).split("").map((char) => {
            const span = document.createElement("span");
            span.style.display = "inline-block";
            span.style.pointerEvents = "none";
            span.innerText = char;
            return span;
        });

        el.replaceChildren(...chars);

        const onEnter = () => {
            animationRef.current?.kill();
            animationRef.current = gsap.fromTo(
                chars,
                { y: 0, rotate: 0, color: idleColor },
                {
                    keyframes: [
                        { y: -8, rotate: 8, color: "#ff0055", duration: 0.2, ease: "back.out(2)" },
                        { y: 0, rotate: 0, color: "#00aaff", duration: 0.2, ease: "back.out(2)" },
                        { y: -8, rotate: -8, color: "#00ff88", duration: 0.2, ease: "back.out(2)" },
                        { y: 0, rotate: 0, color: "#ffaa00", duration: 0.2, ease: "back.out(2)" },
                        { y: 0, rotate: 0, color: idleColor, duration: 0.2, ease: "back.out(2)" },
                    ],
                    stagger: { each: 0.05, from: "start" },
                }
            );
        };

        const onLeave = () => {
            animationRef.current?.kill();
            animationRef.current = null;
            gsap.set(chars, { y: 0, rotate: 0, color: idleColor });
        };

        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
        return () => {
            el.removeEventListener("mouseenter", onEnter);
            el.removeEventListener("mouseleave", onLeave);
            animationRef.current?.kill();
        };
    }, [children]);

    return (
        <a ref={ref} href={href} style={{ display: "inline-block", textDecoration: "none", color: "inherit", whiteSpace: "pre-line" }} {...props}>
            {children}
        </a>
    );
}
