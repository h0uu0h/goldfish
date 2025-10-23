/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const Octopus = ({ isPinned, isSidebarCollapsed }) => {
    // 可调节参数
    const [config, setConfig] = useState({
        fillColor: "#000", //填充颜色
        strokeColor: "#fff", //描边颜色
        backgroundColor: "rgba(0, 0, 0, 0)", //背景颜色
        borderWidth: 2, // 描边大小
        ballRadius: 8, // 中心球大小
        spikeCount: 7, // 触手数量
        spikeLength: 8, // 触手长度
        baseWidth: 8, // 根部宽度
        tipWidth: 6, // 顶部宽度
        blurAmount: 0, //模糊大小
        stiffness: 0.1, // 触手弹性
        damping: 0.85, // 触手阻尼
        inertiaFactor: 0.2, // 惯性基础系数
        animationSpeed: 0.03, // 动画速度
        randomness: 0.1, // 随机性
        rotateSpeed: 0.05, // 旋转速度
    });
    const svgRef = useRef(null);
    const pathRef = useRef(null);
    const center = useRef({ x: 400, y: 400 });
    const lastCenter = useRef({ x: 400, y: 400 });
    const velocity = useRef({ x: 0, y: 0 });
    const targetMouse = useRef({ x: 400, y: 400 });
    const isRotating = useRef(false);

    // 触手状态
    const spikesRef = useRef([]);
    const [svgSize, setSvgSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    const svgSizeRef = useRef(svgSize);

    useEffect(() => {
        svgSizeRef.current = svgSize;
    }, [svgSize]);

    useEffect(() => {
        const handleResize = () => {
            setSvgSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // 计算固定位置
    const getPinnedPosition = () => {
        const sidebarWidth = isSidebarCollapsed ? 50 : 360; // 根据侧边栏状态调整宽度
        const headerHeight = 50;

        return {
            x: sidebarWidth / 2,
            y: headerHeight / 2,
        };
    };

    // 当固定状态或侧边栏状态改变时，重新定位
    useEffect(() => {
        if (isPinned) {
            const pinnedPos = getPinnedPosition();
            center.current = pinnedPos;
            lastCenter.current = { ...pinnedPos };
            targetMouse.current = { ...pinnedPos };

            // 重置速度
            velocity.current = { x: 0, y: 0 };

            // 重新初始化触手位置
            initSpikes();
        }
    }, [isPinned, isSidebarCollapsed]);

    // 初始化触手
    const initSpikes = () => {
        const newSpikes = [];

        for (let i = 0; i < config.spikeCount; i++) {
            // 基本角度（均匀分布）
            const baseAngle = (i / config.spikeCount) * Math.PI * 2;

            // 随机倾斜角度（0到π/4之间）
            const skewAngle =
                (Math.random() - 0.5) * Math.PI * config.randomness;

            // 随机宽度因子（0.7到1.0之间）
            const widthFactor = 0.7 + Math.random() * 0.3;

            // 计算实际宽度（确保顶部宽度不超过根部宽度）
            const baseWidth = config.baseWidth * widthFactor;
            const tipWidth = config.tipWidth * widthFactor;

            newSpikes.push({
                id: i,
                baseAngle,
                skewAngle,
                baseWidth,
                tipWidth,
                position: {
                    x:
                        center.current.x +
                        Math.cos(baseAngle + skewAngle) *
                            (config.ballRadius + config.spikeLength),
                    y:
                        center.current.y +
                        Math.sin(baseAngle + skewAngle) *
                            (config.ballRadius + config.spikeLength),
                },
                velocity: { x: 0, y: 0 },
                basePosition: {
                    x:
                        center.current.x +
                        Math.cos(baseAngle) * config.ballRadius,
                    y:
                        center.current.y +
                        Math.sin(baseAngle) * config.ballRadius,
                },
                // 质量与宽度相关（用于惯性计算）
                mass: (baseWidth + tipWidth) / 2,
            });
        }

        spikesRef.current = newSpikes;
    };

    // 初始化触手
    useEffect(() => {
        initSpikes();
    }, [config]);

    function getSmoothPath(points, closed = true) {
        if (points.length < 2) return "";

        let d = `M ${points[0].x},${points[0].y}`;
        for (let i = 0; i < points.length; i++) {
            const p0 = points[(i - 1 + points.length) % points.length];
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            const p3 = points[(i + 2) % points.length];

            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
        }

        if (closed) {
            d += " Z";
        }

        return d;
    }

    const createPath = () => {
        const spikes = spikesRef.current;
        if (spikes.length === 0) return "";

        const outlinePoints = [];

        for (let i = 0; i < spikes.length; i++) {
            const spike = spikes[i];

            const dx = spike.position.x - spike.basePosition.x;
            const dy = spike.position.y - spike.basePosition.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const nx = dx / len;
            const ny = dy / len;

            const perpX = -ny;
            const perpY = nx;

            // 外侧顺序：baseLeft → tipLeft → tipRight → baseRight
            outlinePoints.push({
                x: spike.basePosition.x - (perpX * spike.baseWidth) / 2,
                y: spike.basePosition.y - (perpY * spike.baseWidth) / 2,
            });

            outlinePoints.push({
                x: spike.position.x - (perpX * spike.tipWidth) / 2,
                y: spike.position.y - (perpY * spike.tipWidth) / 2,
            });

            outlinePoints.push({
                x: spike.position.x + (perpX * spike.tipWidth) / 2,
                y: spike.position.y + (perpY * spike.tipWidth) / 2,
            });

            outlinePoints.push({
                x: spike.basePosition.x + (perpX * spike.baseWidth) / 2,
                y: spike.basePosition.y + (perpY * spike.baseWidth) / 2,
            });
        }

        // 使用平滑路径
        return getSmoothPath(outlinePoints, true);
    };

    // 鼠标移动事件处理
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!svgRef.current || isPinned) return; // 固定状态下不跟随鼠标

            const rect = svgRef.current.getBoundingClientRect();
            targetMouse.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        };

        const svg = svgRef.current;
        window.addEventListener("mousemove", handleMouseMove);
        const handleMouseDown = () => {
            isRotating.current = true;
        };
        const handleMouseUp = () => {
            isRotating.current = false;
        };

        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
            svg.removeEventListener("mousemove", handleMouseMove);
        };
    }, [isPinned]);

    // 计算固定时的容器尺寸和viewBox
    const getPinnedDimensions = () => {
        const sidebarWidth = isSidebarCollapsed ? 50 : 360;
        const headerHeight = 50;

        return {
            width: sidebarWidth,
            height: headerHeight,
            viewBoxWidth: sidebarWidth,
            viewBoxHeight: headerHeight,
        };
    };

    // 动画循环
    useEffect(() => {
        const update = () => {
            if (isPinned) {
                // 固定状态下，根据侧边栏状态调整位置
                const pinnedPos = getPinnedPosition();
                center.current = pinnedPos;
            } else {
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
                center.current.x += dx * config.animationSpeed;
                center.current.y += dy * config.animationSpeed;

                // 限制在边界内
                const maxX =
                    svgSizeRef.current.width -
                    config.ballRadius -
                    config.spikeLength;
                const maxY =
                    svgSizeRef.current.height -
                    config.ballRadius -
                    config.spikeLength;
                const min = config.ballRadius + config.spikeLength;

                center.current.x = Math.max(
                    min,
                    Math.min(maxX, center.current.x)
                );
                center.current.y = Math.max(
                    min,
                    Math.min(maxY, center.current.y)
                );
            }

            // 更新触手
            spikesRef.current.forEach((spike) => {
                if (isRotating.current) {
                    spike.baseAngle += config.rotateSpeed;
                }

                // 更新基点位置（跟随中心球）
                spike.basePosition = {
                    x:
                        center.current.x +
                        Math.cos(spike.baseAngle) * config.ballRadius,
                    y:
                        center.current.y +
                        Math.sin(spike.baseAngle) * config.ballRadius,
                };

                // 计算目标位置（考虑倾斜角度和惯性）
                const targetX =
                    center.current.x +
                    Math.cos(spike.baseAngle + spike.skewAngle) *
                        (config.ballRadius + config.spikeLength) -
                    velocity.current.x *
                        config.inertiaFactor *
                        (1 + spike.mass / 50);

                const targetY =
                    center.current.y +
                    Math.sin(spike.baseAngle + spike.skewAngle) *
                        (config.ballRadius + config.spikeLength) -
                    velocity.current.y *
                        config.inertiaFactor *
                        (1 + spike.mass / 50);

                // 弹簧物理系统（质量影响惯性）
                const dx = targetX - spike.position.x;
                const dy = targetY - spike.position.y;

                // 质量越大，加速度越小（惯性越大）
                const massFactor = 1 + spike.mass / 50;
                const ax = (dx * config.stiffness) / massFactor;
                const ay = (dy * config.stiffness) / massFactor;

                const newVx = (spike.velocity.x + ax) * config.damping;
                const newVy = (spike.velocity.y + ay) * config.damping;

                spike.position.x += newVx;
                spike.position.y += newVy;
                spike.velocity.x = newVx;
                spike.velocity.y = newVy;
            });

            // 更新路径
            if (pathRef.current) {
                const d = createPath();
                pathRef.current.setAttribute("d", d);
            }
        };

        const ticker = gsap.ticker.add(update);
        return () => gsap.ticker.remove(ticker);
    }, [config, isPinned, isSidebarCollapsed]);

    const pinnedDimensions = getPinnedDimensions();

    return (
        <div
            className={`cursor-container ${isPinned ? "pinned" : ""}`}
            style={{
                zIndex: isPinned ? 1001 : "auto",
                width: isPinned ? `${pinnedDimensions.width}px` : "100%",
                height: isPinned ? `${pinnedDimensions.height}px` : "100%",
                left: isPinned ? 0 : "auto",
                top: isPinned ? 0 : "auto",
            }}>
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox={`0 0 ${
                    isPinned ? pinnedDimensions.viewBoxWidth : svgSize.width
                } ${
                    isPinned ? pinnedDimensions.viewBoxHeight : svgSize.height
                }`}
                style={{
                    background: config.backgroundColor,
                }}>
                {/* 触手路径 */}
                <path
                    ref={pathRef}
                    d=""
                    fill={config.fillColor}
                    stroke={config.strokeColor}
                    strokeWidth={config.borderWidth}
                    filter="url(#glow)"
                />
            </svg>
        </div>
    );
};

export default Octopus;
