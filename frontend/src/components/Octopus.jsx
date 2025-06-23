import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const Octopus = () => {
    // 可调节参数
    const [config, setConfig] = useState({
        ballRadius: 26, // 中心球大小
        spikeCount: 7, // 触手数量
        spikeLength: 40, // 触手长度
        baseWidth: 25, // 根部宽度
        tipWidth: 20, // 顶部宽度
        stiffness: 0.1, // 触手弹性
        damping: 0.85, // 触手阻尼
        inertiaFactor: 0.2, // 惯性基础系数
        animationSpeed: 0.03, // 动画速度
        randomness: 0.15, // 随机性
        cornerRadius: 15, // 圆角半径
    });

    const svgRef = useRef(null);
    const pathRef = useRef(null);
    const center = useRef({ x: 400, y: 400 });
    const lastCenter = useRef({ x: 400, y: 400 });
    const velocity = useRef({ x: 0, y: 0 });
    const targetMouse = useRef({ x: 400, y: 400 });

    // 触手状态
    const spikesRef = useRef([]);

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
            const tipWidth = Math.min(
                config.tipWidth * widthFactor,
                baseWidth * 0.9
            );

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

            // Catmull-Rom to Cubic Bezier conversion
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
            if (!svgRef.current) return;

            const rect = svgRef.current.getBoundingClientRect();
            targetMouse.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        };

        const svg = svgRef.current;
        svg.addEventListener("mousemove", handleMouseMove);

        return () => {
            svg.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    // 动画循环
    useEffect(() => {
        const update = () => {
            // 更新中心位置
            const dx = targetMouse.current.x - center.current.x;
            const dy = targetMouse.current.y - center.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

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
            const maxX = 800 - config.ballRadius - config.spikeLength;
            const maxY = 800 - config.ballRadius - config.spikeLength;
            const min = config.ballRadius + config.spikeLength;

            center.current.x = Math.max(min, Math.min(maxX, center.current.x));
            center.current.y = Math.max(min, Math.min(maxY, center.current.y));

            // 更新触手
            spikesRef.current.forEach((spike) => {
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
    }, [config]);

    // 处理参数变化
    const handleConfigChange = (key, value) => {
        const numValue = Number(value);
        setConfig((prev) => ({
            ...prev,
            [key]: numValue,
        }));
    };

    // 随机化触手分布
    const randomizeSpikes = () => {
        initSpikes();
    };

    return (
        <div className="container">
            <h1>高级触手球动画</h1>

            <div className="control-panel">
                <div className="control-group">
                    <label>中心球大小: {config.ballRadius}</label>
                    <input
                        type="range"
                        min="10"
                        max="60"
                        value={config.ballRadius}
                        onChange={(e) =>
                            handleConfigChange("ballRadius", e.target.value)
                        }
                    />
                </div>

                <div className="control-group">
                    <label>触手数量: {config.spikeCount}</label>
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={config.spikeCount}
                        onChange={(e) =>
                            handleConfigChange("spikeCount", e.target.value)
                        }
                    />
                </div>

                <div className="control-group">
                    <label>触手长度: {config.spikeLength}</label>
                    <input
                        type="range"
                        min="10"
                        max="200"
                        value={config.spikeLength}
                        onChange={(e) =>
                            handleConfigChange("spikeLength", e.target.value)
                        }
                    />
                </div>

                <div className="control-group">
                    <label>根部宽度: {config.baseWidth.toFixed(1)}</label>
                    <input
                        type="range"
                        min="10"
                        max="40"
                        step="0.5"
                        value={config.baseWidth}
                        onChange={(e) =>
                            handleConfigChange("baseWidth", e.target.value)
                        }
                    />
                </div>

                <div className="control-group">
                    <label>顶部宽度: {config.tipWidth.toFixed(1)}</label>
                    <input
                        type="range"
                        min="5"
                        max="35"
                        step="0.5"
                        value={config.tipWidth}
                        onChange={(e) =>
                            handleConfigChange("tipWidth", e.target.value)
                        }
                    />
                </div>

                <div className="control-group">
                    <label>弹性: {config.stiffness.toFixed(2)}</label>
                    <input
                        type="range"
                        min="0.05"
                        max="0.5"
                        step="0.01"
                        value={config.stiffness}
                        onChange={(e) =>
                            handleConfigChange("stiffness", e.target.value)
                        }
                    />
                </div>

                <div className="control-group">
                    <label>阻尼: {config.damping.toFixed(2)}</label>
                    <input
                        type="range"
                        min="0.5"
                        max="0.99"
                        step="0.01"
                        value={config.damping}
                        onChange={(e) =>
                            handleConfigChange("damping", e.target.value)
                        }
                    />
                </div>

                <div className="control-group">
                    <label>惯性系数: {config.inertiaFactor.toFixed(2)}</label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={config.inertiaFactor}
                        onChange={(e) =>
                            handleConfigChange("inertiaFactor", e.target.value)
                        }
                    />
                </div>

                <div className="control-group">
                    <label>动画速度: {config.animationSpeed.toFixed(3)}</label>
                    <input
                        type="range"
                        min="0.001"
                        max="0.1"
                        step="0.001"
                        value={config.animationSpeed}
                        onChange={(e) =>
                            handleConfigChange("animationSpeed", e.target.value)
                        }
                    />
                </div>

                <div className="control-group">
                    <label>圆角半径: {config.cornerRadius}</label>
                    <input
                        type="range"
                        min="0"
                        max="50"
                        step="1"
                        value={config.cornerRadius}
                        onChange={(e) =>
                            handleConfigChange("cornerRadius", e.target.value)
                        }
                    />
                </div>
                <div className="control-group">
                    <label>随机性: {config.randomness.toFixed(2)}</label>
                    <input
                        type="range"
                        min="0"
                        max="0.8"
                        step="0.05"
                        value={config.randomness}
                        onChange={(e) =>
                            handleConfigChange("randomness", e.target.value)
                        }
                    />
                </div>

                <button className="randomize-btn" onClick={randomizeSpikes}>
                    随机化触手
                </button>
            </div>

            <div className="instruction">
                <p>移动鼠标拖动触手球，观察触手摆动效果</p>
            </div>

            <svg
                ref={svgRef}
                width="800"
                height="800"
                viewBox="0 0 800 800"
                style={{
                    background: "radial-gradient(circle, #1a1a2e, #16213e)",
                }}>
                <defs>
                    <radialGradient
                        id="ballGradient"
                        cx="50%"
                        cy="50%"
                        r="50%"
                        fx="30%"
                        fy="30%">
                        <stop offset="0%" stopColor="#4facfe" />
                        <stop offset="100%" stopColor="#00f2fe" />
                    </radialGradient>

                    <linearGradient
                        id="spikeGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%">
                        <stop offset="0%" stopColor="#4facfe" />
                        <stop offset="100%" stopColor="#00f2fe" />
                    </linearGradient>

                    <filter
                        id="glow"
                        x="-50%"
                        y="-50%"
                        width="200%"
                        height="200%">
                        <feGaussianBlur
                            in="SourceGraphic"
                            stdDeviation="5"
                            result="blur"
                        />
                        <feBlend in="SourceGraphic" in2="blur" mode="lighten" />
                    </filter>
                </defs>

                {/* 触手路径 */}
                <path
                    ref={pathRef}
                    d=""
                    fill="url(#spikeGradient)"
                    stroke="#00f2fe"
                    strokeWidth="1.5"
                    opacity="0.85"
                    filter="url(#glow)"
                />
            </svg>
        </div>
    );
};

export default Octopus;
