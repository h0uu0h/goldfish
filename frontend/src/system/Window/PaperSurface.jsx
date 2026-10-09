/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { PaperTexture } from "@paper-design/shaders-react";
import {
    PAPER_MATERIAL_EVENT,
    loadPaperMaterial,
    paperShaderParams,
} from "../paperMaterial.js";

// Material rendering is provided by Paper Shaders (Apache-2.0):
// https://github.com/paper-design/shaders
// The canvas is a static paper layer below the live DOM content. The package stops its RAF at speed=0.
const PaperSurface = ({ seed, className = "" }) => {
    const [material, setMaterial] = useState(() => paperShaderParams(loadPaperMaterial()));

    useEffect(() => {
        const update = (event) => setMaterial(event.detail?.shader ?? paperShaderParams(loadPaperMaterial()));
        window.addEventListener(PAPER_MATERIAL_EVENT, update);
        return () => window.removeEventListener(PAPER_MATERIAL_EVENT, update);
    }, []);

    const shaderSeed = useMemo(() => (material.seed + seed * 0.173) % 1000, [material.seed, seed]);
    const frontAlpha = 0.36 + material.fiber * 0.16;
    const backAlpha = 0.1 + material.contrast * 0.13;
    const warmBlue = Math.round(248 - material.warmth * 14);

    return (
        <PaperTexture
            className={["os-paper-shader", className].filter(Boolean).join(" ")}
            aria-hidden="true"
            speed={0}
            frame={0}
            fit="cover"
            scale={0.72}
            minPixelRatio={1}
            maxPixelCount={500000}
            colorFront={`rgba(255, 253, ${warmBlue}, ${frontAlpha})`}
            colorBack={`rgba(82, 85, 78, ${backAlpha})`}
            contrast={material.contrast}
            roughness={material.roughness}
            fiber={material.fiber}
            fiberSize={material.fiberSize}
            crumples={0}
            folds={0}
            drops={material.drops}
            fade={material.fade}
            seed={shaderSeed}
            webGlContextAttributes={{ alpha: true, antialias: false, premultipliedAlpha: true }}
        />
    );
};

export default PaperSurface;
