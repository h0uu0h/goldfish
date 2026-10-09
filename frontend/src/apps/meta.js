// ============================================================
// 应用元数据 —— 纯数据，不 import 任何组件（避免循环依赖）
// 新增应用 / 换图标 / 调窗口尺寸只改这里
//
//   id           唯一标识（也是窗口 id / 深链依据）
//   title        窗口标题与图标标签
//   icon         图标路径（文件放 public/icons/ 下，svg/png 均可）
//   href         外链应用：点击直接新标签页打开（无窗口）
//   defaultSize  初始窗口尺寸
// 窗口内容组件在 registry.jsx 里按同名 id 注册。
// ============================================================

export const APPS = {
    browser: { id: "browser", title: "浏览器", icon: "/icons/browser.svg", defaultSize: { w: 1000, h: 720 } },
    inkpad: { id: "inkpad", title: "画笺", icon: "/icons/inkpad.svg", defaultSize: { w: 1040, h: 720 } },
    trash: { id: "trash", title: "废纸篓", icon: "/icons/trash.svg", defaultSize: { w: 480, h: 360 } },
    works: {
        id: "works",
        title: "作品集",
        icon: "/icons/works.svg",
        defaultSize: { w: 880, h: 620 },
    },
    workviewer: {
        id: "workviewer",
        title: "作品",
        icon: "/icons/work.svg",
        defaultSize: { w: 720, h: 640 },
    },
    about: {
        id: "about",
        title: "关于我",
        icon: "/icons/about.svg",
        defaultSize: { w: 480, h: 560 },
    },
    wallpaper: {
        id: "wallpaper",
        title: "壁纸",
        icon: "/icons/wallpaper.svg",
        defaultSize: { w: 700, h: 520 },
    },
    rockrock: {
        id: "rockrock",
        title: "rockrock",
        icon: "/icons/rockrock.svg",
        href: "/rockrock",
    },
    cpc: {
        id: "cpc",
        title: "CPC",
        icon: "/icons/cpc.svg",
        href: "/cpc",
    },
    paperlab: {
        id: "paperlab", title: "系统样式", icon: "/icons/paperlab.svg",
        defaultSize: { w: 560, h: 520 },
    },
};

export function getApp(appId) {
    return APPS[appId] ?? null;
}
