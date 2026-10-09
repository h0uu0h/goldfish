// ============================================================
// 桌面与 Dock 配置 —— 想调整桌面就改这里
//
// DESKTOP_ICONS：桌面上显示哪些应用、按什么顺序（自上而下按列排）。
//   每项可用 icon / label 覆盖注册表里的默认值，例如：
//   { appId: "works", icon: "/icons/my-custom.png", label: "我的作品" }
//
// DOCK_APPS：固定在 Dock 上的应用 id 列表。
// ============================================================

export const DESKTOP_ICONS = [
    { appId: "works" },
    { appId: "inkpad" },
    { appId: "browser" },
    { appId: "wallpaper" },
    { appId: "paperlab" },
];

export const DOCK_APPS = ["works", "inkpad", "wallpaper", "browser"];
