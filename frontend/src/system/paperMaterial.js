// 硫酸纸参数由材质实验室与窗口底层共享。
// 纸面微结构使用 @paper-design/shaders 的 PaperTexture；这里仅负责参数、透光与降级样式。
export const PAPER_STORAGE_KEY = "goldfish.paperlab";
export const PAPER_MOTION_EVENT = "goldfish:paper-motion";
export const PAPER_MATERIAL_EVENT = "goldfish:paper-material";

export const PAPER_DEFAULTS = {
    version: 2,
    alpha: 0.63, blur: 14, saturate: 0.7, warmth: 0.15, formation: 0.74,
    fiberStyle: "custom", fiber: 0.38, fiberSize: 0.3, roughness: 0.3, fiberSeed: 739,
    contrast: 0.48, fade: 0.28, drops: 0.025,
    edge: 0.1, shadow: 0.12,
};

// 同一套公开 shader 的不同参数预设。选择类型时会把预设值写进滑杆，仍可继续微调。
export const FIBER_STYLES = [
    { value: "custom", label: "默认硫酸纸", hint: "当前默认纸面：薄透、疏纤维与柔和投影。", preset: { fiber: 0.38, fiberSize: 0.3, roughness: 0.3, drops: 0.025 } },
    {
        value: "pressed", label: "细密硫酸纸",
        hint: "小尺度、低对比的压制纸浆，纤维不会像线稿一样盖在内容上。",
        preset: { fiber: 0.27, fiberSize: 0.16, roughness: 0.22, drops: 0.02 },
    },
    {
        value: "cloud", label: "松散云絮",
        hint: "纤维团更大、纸浆起伏更明显，接近无纺纸的透光斑驳。",
        preset: { fiber: 0.38, fiberSize: 0.3, roughness: 0.3, drops: 0.025 },
    },
    {
        value: "kozo", label: "疏纤纸浆",
        hint: "较粗、较疏的纤维尺度；这是程序化纸感，不冒充扫描到的真实桑皮长丝。",
        preset: { fiber: 0.46, fiberSize: 0.46, roughness: 0.26, drops: 0.035 },
    },
    {
        value: "cross", label: "粗粒混合",
        hint: "粗糙度和纸浆杂点更强，适合再生纸或厚纸的感觉。",
        preset: { fiber: 0.34, fiberSize: 0.23, roughness: 0.46, drops: 0.12 },
    },
];

const RANGES = {
    alpha: [0.4, 1], blur: [0, 40], saturate: [0.5, 2], warmth: [0, 1], formation: [0, 1],
    fiber: [0, 1], fiberSize: [0.01, 1], roughness: [0, 1], fiberSeed: [1, 999999],
    contrast: [0, 1], fade: [0, 1], drops: [0, 1],
    edge: [0, 1], shadow: [0, 0.6],
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const svgUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

export function normalizePaperParams(value = {}) {
    const raw = value && typeof value === "object" ? value : {};
    const next = { ...PAPER_DEFAULTS };
    for (const [key, [min, max]] of Object.entries(RANGES)) {
        const number = Number(raw[key] ?? PAPER_DEFAULTS[key]);
        next[key] = clamp(Number.isFinite(number) ? number : PAPER_DEFAULTS[key], min, max);
    }
    if (FIBER_STYLES.some((item) => item.value === raw.fiberStyle)) next.fiberStyle = raw.fiberStyle;

    // 把上一版的 Bezier/SVG 参数迁移到 PaperTexture 参数，避免用户原来的设置突然归零。
    if (raw.fiber == null && Number.isFinite(Number(raw.fiberOpacity))) {
        next.fiber = clamp(Number(raw.fiberOpacity) * 0.72, 0, 1);
    }
    if (raw.fiberSize == null && Number.isFinite(Number(raw.fiberWidth))) {
        next.fiberSize = clamp(0.06 + Number(raw.fiberWidth) * 0.28, 0.01, 1);
    }
    if (raw.roughness == null && Number.isFinite(Number(raw.fiberChaos))) {
        next.roughness = clamp(0.12 + Number(raw.fiberChaos) * 0.32, 0, 1);
    }
    if (raw.version !== 2 && Number.isFinite(Number(raw.edge))) next.edge = clamp(Number(raw.edge) * 0.35, 0, 1);

    next.version = 2;
    next.fiberSeed = Math.round(next.fiberSeed);
    return next;
}

function buildFormationImage(params) {
    const alpha = (params.formation * 0.25).toFixed(3);
    return svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='620' height='460'>
        <filter id='f' x='-20%' y='-20%' width='140%' height='140%'><feTurbulence type='fractalNoise' baseFrequency='.007 .011' numOctaves='4' seed='${(params.fiberSeed * 13 + 71) % 997}' stitchTiles='stitch'/><feGaussianBlur stdDeviation='3'/><feColorMatrix type='matrix' values='0 0 0 0 .42 0 0 0 0 .43 0 0 0 0 .40 0 0 0 ${alpha} 0'/></filter><rect width='620' height='460' filter='url(#f)'/></svg>`);
}

export function paperShaderParams(value) {
    const p = normalizePaperParams(value);
    return {
        contrast: p.contrast,
        roughness: p.roughness,
        fiber: p.fiber,
        fiberSize: p.fiberSize,
        drops: p.drops,
        fade: p.fade,
        seed: p.fiberSeed % 1000,
        warmth: p.warmth,
    };
}

export function paperCssVars(value) {
    const p = normalizePaperParams(value);
    const shader = paperShaderParams(p);
    const edgeAlpha = 0.012 + p.edge * 0.14;
    return {
        "--paper-rgb": `255, ${Math.round(255 - 5 * p.warmth)}, ${Math.round(255 - 15 * p.warmth)}`,
        "--paper-alpha": String(p.alpha),
        "--paper-blur": `${p.blur}px`,
        "--paper-saturate": String(p.saturate),
        "--paper-formation-img": buildFormationImage(p),
        "--paper-shader-contrast": String(shader.contrast),
        "--paper-shader-roughness": String(shader.roughness),
        "--paper-shader-fiber": String(shader.fiber),
        "--paper-shader-fiber-size": String(shader.fiberSize),
        "--paper-shader-drops": String(shader.drops),
        "--paper-shader-fade": String(shader.fade),
        "--paper-edge-color": `rgba(54, 55, 50, ${edgeAlpha.toFixed(3)})`,
        "--paper-edge-soft": `rgba(54, 55, 50, ${(edgeAlpha * 0.5).toFixed(3)})`,
        "--paper-edge-light": `rgba(255, 255, 255, ${(0.22 + p.edge * 0.3).toFixed(3)})`,
        "--paper-edge-shade": `rgba(54, 50, 43, ${(0.045 + p.edge * 0.12).toFixed(3)})`,
        "--paper-shadow": `0 1px 2px rgba(38, 32, 24, ${(p.shadow * 0.55).toFixed(3)}), 0 8px 18px -6px rgba(38, 32, 24, ${(p.shadow * 0.7).toFixed(3)}), 0 24px 56px -12px rgba(38, 32, 24, ${p.shadow})`,
        "--paper-shadow-rest": `0 1px 2px rgba(38, 32, 24, ${(p.shadow * 0.35).toFixed(3)}), 0 8px 24px -8px rgba(38, 32, 24, ${(p.shadow * 0.65).toFixed(3)})`,
    };
}

export function applyPaperMaterial(value, vars = paperCssVars(value)) {
    const params = normalizePaperParams(value);
    const root = document.documentElement;
    for (const [key, cssValue] of Object.entries(vars)) root.style.setProperty(key, cssValue);
    window.dispatchEvent(new CustomEvent(PAPER_MATERIAL_EVENT, {
        detail: { params, shader: paperShaderParams(params) },
    }));
    return params;
}

export function loadPaperMaterial() {
    try {
        const saved = JSON.parse(localStorage.getItem(PAPER_STORAGE_KEY) ?? "{}");
        // Migrate only the untouched former default, keeping customized papers intact.
        const old = { alpha: 0.82, blur: 12, saturate: 0.92, warmth: 0.12, formation: 0.42,
            fiber: 0.27, fiberSize: 0.16, roughness: 0.22, fiberSeed: 3471,
            contrast: 0.28, fade: 0.08, drops: 0.02, edge: 0.06, shadow: 0.16 };
        return normalizePaperParams(saved && Object.entries(old).every(([key, value]) => saved[key] === value) ? {} : saved);
    }
    catch { return { ...PAPER_DEFAULTS }; }
}

export function savePaperMaterial(value) {
    try { localStorage.setItem(PAPER_STORAGE_KEY, JSON.stringify(normalizePaperParams(value))); }
    catch { /* 隐私模式下仍保留页面内效果。 */ }
}

export function hydratePaperMaterial() {
    return applyPaperMaterial(loadPaperMaterial());
}
