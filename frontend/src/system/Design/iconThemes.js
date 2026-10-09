export const ICON_THEMES = [
    { value: 'original', label: '原有线条', description: '简洁的单色轮廓', extension: 'svg' },
    { value: 'haiku', label: 'Haiku', description: '彩色立体的小物件', extension: 'svg' },
    { value: 'chicago95', label: 'Chicago95', description: 'Windows 95 的像素桌面', extension: 'png' },
    { value: 'tango', label: 'Tango', description: '柔和渐变的经典桌面', extension: 'svg' },
];

const THEMED_APPS = new Set(['browser', 'inkpad', 'works', 'workviewer', 'about', 'wallpaper', 'paperlab', 'rockrock', 'cpc', 'trash']);

export function resolveAppIcon(app, theme, override) {
    const selected = ICON_THEMES.find(option => option.value === theme);
    if (!selected || selected.value === 'original' || !THEMED_APPS.has(app?.id)) return override ?? app?.icon;
    return `/icons/themes/${selected.value}/${app.id}.${selected.extension}`;
}
