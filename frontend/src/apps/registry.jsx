import InkPad from './InkPad/InkPad.jsx';
import TrashApp from './Trash/TrashApp.jsx';
// ============================================================
// 应用组件注册表 —— id 与 meta.js 保持一致
// 只有 Window（渲染窗口内容时）会 import 这里
// ============================================================
import WorksApp from "./Works/WorksApp.jsx";
import WorkViewer from "./WorkViewer/WorkViewer.jsx";
import BrowserApp from "./Browser/BrowserApp.jsx";
import WallpaperPicker from "./WallpaperPicker/WallpaperPicker.jsx";
import PaperLab from "./PaperLab/PaperLab.jsx";

const COMPONENTS = {
    inkpad: InkPad,
    trash: TrashApp,
    works: WorksApp,
    workviewer: WorkViewer,
    browser: BrowserApp,
    wallpaper: WallpaperPicker,
    paperlab: PaperLab,
};

export function getAppComponent(appId) {
    return COMPONENTS[appId] ?? null;
}
