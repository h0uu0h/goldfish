/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import { Button } from '../../system/Controls/Controls.jsx';

// Only list hosts whose embedding policy has been verified. Cross-origin frame
// load events also fire for blocked pages, so they cannot prove successful rendering.
const requiresExternalPage = url => {
    const hostname = new URL(url, window.location.origin).hostname;
    return hostname === 'pinterest.com' || hostname.endsWith('.pinterest.com');
};

export default function BrowserPage({ url, title, external }) {
    const blocked = external && requiresExternalPage(url);
    const [attempt, setAttempt] = useState(0);
    const [phase, setPhase] = useState('loading');
    const [help, setHelp] = useState(false);
    useEffect(() => {
        if (blocked || phase !== 'loading') return;
        const timer = window.setTimeout(() => setPhase('slow'), 12000);
        return () => window.clearTimeout(timer);
    }, [blocked, phase, attempt]);
    const retry = () => {
        setHelp(false);
        setPhase('loading');
        setAttempt(value => value + 1);
    };
    const showMessage = blocked || help || phase === 'slow' || phase === 'error';
    return <div className="browser-external">
        {!blocked && <iframe key={attempt} src={url} title={title} inert={showMessage ? "" : undefined}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups" referrerPolicy="no-referrer"
            onLoad={() => setPhase('ready')} onError={() => setPhase('error')} />}
        {phase === 'loading' && !blocked && !help && <div className="browser-loading" role="status">正在加载 {title}…</div>}
        {showMessage && <div className="browser-page-message os-scroll">
            <div>
                <Globe size={32} strokeWidth={1.3} aria-hidden="true" />
                <h1>{blocked ? '请在新标签页浏览' : help ? '页面没有正常显示？' : phase === 'error' ? '网页暂时无法加载' : '加载比预期久一些'}</h1>
                <p className="browser-page-host">{title}</p>
                <p>{blocked ? 'Pinterest 不允许在其他网站的窗口内显示。打开原网页即可继续浏览。' : help ? '可能是网站限制了窗口内浏览，也可能是连接暂时不可用。可以重试，或打开原网页。' : phase === 'error' ? '可以重新加载，或在新标签页打开原网页。' : '网页可能还在响应。你可以继续等待，或在新标签页打开。'}</p>
                <div className="browser-page-actions">
                    <a className="os-button browser-open-page" href={url} target="_blank" rel="noopener noreferrer">在新标签页打开 <ExternalLink size={15} aria-hidden="true" /></a>
                    {!blocked && <Button onClick={retry}>重新加载</Button>}
                    {!blocked && <Button onClick={() => { setHelp(false); setPhase('ready'); }}>{phase === 'slow' ? '继续等待' : '返回网页'}</Button>}
                </div>
            </div>
        </div>}
        {external && !showMessage && <Button className="browser-page-help" onClick={() => setHelp(true)}>页面打不开？</Button>}
    </div>;
}
