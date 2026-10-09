import { useEffect, useState } from "react";
import { useWallpaper } from "./WallpaperContext.jsx";
import "./Wallpaper.css";

// 双层交叉淡入：新壁纸预加载完成后淡入，旧的留在底层
const Wallpaper = () => {
    const { current } = useWallpaper();
    const [layers, setLayers] = useState([]); // [{id, src, color}]

    useEffect(() => {
        if (!current) return;
        let cancelled = false;
        const img = new Image();
        img.src = current.src;
        img.onload = () => {
            if (cancelled) return;
            setLayers((prev) => [...prev.slice(-1), { id: current.id, src: current.src, color: current.avgColor }]);
        };
        return () => {
            cancelled = true;
        };
    }, [current]);

    return (
        <div className="os-wallpaper" style={{ background: current?.avgColor ?? "#0d0d0d" }} aria-hidden="true">
            {layers.map((layer) => (
                <div key={layer.id} className="os-wallpaper-layer" style={{ backgroundImage: `url(${layer.src})` }} />
            ))}
        </div>
    );
};

export default Wallpaper;
