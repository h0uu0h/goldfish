import express from "express";

const app = express();
const PORT = process.env.PORT || 5000;

// 示例 API 路由
app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello from backend 👋" });
});

app.listen(PORT, () => {
    console.log(`✅ Backend is running on port ${PORT}`);
});
