import { WindowToolbar } from '../../system/Window/WindowToolbar.jsx';
/* eslint-disable react/prop-types */
import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button, IconButton as SystemIconButton, Input, Select } from '../../system/Controls/Controls.jsx';
import { COLORS, PENS, hitsStroke, newPage, strokePath } from './ink.js';
import { DEFAULT_CAMERA, boardSvg, contentBounds, fitCamera, objectHeight, objectMarkup, screenToWorld, zoomAt } from './board.js';
import { imageObject, readNotebook, saveNotebook } from './storage.js';
import { MousePointer2, Hand, Pencil, PenTool, Highlighter, Eraser, StickyNote, ImagePlus, Undo2, Redo2, Plus, Minus, Scan, Download, Trash2, SquarePen } from 'lucide-react';
import './InkPad.css';

const TOOL_ICONS = { select: MousePointer2, pan: Hand, fine: Pencil, fountain: PenTool, marker: Highlighter, eraser: Eraser };
function IconButton({ icon: Icon, label, ...props }) {
    return <SystemIconButton className="inkpad-icon-button" label={label} {...props}><Icon strokeWidth={1.7} aria-hidden="true" /></SystemIconButton>;
}

function SelectionMenu({ bounds, camera, children }) {
    const ref = useRef(null);
    const x = bounds.x * camera.zoom + camera.x;
    const y = bounds.y * camera.zoom + camera.y;
    const width = bounds.width * camera.zoom;
    const height = bounds.height * camera.zoom;
    useLayoutEffect(() => {
        const menu = ref.current, board = menu.parentElement;
        const toolbar = board.querySelector('.inkpad-toolbar');
        const place = () => {
            const style = getComputedStyle(board);
            const gap = Math.max(4, parseFloat(style.getPropertyValue('--os-space-group-y')) || 0);
            const inset = Math.max(4, parseFloat(style.getPropertyValue('--os-space-group-x')) || 0);
            const top = gap;
            const bottom = toolbar.offsetTop - gap;
            const menuWidth = menu.offsetWidth, menuHeight = menu.offsetHeight;
            const visible = x + width >= 0 && x <= board.clientWidth && y + height >= top && y <= bottom;
            const left = Math.max(inset, Math.min(x + width / 2 - menuWidth / 2, board.clientWidth - menuWidth - inset));
            const preferred = y - menuHeight - gap >= top ? y - menuHeight - gap : y + height + gap;
            menu.style.left = `${left}px`;
            menu.style.top = `${Math.max(top, Math.min(preferred, bottom - menuHeight))}px`;
            menu.style.visibility = visible && bottom - top >= menuHeight ? 'visible' : 'hidden';
        };
        place();
        const observer = new ResizeObserver(place);
        [board, menu, toolbar].forEach(element => observer.observe(element));
        return () => observer.disconnect();
    }, [x, y, width, height]);
    return <div ref={ref} className="inkpad-selection inkpad-float" role="toolbar" aria-label="选中元素操作">{children}</div>;
}

const Strokes = memo(function Strokes({ strokes }) {
    return strokes.map(s => <path key={s.id} d={strokePath(s)} fill={s.color} opacity={PENS.find(p => p.id === s.pen).opacity} />);
});
const Objects = memo(function Objects({ objects }) {
    return objects.map(o => <g key={o.id} data-object-id={o.id} dangerouslySetInnerHTML={{ __html: objectMarkup(o) }} />);
});
function download(blob, name) {
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
}
const snapshot = page => ({ strokes: page.strokes, objects: page.objects });
const isEditing = target => target.closest('input, select, textarea, [contenteditable="true"]');
function NoteEditor({ object, onDone }) {
    const [text, setText] = useState(object.text);
    return <foreignObject x={object.x} y={object.y} width={object.width} height={objectHeight({ ...object, text })}>
        <textarea className="inkpad-note-editor" style={{ background: object.color }} aria-label="便笺内容" autoFocus value={text} placeholder="写点什么，也可以粘贴文字…" maxLength={10000}
            onPointerDown={e => e.stopPropagation()} onChange={e => setText(e.target.value)} onBlur={() => onDone(text)}
            onKeyDown={e => { e.stopPropagation(); if (e.key === 'Escape' || ((e.metaKey || e.ctrlKey) && e.key === 'Enter')) { e.preventDefault(); e.currentTarget.blur(); } }} />
    </foreignObject>;
}
export default function InkPad() {
    const [book, setBook] = useState(null);
    const bookRef = useRef(book); bookRef.current = book;
    const [loadError, setLoadError] = useState('');
    const [saveError, setSaveError] = useState('');
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState('');
    const [tool, setTool] = useState('select');
    const [color, setColor] = useState(COLORS[0].value);
    const [size, setSize] = useState('1');
    const [draft, setDraft] = useState(null);
    const [preview, setPreview] = useState(null);
    const [selection, setSelection] = useState([]);
    const [marquee, setMarquee] = useState(null);
    const [history, setHistory] = useState({ undo: [], redo: [] });
    const [camera, setCamera] = useState(DEFAULT_CAMERA);
    const cameraRef = useRef(camera); cameraRef.current = camera;
    const [editing, setEditing] = useState(null);
    const [busy, setBusy] = useState(false);
    const [exportFormat, setExportFormat] = useState('png');
    const [renaming, setRenaming] = useState(false);
    const [space, setSpace] = useState(false);
    const gesture = useRef(null), svgRef = useRef(null), fileRef = useRef(null);
    const page = book?.pages.find(p => p.id === book.activeId);
    const strokes = preview?.strokes ?? page?.strokes ?? [];
    const objects = preview?.objects ?? page?.objects ?? [];

    useEffect(() => {
        let active = true;
        readNotebook().then(result => { if (!active) return; setBook(result.book); setLoadError(result.error); setCamera(result.book.pages.find(p => p.id === result.book.activeId).camera); })
            .catch(() => { if (active) setLoadError('无法打开本机画布存储，请重新打开画笺后重试。原数据未改动。'); });
        return () => { active = false; };
    }, []);
    useEffect(() => {
        if (!book || loadError) return;
        let active = true; setSaving(true);
        saveNotebook(book).then(() => { if (active) { setSaveError(''); setSaving(false); } })
            .catch(() => { if (active) { setSaveError('保存失败，请导出备份后重试。'); setSaving(false); } });
        return () => { active = false; };
    }, [book, loadError]);
    const updatePage = (changes, id = page.id) => setBook(b => ({ ...b, pages: b.pages.map(p => p.id === id ? { ...p, ...changes, updatedAt: Date.now() } : p) }));
    const commit = (next, id = page.id) => {
        const previous = bookRef.current.pages.find(p => p.id === id);
        if (id === bookRef.current.activeId) setHistory(h => ({ undo: [...h.undo.slice(-49), snapshot(previous)], redo: [] }));
        updatePage(next, id); setNotice('');
    };
    const undo = () => {
        if (!history.undo.length || editing) return;
        updatePage(history.undo.at(-1)); setHistory({ undo: history.undo.slice(0, -1), redo: [...history.redo, snapshot(page)] }); setSelection([]);
    };
    const redo = () => {
        if (!history.redo.length || editing) return;
        updatePage(history.redo.at(-1)); setHistory({ undo: [...history.undo, snapshot(page)], redo: history.redo.slice(0, -1) }); setSelection([]);
    };
    const saveCamera = next => { cameraRef.current = next; setCamera(next); updatePage({ camera: next }); };
    const localPoint = event => {
        const r = svgRef.current.getBoundingClientRect(); return [event.clientX - r.left, event.clientY - r.top];
    };
    const point = event => [...screenToWorld(localPoint(event), cameraRef.current), event.pointerType === 'pen' ? (event.pressure || .1) : .5];
    const viewport = () => { const r = svgRef.current.getBoundingClientRect(); return { width: r.width, height: r.height }; };
    const center = () => { const r = viewport(); return screenToWorld([r.width / 2 - 130, r.height / 2 - 80], cameraRef.current); };
    // Non-passive wheel listener keeps canvas gestures inside the window.
    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        let timer;
        const wheel = event => {
            event.preventDefault();
            if (gesture.current || editing) return;
            const r = svg.getBoundingClientRect(), c = cameraRef.current;
            const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? r.height : 1;
            const dx = event.deltaX * unit, dy = event.deltaY * unit;
            const next = event.ctrlKey || event.metaKey ? zoomAt(c, c.zoom * Math.exp(-dy * .006), [event.clientX - r.left, event.clientY - r.top]) : { ...c, x: c.x - (event.shiftKey ? dy : dx), y: c.y - (event.shiftKey ? dx : dy) };
            cameraRef.current = next; setCamera(next);
            clearTimeout(timer); timer = setTimeout(() => setBook(b => ({ ...b, pages: b.pages.map(p => p.id === b.activeId ? { ...p, camera: cameraRef.current } : p) })), 180);
        };
        svg.addEventListener('wheel', wheel, { passive: false });
        return () => { clearTimeout(timer); svg.removeEventListener('wheel', wheel); };
    }, [book?.activeId, editing]);
    useEffect(() => {
        const release = () => setSpace(false);
        window.addEventListener('keyup', release); window.addEventListener('blur', release);
        return () => { window.removeEventListener('keyup', release); window.removeEventListener('blur', release); };
    }, []);
    const begin = event => {
        if ((event.button !== 0 && event.button !== 1) || gesture.current || editing) return;
        event.preventDefault(); svgRef.current.focus(); svgRef.current.setPointerCapture(event.pointerId);
        const p = point(event), original = snapshot(page);
        const activeTool = space || event.button === 1 ? 'pan' : tool;
        const g = { pointerId: event.pointerId, start: p, last: p, screenStart: localPoint(event), camera: cameraRef.current, original, next: original, tool: activeTool };
        if (activeTool === 'select') {
            const objectId = event.target.closest('[data-object-id]')?.getAttribute('data-object-id');
            const strokeId = [...page.strokes].reverse().find(s => hitsStroke(s, p, p, 6 / camera.zoom))?.id;
            const hit = event.target.closest('[data-resize]')?.getAttribute('data-resize') ?? strokeId ?? objectId;
            g.resize = event.target.closest('[data-resize]')?.getAttribute('data-resize');
            if (hit) { g.ids = selection.includes(hit) ? selection : [hit]; g.moving = true; setSelection(g.ids); }
            else { g.ids = []; setSelection([]); setMarquee({ x: p[0], y: p[1], width: 0, height: 0 }); }
        } else if (activeTool === 'eraser') {
            g.next = { ...original, strokes: page.strokes.filter(s => !hitsStroke(s, p, p, 10 / camera.zoom)) }; setPreview(g.next);
        } else if (activeTool !== 'pan') {
            g.stroke = { id: crypto.randomUUID(), pen: activeTool, color, size: Number(size), pressure: event.pointerType === 'pen', points: [p] }; setDraft({ ...g.stroke });
        }
        gesture.current = g;
    };
    const move = event => {
        const g = gesture.current;
        if (!g || event.pointerId !== g.pointerId) return;
        const p = point(event);
        if (g.tool === 'pan') {
            const local = localPoint(event);
            const next = { ...g.camera, x: g.camera.x + local[0] - g.screenStart[0], y: g.camera.y + local[1] - g.screenStart[1] };
            cameraRef.current = next; setCamera(next);
        } else if (g.tool === 'eraser') {
            g.next = { ...g.next, strokes: g.next.strokes.filter(s => !hitsStroke(s, g.last, p, 10 / camera.zoom)) }; setPreview(g.next);
        } else if (g.tool === 'select') {
            const dx = p[0] - g.start[0], dy = p[1] - g.start[1];
            if (g.resize) {
                g.next = { ...g.original, objects: g.original.objects.map(o => {
                    if (o.id !== g.resize) return o;
                    const width = Math.max(o.type === 'note' ? 160 : 40, o.width + dx);
                    return { ...o, width, height: o.type === 'image' ? width * o.height / o.width : o.height };
                }) }; setPreview(g.next);
            } else if (g.moving) {
                g.next = { strokes: g.original.strokes.map(s => g.ids.includes(s.id) ? { ...s, points: s.points.map(q => [q[0] + dx, q[1] + dy, q[2]]) } : s), objects: g.original.objects.map(o => g.ids.includes(o.id) ? { ...o, x: o.x + dx, y: o.y + dy } : o) }; setPreview(g.next);
            } else {
                const box = { x: Math.min(p[0], g.start[0]), y: Math.min(p[1], g.start[1]), width: Math.abs(dx), height: Math.abs(dy) };
                setMarquee(box);
                setSelection([...g.original.strokes.filter(s => s.points.some(q => q[0] >= box.x && q[0] <= box.x + box.width && q[1] >= box.y && q[1] <= box.y + box.height)), ...g.original.objects.filter(o => o.x + o.width >= box.x && o.x <= box.x + box.width && o.y + objectHeight(o) >= box.y && o.y <= box.y + box.height)].map(o => o.id));
            }
        } else {
            const events = event.nativeEvent.getCoalescedEvents?.() ?? [];
            for (const e of events.length ? events : [event]) {
                const q = point(e);
                if (Math.hypot(q[0] - g.stroke.points.at(-1)[0], q[1] - g.stroke.points.at(-1)[1]) >= .45 / camera.zoom) g.stroke.points.push(q);
            }
            setDraft({ ...g.stroke });
        }
        g.last = p;
    };
    const finish = (event, cancelled = false) => {
        const g = gesture.current;
        if (!g || event.pointerId !== g.pointerId) return;
        if (!cancelled) {
            move(event);
            if (g.stroke) commit({ ...g.original, strokes: [...g.original.strokes, g.stroke] });
            else if (g.tool === 'pan') updatePage({ camera: cameraRef.current });
            else if (g.tool === 'eraser' && g.next.strokes.length !== g.original.strokes.length || g.moving && Math.hypot(g.last[0] - g.start[0], g.last[1] - g.start[1]) > .1) commit(g.next);
        } else if (g.tool === 'pan') { setCamera(g.camera); cameraRef.current = g.camera; }
        gesture.current = null; setDraft(null); setPreview(null); setMarquee(null);
        if (svgRef.current.hasPointerCapture(event.pointerId)) svgRef.current.releasePointerCapture(event.pointerId);
    };
    const changePage = id => {
        setBook(b => ({ ...b, activeId: id, pages: b.pages.map(p => p.id === b.activeId ? { ...p, camera: cameraRef.current } : p) }));
        setCamera(book.pages.find(p => p.id === id).camera); setSelection([]); setEditing(null); setHistory({ undo: [], redo: [] }); setNotice('');
    };
    const addPage = () => {
        const p = newPage(book.pages.length + 1);
        setBook(b => ({ ...b, activeId: p.id, pages: [...b.pages.map(old => old.id === b.activeId ? { ...old, camera: cameraRef.current } : old), p] }));
        setCamera(DEFAULT_CAMERA); setSelection([]); setHistory({ undo: [], redo: [] }); setNotice('');
    };
    const addNote = (text = '', position = center()) => {
        const o = { id: crypto.randomUUID(), type: 'note', x: position[0], y: position[1], width: 260, height: 150, text, color: '#ede3b6' };
        commit({ ...snapshot(page), objects: [...page.objects, o] }); setTool('select'); setSelection([o.id]); if (!text) setEditing(o.id);
    };
    const addImages = async (files, position = center()) => {
        const id = page.id; setBusy(true); setNotice('正在放入图片…');
        try {
            const inserted = await Promise.all(files.map((file, i) => imageObject(file, [position[0] + i * 28, position[1] + i * 28])));
            const current = bookRef.current.pages.find(p => p.id === id);
            commit({ ...snapshot(current), objects: [...current.objects, ...inserted] }, id);
            if (bookRef.current.activeId === id) { setSelection(inserted.map(o => o.id)); setTool('select'); }
        } catch (error) { setNotice(error.message || '图片未能放入，请重试'); }
        finally { setBusy(false); }
    };
    const paste = event => {
        if (isEditing(event.target) || busy || !page) return;
        const files = [...event.clipboardData.items].filter(i => i.kind === 'file').map(i => i.getAsFile()).filter(Boolean);
        const text = event.clipboardData.getData('text/plain');
        if (files.length) { event.preventDefault(); addImages(files); }
        else if (text) { event.preventDefault(); addNote(text.slice(0, 10000)); }
    };
    const remove = () => { commit({ strokes: page.strokes.filter(s => !selection.includes(s.id)), objects: page.objects.filter(o => !selection.includes(o.id)) }); setSelection([]); };
    const keyboard = event => {
        if (isEditing(event.target) || gesture.current || !page) return;
        if (event.code === 'Space') { event.preventDefault(); setSpace(true); }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.stopPropagation(); if (event.shiftKey) redo(); else undo(); }
        if ((event.key === 'Delete' || event.key === 'Backspace') && selection.length) { event.preventDefault(); remove(); }
        if (event.key === 'Escape') { setSelection([]); setTool('select'); }
    };
    const exportPage = async format => {
        setBusy(true); setNotice('');
        const name = (page.title.trim() || '画笺').replace(/[\\/:*?"<>|]/g, '-');
        const blob = new Blob([boardSvg(page)], { type: 'image/svg+xml;charset=utf-8' });
        try {
            if (format === 'svg') download(blob, `${name}.svg`);
            else {
                const url = URL.createObjectURL(blob);
                try {
                    const img = new Image(); img.src = url; await img.decode();
                    const b = contentBounds(page), scale = Math.min(2, 4096 / Math.max(b.width, b.height));
                    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.ceil(b.width * scale)); canvas.height = Math.max(1, Math.ceil(b.height * scale));
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                    const png = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                    if (!png) throw new Error('Export failed'); download(png, `${name}.png`);
                } finally { URL.revokeObjectURL(url); }
            }
            setNotice(`已导出全部内容 · ${format.toUpperCase()}`);
        } catch { setNotice('导出失败，请重试'); }
        finally { setBusy(false); }
    };
    if (!page) return <div className="inkpad-loading" role="status">{loadError || '正在打开画布…'}</div>;
    const editObject = page.objects.find(o => o.id === editing);
    const selectedNote = selection.length === 1 ? page.objects.find(o => o.id === selection[0] && o.type === 'note') : null;
    const selectedBounds = contentBounds({ strokes: strokes.filter(s => selection.includes(s.id)), objects: objects.filter(o => selection.includes(o.id)) });
    // contentBounds includes export padding; anchor the menu to the actual selection.
    const selectionBounds = { x: selectedBounds.x + 40, y: selectedBounds.y + 40, width: selectedBounds.width - 80, height: selectedBounds.height - 80 };
    return <div className="inkpad" tabIndex={-1} onKeyDown={keyboard} onPaste={paste}>
        <svg ref={svgRef} className={`inkpad-canvas inkpad-tool-${space ? 'pan' : tool}`} aria-label="无边画布" role="group" tabIndex={0}
            onPointerDown={begin} onPointerMove={move} onPointerUp={finish} onPointerCancel={e => finish(e, true)} onLostPointerCapture={e => finish(e, true)}
            onDoubleClick={e => { if (tool !== 'select') return; const id = e.target.closest('[data-object-id]')?.getAttribute('data-object-id'); if (page.objects.some(o => o.id === id && o.type === 'note')) setEditing(id); }}
            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
            onDrop={e => { e.preventDefault(); if (busy || editing) return; const files = [...e.dataTransfer.files]; if (files.length) addImages(files, point(e)); else { const text = e.dataTransfer.getData('text/plain'); if (text) addNote(text.slice(0, 10000), point(e)); } }}>
            <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.zoom})`}>
                <Objects objects={objects} /><Strokes strokes={strokes} />{draft && <Strokes strokes={[draft]} />}
                {selection.map(id => {
                    const o = objects.find(o => o.id === id);
                    if (o) return <g key={id}><rect x={o.x} y={o.y} width={o.width} height={objectHeight(o)} fill="none" stroke="#527c92" strokeWidth={1.5 / camera.zoom} /><rect data-resize={id} x={o.x + o.width - 5 / camera.zoom} y={o.y + objectHeight(o) - 5 / camera.zoom} width={10 / camera.zoom} height={10 / camera.zoom} fill="#faf7ef" stroke="#527c92" strokeWidth={1 / camera.zoom} style={{ cursor: 'nwse-resize' }} /></g>;
                    const s = strokes.find(s => s.id === id); return s ? <path key={id} d={strokePath(s)} fill="none" stroke="#527c92" strokeWidth={1.5 / camera.zoom} strokeDasharray="4 4" /> : null;
                })}
                {marquee && <rect {...marquee} fill="#527c92" fillOpacity=".08" stroke="#527c92" strokeWidth={1 / camera.zoom} strokeDasharray="5 5" />}
                {editObject && <NoteEditor key={editing} object={editObject} onDone={text => { commit({ ...snapshot(page), objects: page.objects.map(o => o.id === editing ? { ...o, text } : o) }); setEditing(null); }} />}
            </g>
        </svg>
        <WindowToolbar className="inkpad-documentbar" label="画笺操作">
            {renaming ? <Input autoFocus aria-label="画布名称" maxLength={80} value={page.title} onChange={e => updatePage({ title: e.target.value })} onBlur={() => setRenaming(false)} onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') { e.stopPropagation(); setRenaming(false); } }} /> : <Select aria-label="切换画布" value={page.id} disabled={!!editing} options={book.pages.map(p => ({ value: p.id, label: p.title || '未命名画布' }))} onValueChange={changePage} />}
            <IconButton icon={SquarePen} label="重命名画布" disabled={!!editing} onClick={() => setRenaming(value => !value)} />
            <IconButton icon={Plus} label="新建画布" disabled={!!editing} onClick={addPage} />
            <div className="inkpad-export">
                <Select aria-label="导出格式" value={exportFormat} onValueChange={setExportFormat} options={[{ value: 'png', label: 'PNG' }, { value: 'svg', label: 'SVG' }]} />
                <IconButton icon={Download} label={`下载 ${exportFormat.toUpperCase()}`} disabled={busy || !!editing} onClick={() => exportPage(exportFormat)} />
            </div>
        </WindowToolbar>
        <div className="inkpad-toolbar inkpad-float" role="toolbar" aria-label="画布工具">
            <div className="inkpad-tools">{[{ id: 'select', label: '选择' }, { id: 'pan', label: '抓手' }, ...PENS, { id: 'eraser', label: '擦除' }].map(p => <IconButton key={p.id} icon={TOOL_ICONS[p.id]} label={p.label} aria-pressed={tool === p.id} onClick={() => { setTool(p.id); setSelection([]); }} />)}</div>
            <span className="inkpad-divider" />
            <div className="inkpad-tools"><IconButton icon={StickyNote} label="添加便笺" onClick={() => addNote()} /><IconButton icon={ImagePlus} label="添加图片" disabled={busy} onClick={() => fileRef.current.click()} /></div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" multiple hidden onChange={e => { const files = [...e.target.files]; e.target.value = ''; if (files.length) addImages(files); }} />
            {PENS.some(p => p.id === tool) && <div className="inkpad-pen-options"><div className="inkpad-colors" aria-label="墨色" role="group">{COLORS.map(c => <Button appearance="plain" key={c.value} className="inkpad-color" style={{ '--ink': c.value }} aria-label={c.label} title={c.label} aria-pressed={color === c.value} onClick={() => setColor(c.value)} />)}</div>
            <Select aria-label="笔画粗细" value={size} onValueChange={setSize} options={[{ value: '.6', label: '细' }, { value: '1', label: '中' }, { value: '1.8', label: '粗' }]} /></div>}
            <span className="inkpad-divider" /><div className="inkpad-tools"><IconButton icon={Undo2} label="撤销" disabled={!history.undo.length || !!editing} onClick={undo} /><IconButton icon={Redo2} label="重做" disabled={!history.redo.length || !!editing} onClick={redo} /></div>
        </div>
        {!!selection.length && !editing && <SelectionMenu bounds={selectionBounds} camera={camera}><span>已选 {selection.length} 项</span>{selectedNote && <IconButton icon={SquarePen} label="编辑便笺" onClick={() => setEditing(selectedNote.id)} />}<IconButton icon={Trash2} label="删除所选内容" onClick={remove} /></SelectionMenu>}
        {!page.strokes.length && !page.objects.length && <div className="inkpad-empty"><span>在这里，展开你的想法。</span><small>直接画，或粘贴图片、文字。空格拖动画布，⌘ / Ctrl + 滚轮缩放。</small></div>}
        <footer className="inkpad-status"><span role="status" className={loadError || saveError ? 'inkpad-error' : ''}>{loadError || saveError || notice || (saving ? '保存中…' : '')}</span>{saveError && <Button onClick={() => setBook(b => ({ ...b }))}>重试</Button>}</footer>
        <div className="inkpad-zoom"><IconButton icon={Minus} label="缩小画布" onClick={() => { const r = viewport(); saveCamera(zoomAt(camera, camera.zoom / 1.2, [r.width / 2, r.height / 2])); }} /><Button onClick={() => { const r = viewport(); saveCamera(zoomAt(camera, 1, [r.width / 2, r.height / 2])); }} title="恢复 100%">{Math.round(camera.zoom * 100)}%</Button><IconButton icon={Plus} label="放大画布" onClick={() => { const r = viewport(); saveCamera(zoomAt(camera, camera.zoom * 1.2, [r.width / 2, r.height / 2])); }} /><IconButton icon={Scan} label="查看全部" onClick={() => saveCamera(fitCamera(page, viewport()))} /></div>
    </div>;
}
