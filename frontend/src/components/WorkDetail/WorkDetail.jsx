// components/WorkDetail.jsx
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import StaplePhotoAlbum from "./StaplePhotoAlbum";
import "./WorkDetail.css";

const WorkDetail = () => {
    const { slug } = useParams(); // 改为使用 slug
    const [work, setWork] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 从 works.json 中获取特定作品数据
        console.log("Fetching work with slug:", slug);
        fetch("/works/works.json")
            .then((response) => response.json())
            .then((data) => {
                // 根据 slug 查找作品
                const foundWork = data.find((item) => item.slug === slug);
                setWork(foundWork);
                setLoading(false);
            })
            .catch((error) => {
                console.error("加载作品详情失败:", error);
                setLoading(false);
            });
        fetch(`/works/details/${slug}.json`); // 使用 slug 获取详情
    }, [slug]); // 依赖改为 slug

    if (loading) return <div className="work-detail-loading">加载中...</div>;
    if (!work) return <div className="work-detail-error">作品未找到</div>;

    return (
        <div className="work-detail">
            <div className="work-detail-content">
                <div className="work-detail-info">
                    <h1>{work.title}</h1>
                    <div className="work-meta">
                        <span className="work-description">{work.description}</span>
                        <span className="work-category">{work.category}</span>
                        <span className="work-date">{work.year}</span>
                    </div>
                </div>
                <div className="work-detail-image">
                    {work.template === "byr" && <StaplePhotoAlbum centerOffsetX={-9} centerOffsetY={9} />}
                    {work.detailsImage && work.detailsImage.length > 0 ? (
                        work.detailsImage.map((src, index) => <img key={index} src={src} alt={`${work.title}-${index + 1}`} loading="lazy" />)
                    ) : (
                        <div className="work-meta">暂无更多图片</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkDetail;
