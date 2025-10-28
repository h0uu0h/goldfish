// components/WorkDetail.jsx
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import "./WorkDetail.css";

const WorkDetail = () => {
    const { slug } = useParams(); // 改为使用 slug
    const [work, setWork] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 从 works.json 中获取特定作品数据
        console.log("Fetching work with slug:", slug);
        fetch("/goldfish/works/works.json")
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
    }, [slug]); // 依赖改为 slug

    if (loading) return <div className="work-detail-loading">加载中...</div>;
    if (!work) return <div className="work-detail-error">作品未找到</div>;

    return (
        <div className="work-detail">
            <div className="work-detail-content">
                <div className="work-detail-info">
                    <h1>{work.title}</h1>
                    <div className="work-meta">
                        <span className="work-category">{work.category}</span>
                        <span className="work-date">{work.year}</span>
                    </div>
                </div>
                <div className="work-detail-image">
                    <img src={work.image} alt={work.title} />
                </div>
            </div>
        </div>
    );
};

export default WorkDetail;
