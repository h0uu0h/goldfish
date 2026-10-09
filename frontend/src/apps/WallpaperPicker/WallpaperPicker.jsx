import { WindowToolbar } from '../../system/Window/WindowToolbar.jsx';
import { useState } from 'react';
import { Button, Select, SegmentedControl } from '../../system/Controls/Controls.jsx';
import { useWallpaper } from '../../system/Wallpaper/WallpaperContext.jsx';
import './WallpaperPicker.css';

const WallpaperPicker = () => {
    const { list, current, select, next, minutes, setMinutes, favorites, toggleFavorite, rotationCount } = useWallpaper();
    const [view, setView] = useState('all');
    const favoriteList = list.filter(wp => favorites.includes(wp.id));
    const visible = view === 'favorites' ? favoriteList : list;

    return <div className="wp-picker os-scroll">
        <WindowToolbar className="wp-picker-controls" label="壁纸操作">
                <SegmentedControl label="壁纸分类" value={view} options={[{ value: 'all', label: '全部' }, { value: 'favorites', label: `收藏 ${favoriteList.length}` }]} onValueChange={setView} />
                <Select aria-label="切换间隔" value={minutes} options={[{ value: 0, label: '不自动切换' }, ...[5, 15, 30, 60].map(value => ({ value, label: `每 ${value} 分钟` }))]} onValueChange={setMinutes} />
                <Button onClick={next} disabled={!rotationCount}>下一张</Button>
        </WindowToolbar>
        <div className="wp-picker-toolbar">
            <div className="wp-picker-options">
                <span className="os-label" role="status">{minutes && rotationCount === 1 ? '只有一张可轮换壁纸' : minutes ? `每 ${minutes} 分钟切换，手动选图后重新计时` : '保持当前壁纸'}</span>
            </div>
        </div>
        <div className="wp-picker-grid">
            {visible.map(wp => {
                const favorite = favorites.includes(wp.id);
                const name = wp.query || wp.id;
                return <div key={wp.id} className="wp-picker-card">
                    <Button appearance="plain" aria-label={`使用壁纸 ${name}`} aria-pressed={current?.id === wp.id} className={`wp-picker-item ${current?.id === wp.id ? 'active' : ''}`} onClick={() => select(wp.id)}>
                        <img src={wp.thumb ?? wp.src} alt={name} loading="lazy" draggable="false" />
                    </Button>
                    <Button appearance="plain" className={`wp-picker-favorite ${favorite ? 'is-favorite' : ''}`} aria-label={`${favorite ? '取消收藏' : '收藏'}壁纸 ${name}`} title={favorite ? '取消收藏' : '收藏壁纸'} aria-pressed={favorite} onClick={() => toggleFavorite(wp.id)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3L12 17.4l-5.6 3 1.1-6.3L3 9.6l6.2-.9Z" /></svg>
                    </Button>
                    {wp.pexelsUrl && <span className="wp-picker-credit os-label"><a href={wp.pexelsUrl} target="_blank" rel="noopener noreferrer">{wp.photographer ? `© ${wp.photographer}` : 'Pexels ↗'}</a></span>}
                </div>;
            })}
        </div>
        {!visible.length && <div className="wp-picker-empty os-label">{view === 'favorites' ? '还没有收藏，点壁纸右上角的星标即可收藏' : '壁纸清单为空'}</div>}
    </div>;
};

export default WallpaperPicker;
