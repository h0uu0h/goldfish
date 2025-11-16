/* eslint-disable react/prop-types */
import { useRef, useEffect } from "react";
import gsap from "gsap";

export default function MagicLink({ children, href, ...props }) {
    const ref = useRef(null);
    const animationRef = useRef(null); // 用于存储当前动画实例

    useEffect(() => {
        const el = ref.current;

        // 拆分每个字母
        const chars = children.split("").map((char) => {
            const span = document.createElement("span");
            span.style.display = "inline-block";
            span.style.pointerEvents = "none";
            span.innerText = char;
            return span;
        });

        el.innerHTML = "";
        chars.forEach((span) => el.appendChild(span));

        // 鼠标悬浮：依次上升 + 变色 + 下落（只执行一次）
        const onEnter = () => {
            // 先停止任何正在进行的动画
            if (animationRef.current) {
                animationRef.current.kill();
            }

            animationRef.current = gsap.fromTo(
                chars,
                { y: 0, rotate: 0, color: "#000" },
                {
                    keyframes: [
                        { y: -8, rotate: 8, color: "#ff0055", duration: 0.2, ease: "back.out(2)" },
                        { y: 0, rotate: 0, color: "#00aaff", duration: 0.2, ease: "back.out(2)" },
                        { y: -8, rotate: -8, color: "#00ff88", duration: 0.2, ease: "back.out(2)" },
                        { y: 0, rotate: 0, color: "#ffaa00", duration: 0.2, ease: "back.out(2)" },
                        { y: 0, rotate: 0, color: "#ffffffff", duration: 0.2, ease: "back.out(2)" },
                    ],
                    stagger: { each: 0.05, from: "start" },
                }
            );
        };

        // 鼠标移出：立即停止动画并重置状态
        const onLeave = () => {
            // 立即停止当前动画
            if (animationRef.current) {
                animationRef.current.kill();
                animationRef.current = null;
            }

            // 立即重置到初始状态
            gsap.set(chars, {
                y: 0,
                rotate: 0,
                color: "#ffffffff", // 根据你的设计调整颜色
            });
        };

        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);

        return () => {
            el.removeEventListener("mouseenter", onEnter);
            el.removeEventListener("mouseleave", onLeave);

            // 清理时也停止动画
            if (animationRef.current) {
                animationRef.current.kill();
            }
        };
    }, [children]);

    return (
        <a ref={ref} href={href} style={{ display: "inline-block", textDecoration: "none", color: "inherit", whiteSpace: "pre" }} {...props}>
            {children}
        </a>
    );
}
