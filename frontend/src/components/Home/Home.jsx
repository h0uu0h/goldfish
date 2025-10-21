import "./Home.css";

const Home = () => {
    // 模拟作品数据
    const artworks = [
        {
            id: 1,
            title: "山间日出",
            artist: "张三",
            image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            category: "风景",
            likes: 128,
            date: "2023-10-15",
        },
        {
            id: 2,
            title: "城市夜景",
            artist: "李四",
            image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            category: "城市",
            likes: 95,
            date: "2023-09-22",
        },
        {
            id: 3,
            title: "抽象艺术",
            artist: "王五",
            image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            category: "抽象",
            likes: 156,
            date: "2023-11-05",
        },
        {
            id: 4,
            title: "海边日落",
            artist: "赵六",
            image: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            category: "自然",
            likes: 203,
            date: "2023-08-30",
        },
        {
            id: 5,
            title: "静物摄影",
            artist: "钱七",
            image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            category: "摄影",
            likes: 87,
            date: "2023-10-08",
        },
        {
            id: 6,
            title: "数字艺术",
            artist: "孙八",
            image: "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            category: "数字艺术",
            likes: 312,
            date: "2023-11-20",
        },
        {
            id: 1,
            title: "山间日出",
            artist: "张三",
            image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            category: "风景",
            likes: 128,
            date: "2023-10-15",
        },
        {
            id: 2,
            title: "城市夜景",
            artist: "李四",
            image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            category: "城市",
            likes: 95,
            date: "2023-09-22",
        },
        {
            id: 3,
            title: "抽象艺术",
            artist: "王五",
            image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            category: "抽象",
            likes: 156,
            date: "2023-11-05",
        },
        {
            id: 4,
            title: "海边日落",
            artist: "赵六",
            image: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            category: "自然",
            likes: 203,
            date: "2023-08-30",
        },
        {
            id: 5,
            title: "静物摄影",
            artist: "钱七",
            image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            category: "摄影",
            likes: 87,
            date: "2023-10-08",
        },
        {
            id: 6,
            title: "数字艺术",
            artist: "孙八",
            image: "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            category: "数字艺术",
            likes: 312,
            date: "2023-11-20",
        },
    ];

    return (
        <div className="home">
            <div className="home-container">
                <div className="works-grid">
                    {artworks.map((artwork) => (
                        <div key={artwork.id} className="artwork-card">
                            <div className="artwork-image">
                                <img src={artwork.image} alt={artwork.title} />
                                <div className="artwork-overlay">
                                    <button className="view-btn">
                                        查看详情
                                    </button>
                                    <button className="like-btn">
                                        ❤️ {artwork.likes}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;
