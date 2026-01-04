import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config(); // 读取 .env 文件

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
// 必须配置解析 JSON 请求体，否则 req.body 会是 undefined
app.use(express.json());

// === 1. 搬运常量定义 ===
const BiomePromptNames = {
    'BEACH': '潮汐涨落的海边',
    'MOUNTAIN': '幽静的风吹松林山谷',
    'FISHTANK': '略显拥挤的家庭鱼缸内部',
    'DESERT': '风沙呼啸的荒凉沙漠',
    'RAINFOREST': '潮湿阴暗的苔藓森林',
    'TUNDRA': '极度寒冷的冰川极地',
    'HOT_SPRING': '温暖且充满蒸汽的温泉边',
    'VOLCANO': '危险的火山口边缘',
    'THEME_PARK': '风中呜咽的废弃游乐园',
    'OLD_HOUSE': '有着灵异气息的日式老宅院',
    'SEWER': '阴暗潮湿的城市下水道',
    'TEMPLE': '充满禅意的古老寺院',
};

const StoneMoods = [
    "没睡醒的", "饥肠辘辘把什么都当食物的", "有点神经质的",
    "充满哲学思考的", "嫌弃一切的洁癖", "像个好奇宝宝的",
    "老气横秋的", "充满童真的", "有点暴躁的",
];

// === 2. 新增 API 路由 ===
app.post("/api/sensory-feedback", async (req, res) => {
    try {
        // 从前端获取参数
        const { biome, objectType, distance, year } = req.body;

        // 逻辑处理
        const biomeName = BiomePromptNames[biome] || biome;
        const currentMood = StoneMoods[Math.floor(Math.random() * StoneMoods.length)];

        // 构建 Prompt (原样搬运)
        const prompt = `
        【角色设定】
        你是一块位于 ${biomeName} 的石头。当前年份 ${year}。
        状态：你现在是"${currentMood}"。
        感官：你完全**看不见**，只能通过**触觉**（纹理/温度/湿度/痛感）和**听觉**（振动/频率）感知。

        【当前事件】
        如果你伸出不存在的手，摸到了距离 ${Number(distance).toFixed(1)} 米处的一个"${objectType}"。

        【任务要求】
        1. **描述**：用"${currentMood}"的语气描述这个触感。
        2. **通感**：必须使用**比喻**。把它比作食物、生活用品或身体部位。
        3. **禁忌**：绝对禁止出现视觉词汇。不要直接说出"${objectType}"的名字。
        4. **长度**：30字以内。
        5. **拟声词**：给出一个生动的、非传统的拟声词。

        【返回格式】
        仅返回JSON：
        {
            "description": "触觉描述内容",
            "soundEffect": "拟声词"
        }
        `;

        // 调用 DeepSeek API
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` // 注意这里变成 process.env
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: '你是一个严格的JSON生成器。请只返回有效的JSON，不要添加任何解释性文字。' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 150,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`DeepSeek API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // 解析 JSON 逻辑 (也可以直接返回 string 给前端解析，但在后端做更干净)
        let result;
        try {
            result = JSON.parse(content);
        } catch {
            const descriptionMatch = content.match(/"description":\s*"([^"]*)"/) || content.match(/description[：:]\s*([^\n"]*)/);
            const soundEffectMatch = content.match(/"soundEffect":\s*"([^"]*)"/) || content.match(/soundEffect[：:]\s*([^\n"]*)/);
            result = {
                description: descriptionMatch ? descriptionMatch[1].trim() : "你感觉到黑暗中某种模糊的存在。",
                soundEffect: soundEffectMatch ? soundEffectMatch[1].trim() : "嗡..."
            };
        }

        // 成功返回给前端
        res.json(result);

    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({
            description: "你感觉到黑暗中某种模糊的存在。",
            soundEffect: "嗡..."
        });
    }
});

// ... 其他路由 (如 /api/hello) ...

app.listen(PORT, () => {
    console.log(`✅ Backend is running on port ${PORT}`);
});