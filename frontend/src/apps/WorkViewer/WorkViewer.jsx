/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import MagicLink from "../shared/MagicLink.jsx";
import StaplePhotoAlbum from "./StaplePhotoAlbum.jsx";
import "./WorkViewer.css";

const isVideo = (filename) => /\.(mp4|webm|ogg|mov|avi)$/i.test(filename);

const WorkViewer = ({ slug }) => {
    const [work, setWork] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/works/works.json")
            .then((res) => res.json())
            .then((data) => {
                setWork(data.find((item) => item.slug === slug) ?? null);
                setLoading(false);
            })
            .catch((error) => {
                console.error("加载作品详情失败:", error);
                setLoading(false);
            });
    }, [slug]);

    if (loading) return <div className="work-viewer-empty os-label">加载中…</div>;
    if (!work) return <div className="work-viewer-empty os-label">作品未找到</div>;

    return (
        <div className="work-viewer os-scroll">
            <div className="work-detail-content">
                <div className="work-detail-info">
                    <h1>{work.title}</h1>
                    <div className="work-meta">
                        <span className="work-description">{work.description}</span>
                        {work.link && (
                            <span className="work-link">
                                链接：{" "}
                                <MagicLink href={work.link} target="_blank" rel="noopener noreferrer">
                                    {new URL(work.link).hostname}
                                </MagicLink>
                            </span>
                        )}
                        <span className="work-category">{work.category}</span>
                        <span className="work-date">{work.year}</span>
                    </div>
                </div>
                <div className="work-detail-image">
                    {work.template === "byr" && (
                        <div className="work-viewer-album">
                            <StaplePhotoAlbum centerOffsetX={-9} centerOffsetY={9} />
                        </div>
                    )}
                    {work.detailsImage?.length > 0 ? (
                        work.detailsImage.map((src, index) =>
                            isVideo(src) ? (
                                <div key={index} className="video-container">
                                    <video controls muted preload="metadata" className="work-media">
                                        <source src={src} type={`video/${src.split(".").pop()}`} />
                                        您的浏览器不支持视频播放。
                                    </video>
                                </div>
                            ) : (
                                <img key={index} src={src} alt={`${work.title}-${index + 1}`} loading="lazy" draggable="false" className="work-media" />
                            )
                        )
                    ) : (
                        <div className="work-meta">暂无更多图片</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkViewer;
