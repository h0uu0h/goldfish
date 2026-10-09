import { Check } from 'lucide-react';
import { ICON_THEMES, resolveAppIcon } from '../../system/Design/iconThemes.js';
import { getApp } from '../meta.js';
import { useEffect, useMemo, useState } from 'react';
import { FIBER_STYLES, PAPER_DEFAULTS, applyPaperMaterial, loadPaperMaterial, paperCssVars, savePaperMaterial } from '../../system/paperMaterial.js';
import { useDesign } from '../../system/Design/DesignContext.jsx';
import { DESIGN_DEFAULTS, DENSITY_OPTIONS, FONT_OPTIONS } from '../../system/Design/designTokens.js';
import { useWallpaper } from '../../system/Wallpaper/WallpaperContext.jsx';
import { useWindowManager } from '../../wm/WindowManager.jsx';
import { Button, Select, Slider, ColorPicker, ColorSwatches } from '../../system/Controls/Controls.jsx';
import { SettingsPanel, SettingsGroup, SettingsRow } from '../../system/Settings/Settings.jsx';
import './PaperLab.css';
const GROUPS = [
    { label: "透光", controls: [
        { key: "alpha", label: "纸不透明度", min: 0.4, max: 1, step: 0.01 },
        { key: "blur", label: "透光模糊", min: 0, max: 40, step: 1, unit: "px" },
        { key: "saturate", label: "透光饱和度", min: 0.5, max: 2, step: 0.01 },
        { key: "formation", label: "透光不均匀", min: 0, max: 1, step: 0.02 },
        { key: "warmth", label: "纸色暖度", min: 0, max: 1, step: 0.01 },
    ] },
    { label: "纤维", controls: [
        { key: "fiber", label: "纤维显影", min: 0, max: 1, step: 0.01 },
        { key: "fiberSize", label: "纤维尺度", min: 0.01, max: 1, step: 0.01 },
        { key: "roughness", label: "表面粗糙度", min: 0, max: 1, step: 0.01 },
        { key: "drops", label: "纸浆杂点", min: 0, max: 1, step: 0.005 },
    ] },
    { label: "纸面", controls: [
        { key: "contrast", label: "纹理对比", min: 0, max: 1, step: 0.01 },
        { key: "fade", label: "纹理断续", min: 0, max: 1, step: 0.01 },
        { key: "edge", label: "纸边缘", min: 0, max: 1, step: 0.02 },
        { key: "shadow", label: "投影浓度", min: 0, max: 0.6, step: 0.02 },
    ] },
];

const SECTIONS = [{ value: 'theme', label: '颜色' }, { value: 'layout', label: '布局' }, { value: 'paper', label: '材质' }, { value: 'icons', label: '图标' }];
const LAYOUT_FIELDS = [
    { key: 'fontSize', label: '字号', min: 12, max: 18, step: 1, unit: 'px' },
    { key: 'radius', label: '圆角', min: 0, max: 16, step: 1, unit: 'px' },
    { key: 'border', label: '分隔线浓度', min: 0.08, max: 0.4, step: 0.01 },
];
const PaperLab = () => {
    const design = useDesign();
    const { current } = useWallpaper();
    const { openApp } = useWindowManager();
    const [paper, setPaper] = useState(loadPaperMaterial);
    const [section, setSection] = useState('theme');
    const [notice, setNotice] = useState('');
    const vars = useMemo(() => paperCssVars(paper), [paper]);
    const color = design.params.mode === 'manual' ? design.params.accent : design.palette[0];
    useEffect(() => { applyPaperMaterial(paper, vars); savePaperMaterial(paper); }, [paper, vars]);
    const changePaper = (key, value) => setPaper(p => ({ ...p, [key]: value }));
    const copy = async () => {
        const css = `:root {\n${Object.entries({ ...design.vars, ...vars }).map(([key, value]) => `  ${key}: ${value};`).join('\n')}\n}`;
        try { await navigator.clipboard.writeText(css); setNotice('已复制'); }
        catch { setNotice('复制失败'); }
    };
    const resetSection = () => {
        if (section === 'icons') design.update('iconTheme', DESIGN_DEFAULTS.iconTheme);
        else if (section === 'paper') setPaper({ ...PAPER_DEFAULTS });
        else for (const key of section === 'theme' ? ['mode', 'accent'] : ['font', 'fontSize', 'densityX', 'densityY', 'radius', 'border']) design.update(key, DESIGN_DEFAULTS[key]);
        setNotice('已恢复默认');
    };
    return <SettingsPanel label="样式分类" sections={SECTIONS} section={section} onSectionChange={value => { setSection(value); setNotice(''); }} status={notice} actions={<>{section !== 'icons' && <Button onClick={copy}>复制样式</Button>}<Button onClick={resetSection}>恢复默认</Button></>}>
        {section === 'theme' && <>
            <SettingsGroup>
                <SettingsRow label="壁纸" labelAlign="start"><div className="appearance-wallpaper">{current && <img src={current.thumb ?? current.src} alt="当前壁纸" />}<Button onClick={() => openApp('wallpaper')}>更换</Button></div></SettingsRow>
                <SettingsRow label="主题色">{id => <Select id={id} value={design.params.mode} options={[{ value: 'wallpaper', label: '跟随壁纸' }, { value: 'manual', label: '自定义' }]} onValueChange={value => value === 'manual' ? design.chooseColor(design.palette[0]) : design.update('mode', 'wallpaper')} />}</SettingsRow>
                <SettingsRow label="壁纸颜色"><ColorSwatches label="壁纸颜色" colors={design.palette} value={color} onValueChange={design.chooseColor} />{design.status !== 'ready' && <span className="appearance-status" role="status">{design.status === 'loading' ? '读取中…' : '无法取色，使用备用色'}</span>}</SettingsRow>
                <SettingsRow label="自定义颜色">{id => <ColorPicker id={id} label="自定义颜色" value={color} onValueChange={design.chooseColor} />}</SettingsRow>
            </SettingsGroup>
        </>}
        {section === 'icons' && <div className="appearance-icons">
            <p className="appearance-icons-description">选择桌面与 Dock 的图标风格，立即生效并自动保存。</p>
            <div className="appearance-icon-options" role="group" aria-label="图标风格">
                {ICON_THEMES.map(theme => <Button appearance="plain" key={theme.value}
                    className="appearance-icon-option" data-icon-theme={theme.value}
                    aria-pressed={design.params.iconTheme === theme.value}
                    onClick={() => { design.update('iconTheme', theme.value); setNotice(`已切换为 ${theme.label}`); }}>
                    <span className="appearance-icon-option-heading"><strong>{theme.label}</strong><span className="appearance-icon-check" aria-hidden="true">{design.params.iconTheme === theme.value && <Check size={15} strokeWidth={2} />}</span></span>
                    <span className="appearance-icon-preview" aria-hidden="true">{['works', 'browser', 'wallpaper', 'paperlab'].map(id => <img key={id} src={resolveAppIcon(getApp(id), theme.value)} alt="" draggable="false" />)}</span>
                    <span className="appearance-icon-description">{theme.description}</span>
                </Button>)}
            </div>
        </div>}
        {section === 'layout' && <SettingsGroup>
            <SettingsRow label="字体">{id => <Select id={id} value={design.params.font} options={FONT_OPTIONS} onValueChange={value => design.update('font', value)} />}</SettingsRow>
            <SettingsRow label="左右边距">{id => <Select id={id} value={design.params.densityX} options={DENSITY_OPTIONS} onValueChange={value => design.update('densityX', value)} />}</SettingsRow>
            <SettingsRow label="上下边距">{id => <Select id={id} value={design.params.densityY} options={DENSITY_OPTIONS} onValueChange={value => design.update('densityY', value)} />}</SettingsRow>
            {LAYOUT_FIELDS.map(({ key, label, ...props }) => <SettingsRow key={key} label={label}>{id => <Slider id={id} {...props} value={design.params[key]} onValueChange={value => design.update(key, value)} />}</SettingsRow>)}
        </SettingsGroup>}
        {section === 'paper' && <>
            <SettingsGroup><SettingsRow label="纤维类型">{id => <Select id={id} value={paper.fiberStyle} options={FIBER_STYLES} onValueChange={value => { const profile = FIBER_STYLES.find(p => p.value === value); setPaper(p => ({ ...p, ...profile.preset, fiberStyle: value })); }} />}</SettingsRow></SettingsGroup>
            {GROUPS.map(group => <SettingsGroup key={group.label} title={group.label}>{group.controls.map(({ key, label, ...props }) => <SettingsRow key={key} label={label}>{id => <Slider id={id} {...props} value={paper[key]} onValueChange={value => changePaper(key, value)} />}</SettingsRow>)}</SettingsGroup>)}
            <Button onClick={() => changePaper('fiberSeed', Math.floor(Math.random() * 999999) + 1)}>更换纤维</Button>
        </>}
    </SettingsPanel>;
};
export default PaperLab;
