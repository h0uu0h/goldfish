#!/usr/bin/env node
// ============================================================
// 从 Pexels 拉取一批壁纸，生成 frontend/public/wallpapers/manifest.json
//
// 用法：PEXELS_API_KEY=xxx node scripts/fetch-wallpapers.mjs
// 本地挂代理时加 NODE_USE_ENV_PROXY=1（Node fetch 默认不读代理环境变量）。
// 由 .github/workflows/wallpapers.yml 每周自动执行。
// ============================================================
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const API_KEY = process.env.PEXELS_API_KEY;
if (!API_KEY) {
    console.error("缺少 PEXELS_API_KEY 环境变量。");
    console.error("去 https://www.pexels.com/api/ 免费注册一个 key，");
    console.error("本地：PEXELS_API_KEY=xxx node scripts/fetch-wallpapers.mjs");
    console.error("CI：  在 GitHub 仓库 Settings → Secrets → Actions 里添加 PEXELS_API_KEY");
    process.exit(1);
}

// 主题词池：自然风光 / 金鱼水生物 / 外太空
const QUERY_POOL = [
    "goldfish",
    "koi fish pond",
    "jellyfish",
    "underwater ocean",
    "coral reef",
    "nebula galaxy",
    "milky way night sky",
    "aurora borealis",
    "mountain landscape fog",
    "forest mist",
    "ocean waves aerial",
    "desert dunes",
];

// 人工精选：每周刷新时始终保留，其余位置才从 Pexels 重新挑选。
const FIXED_WALLPAPERS = [
    {
        id: "8133234",
        src: "https://images.pexels.com/photos/8133234/pexels-photo-8133234.jpeg?auto=compress&cs=tinysrgb&w=2400",
        thumb: "https://images.pexels.com/photos/8133234/pexels-photo-8133234.jpeg?auto=compress&cs=tinysrgb&w=480",
        photographer: "İkbal Akyol",
        photographerUrl: "https://www.pexels.com/@i-kbal-akyol-59966593",
        pexelsUrl: "https://www.pexels.com/photo/close-up-photo-of-gold-fish-in-aquarium-8133234/",
        avgColor: "#897B72",
        query: "curated goldfish",
    },
    {
        id: "19680232",
        src: "https://images.pexels.com/photos/19680232/pexels-photo-19680232.jpeg?auto=compress&cs=tinysrgb&w=2400",
        thumb: "https://images.pexels.com/photos/19680232/pexels-photo-19680232.jpeg?auto=compress&cs=tinysrgb&w=480",
        photographer: "Stacey Koenitz",
        photographerUrl: "https://www.pexels.com/@goldcircuits",
        pexelsUrl: "https://www.pexels.com/photo/close-up-of-goldfishes-19680232/",
        avgColor: "#8A6F66",
        query: "curated goldfish",
    },
    {
        id: "19680210",
        src: "https://images.pexels.com/photos/19680210/pexels-photo-19680210.jpeg?auto=compress&cs=tinysrgb&w=2400",
        thumb: "https://images.pexels.com/photos/19680210/pexels-photo-19680210.jpeg?auto=compress&cs=tinysrgb&w=480",
        photographer: "Stacey Koenitz",
        photographerUrl: "https://www.pexels.com/@goldcircuits",
        pexelsUrl: "https://www.pexels.com/photo/19680210/",
        avgColor: "#945F40",
        query: "curated goldfish",
    },
];

const TOTAL_WALLPAPERS = 20;
const ROTATING_WALLPAPERS = TOTAL_WALLPAPERS - FIXED_WALLPAPERS.length;
const PICK_QUERIES = 5; // 每次随机选几个主题
const PER_QUERY = 4; // 每个主题取几个候选
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "frontend", "public", "wallpapers", "manifest.json");

function shuffle(list) {
    return [...list].sort(() => Math.random() - 0.5);
}

async function search(query) {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&size=large&per_page=24`;
    const res = await fetch(url, { headers: { Authorization: API_KEY } });
    if (!res.ok) throw new Error(`Pexels API ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return shuffle(data.photos ?? [])
        .slice(0, PER_QUERY)
        .map((photo) => ({
            id: String(photo.id),
            src: `${photo.src.original}?auto=compress&cs=tinysrgb&w=2400`,
            thumb: `${photo.src.original}?auto=compress&cs=tinysrgb&w=480`,
            photographer: photo.photographer,
            photographerUrl: photo.photographer_url,
            pexelsUrl: photo.url,
            avgColor: photo.avg_color,
            query,
        }));
}

const queries = shuffle(QUERY_POOL).slice(0, PICK_QUERIES);
console.log("本次主题:", queries.join(", "));

const batches = [];
for (const query of queries) {
    try {
        const photos = await search(query);
        console.log(`  ${query}: ${photos.length} 张`);
        batches.push(...photos);
    } catch (error) {
        console.error(`  ${query} 拉取失败:`, error.message);
    }
}

const fixedIds = new Set(FIXED_WALLPAPERS.map((photo) => photo.id));
const rotating = [...new Map(batches.filter((photo) => !fixedIds.has(photo.id)).map((photo) => [photo.id, photo])).values()];

if (rotating.length < ROTATING_WALLPAPERS) {
    console.error(`只拿到 ${rotating.length} 张可轮换壁纸（需要 ${ROTATING_WALLPAPERS} 张），保留旧清单不覆盖。`);
    process.exit(1);
}

const wallpapers = [...FIXED_WALLPAPERS, ...shuffle(rotating).slice(0, ROTATING_WALLPAPERS)];
await writeFile(OUT, JSON.stringify(wallpapers, null, 4) + "\n");
console.log(`已写入 ${OUT}（${FIXED_WALLPAPERS.length} 张固定，${ROTATING_WALLPAPERS} 张轮换）`);
