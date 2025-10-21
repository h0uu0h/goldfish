import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const SpikyBall = () => {
    // 可调节参数
    const BALL_RADIUS = 30; // 中心球大小
    const SPIKE_COUNT = 7; // 触手数量
    const SPIKE_LENGTH = 80; // 触手长度
    const SPIKE_THICKNESS = 12; // 触手厚度
    const INERTIA_FACTOR = 0.2; // 惯性系数
    const STIFFNESS = 0.1; // 触手弹性
    const DAMPING = 0.5; // 阻尼系数
    const ANIMATION_SPEED = 0.03; // 动画速度

    const svgRef = useRef(null);
    const center = useRef({ x: 400, y: 400 });
    const lastCenter = useRef({ x: 400, y: 400 });
    const velocity = useRef({ x: 0, y: 0 });
    const targetMouse = useRef({ x: 400, y: 400 });

    // 触手状态
    const [spikes, setSpikes] = useState(() => {
        return Array.from({ length: SPIKE_COUNT }, (_, i) => {
            const angle = (i / SPIKE_COUNT) * Math.PI * 2;
            return {
                angle,
                position: {
                    x: center.current.x + Math.cos(angle) * BALL_RADIUS,
                    y: center.current.y + Math.sin(angle) * BALL_RADIUS,
                },
                velocity: { x: 0, y: 0 },
                targetPosition: {
                    x:
                        center.current.x +
                        Math.cos(angle) * (BALL_RADIUS + SPIKE_LENGTH),
                    y:
                        center.current.y +
                        Math.sin(angle) * (BALL_RADIUS + SPIKE_LENGTH),
                },
            };
        });
    });

    // 创建触手路径
    const createSpikePath = (spike, index) => {
        const nextIndex = (index + 1) % SPIKE_COUNT;
        const nextSpike = spikes[nextIndex];

        const baseAngle = spike.angle;
        const nextBaseAngle = nextSpike.angle;

        // 触手根部位置
        const root1 = {
            x: center.current.x + Math.cos(baseAngle) * BALL_RADIUS,
            y: center.current.y + Math.sin(baseAngle) * BALL_RADIUS,
        };

        const root2 = {
            x: center.current.x + Math.cos(nextBaseAngle) * BALL_RADIUS,
            y: center.current.y + Math.sin(nextBaseAngle) * BALL_RADIUS,
        };

        // 触手尖端位置
        const tip1 = spike.position;
        const tip2 = nextSpike.position;

        // 计算控制点以创建平滑曲线
        const control1 = {
            x: tip1.x + Math.cos(baseAngle + Math.PI / 2) * SPIKE_THICKNESS,
            y: tip1.y + Math.sin(baseAngle + Math.PI / 2) * SPIKE_THICKNESS,
        };

        const control2 = {
            x: tip2.x + Math.cos(nextBaseAngle - Math.PI / 2) * SPIKE_THICKNESS,
            y: tip2.y + Math.sin(nextBaseAngle - Math.PI / 2) * SPIKE_THICKNESS,
        };

        // 构建路径
        return `M ${root1.x},${root1.y} 
            L ${tip1.x},${tip1.y}
            C ${control1.x},${control1.y} ${control2.x},${control2.y} ${tip2.x},${tip2.y}
            L ${root2.x},${root2.y} 
            Z`;
    };

    // 鼠标移动事件处理
    useEffect(() => {
        const handleMouseMove = (e) => {
            const rect = svgRef.current.getBoundingClientRect();
            targetMouse.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        };

        svgRef.current.addEventListener("mousemove", handleMouseMove);

        return () => {
            if (svgRef.current) {
                svgRef.current.removeEventListener(
                    "mousemove",
                    handleMouseMove
                );
            }
        };
    }, []);

    // 动画循环
    useEffect(() => {
        const update = () => {
            // 更新中心位置
            const dx = targetMouse.current.x - center.current.x;
            const dy = targetMouse.current.y - center.current.y;

            // 计算速度
            velocity.current = {
                x: center.current.x - lastCenter.current.x,
                y: center.current.y - lastCenter.current.y,
            };

            lastCenter.current = { ...center.current };

            // 移动中心点
            center.current.x += dx * ANIMATION_SPEED;
            center.current.y += dy * ANIMATION_SPEED;

            // 限制在边界内
            center.current.x = Math.max(
                BALL_RADIUS + SPIKE_LENGTH,
                Math.min(800 - BALL_RADIUS - SPIKE_LENGTH, center.current.x)
            );
            center.current.y = Math.max(
                BALL_RADIUS + SPIKE_LENGTH,
                Math.min(800 - BALL_RADIUS - SPIKE_LENGTH, center.current.y)
            );

            // 更新触手
            setSpikes((prev) => {
                return prev.map((spike, index) => {
                    const angle = (index / SPIKE_COUNT) * Math.PI * 2;

                    // 计算目标位置（考虑惯性）
                    const targetX =
                        center.current.x +
                        Math.cos(angle) * (BALL_RADIUS + SPIKE_LENGTH) -
                        velocity.current.x * INERTIA_FACTOR;
                    const targetY =
                        center.current.y +
                        Math.sin(angle) * (BALL_RADIUS + SPIKE_LENGTH) -
                        velocity.current.y * INERTIA_FACTOR;

                    // 弹簧物理系统
                    const dx = targetX - spike.position.x;
                    const dy = targetY - spike.position.y;

                    const ax = dx * STIFFNESS;
                    const ay = dy * STIFFNESS;

                    const newVx = (spike.velocity.x + ax) * DAMPING;
                    const newVy = (spike.velocity.y + ay) * DAMPING;

                    return {
                        ...spike,
                        position: {
                            x: spike.position.x + newVx,
                            y: spike.position.y + newVy,
                        },
                        velocity: {
                            x: newVx,
                            y: newVy,
                        },
                    };
                });
            });
        };

        gsap.ticker.add(update);
        return () => gsap.ticker.remove(update);
    }, []);

    return (
        <div className="container">
            <svg
                ref={svgRef}
                width="800"
                height="800"
                viewBox="0 0 800 800"
                style={{
                    background:
                        "transparent",
                }}>
                {/* 绘制所有触手 */}
                {spikes.map((spike, index) => (
                    <path
                        key={index}
                        d={createSpikePath(spike, index)}
                        fill="#000"
                        stroke="#fff"
                        strokeWidth="5"
                        opacity="0.9"
                    />
                ))}

                {/* 中心球 */}
                <circle
                    cx={center.current.x}
                    cy={center.current.y}
                    r={BALL_RADIUS}
                    fill="radial-gradient(circle at 30% 30%,rgb(255, 255, 255),rgb(0, 0, 0))"
                    stroke="#fff"
                    strokeWidth="5"
                />
            </svg>
        </div>
    );
};

export default SpikyBall;
