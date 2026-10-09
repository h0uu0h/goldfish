/* eslint-disable react/prop-types */
import { forwardRef, useEffect, useId, useRef, useState } from 'react';
const classes = (...values) => values.filter(Boolean).join(' ');

export const Button = forwardRef(function Button({ appearance = 'default', className, type = 'button', ...props }, ref) {
    return <button ref={ref} type={type} className={classes(appearance !== 'plain' && 'os-button', appearance === 'primary' && 'os-button-primary', className)} {...props} />;
});
// Shared contract for toolbar glyphs: one label, one square hit area, one icon size.
export const IconButton = forwardRef(function IconButton({ label, href, className, children, ...props }, ref) {
    const shared = { ref, className: classes('os-icon-button', className), 'aria-label': label, title: label, ...props };
    return href ? <a {...shared} href={href}>{children}</a> : <button type="button" {...shared}>{children}</button>;
});

export const Input = forwardRef(function Input({ className, ...props }, ref) {
    return <input ref={ref} className={classes('os-input', className)} {...props} />;
});
export { Select } from './Select.jsx';
export const Slider = forwardRef(function Slider({ value, unit = '', className, onValueChange, onChange, ...props }, ref) {
    return <div className={classes('os-slider-control', className)}>
        <input ref={ref} className="os-range" type="range" value={value} {...props} onChange={event => { onChange?.(event); onValueChange?.(Number(event.target.value)); }} />
        <output aria-hidden="true">{Number(Number(value).toFixed(3))}{unit}</output>
    </div>;
});
export function SegmentedControl({ label, value, options, onValueChange }) {
    const name = useId();
    return <div className="os-segmented" role="radiogroup" aria-label={label}>
        {options.map(option => <label key={option.value}>
            <input type="radio" name={name} value={option.value} checked={value === option.value} disabled={option.disabled} onChange={() => onValueChange(option.value)} />
            <span>{option.label}</span>
        </label>)}
    </div>;
}
// Keep hue/saturation when selecting black or grey so dragging back restores the color.
function hexToHsv(hex, previous = [0, 0, 0]) {
    const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
    const max = Math.max(r, g, b), delta = max - Math.min(r, g, b);
    const hue = !delta ? previous[0] : ((max === r ? (g - b) / delta : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4) * 60 + 360) % 360;
    return [hue, max ? delta / max : previous[1], max];
}
function hsvToHex([h, s, v]) {
    const channel = n => {
        const k = (n + h / 60) % 6;
        return Math.round(255 * v * (1 - s * Math.max(0, Math.min(k, 4 - k, 1)))).toString(16).padStart(2, '0');
    };
    return `#${channel(5)}${channel(3)}${channel(1)}`;
}
export function ColorPicker({ value, onValueChange, label, id }) {
    const panelId = useId();
    const trigger = useRef(null);
    const panel = useRef(null);
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(null);
    useEffect(() => {
        const popup = panel.current;
        const syncOpen = event => setOpen(event.newState === 'open');
        popup.addEventListener('toggle', syncOpen);
        return () => popup.removeEventListener('toggle', syncOpen);
    }, []);
    const [selection, setSelection] = useState(() => ({ hex: value, hsv: hexToHsv(value) }));
    const hsv = selection.hex === value ? selection.hsv : hexToHsv(value, selection.hsv);
    const update = next => {
        const hex = hsvToHex(next);
        setSelection({ hex, hsv: next });
        setDraft(null);
        onValueChange(hex);
    };
    const commit = () => {
        if (/^#[\da-f]{6}$/i.test(draft ?? '')) onValueChange(draft.toLowerCase());
        setDraft(null);
    };
    const position = () => {
        const anchor = trigger.current.getBoundingClientRect();
        const popup = panel.current;
        const width = Math.min(248, window.innerWidth - 24);
        popup.style.width = `${width}px`;
        popup.style.left = `${Math.max(12, Math.min(anchor.left, window.innerWidth - width - 12))}px`;
        const height = popup.getBoundingClientRect().height;
        popup.style.top = `${Math.max(12, Math.min(anchor.bottom + 8 + height <= window.innerHeight - 12 ? anchor.bottom + 8 : anchor.top - height - 8, window.innerHeight - height - 12))}px`;
    };
    useEffect(() => {
        if (!open) return;
        window.addEventListener('resize', position);
        window.addEventListener('scroll', position, true);
        return () => {
            window.removeEventListener('resize', position);
            window.removeEventListener('scroll', position, true);
        };
    }, [open]);
    const pick = event => {
        const rect = event.currentTarget.getBoundingClientRect();
        const clamp = n => Math.max(0, Math.min(1, n));
        update([hsv[0], clamp((event.clientX - rect.left) / rect.width), 1 - clamp((event.clientY - rect.top) / rect.height)]);
    };
    return <div className="os-color-picker">
        <Button ref={trigger} id={id} appearance="plain" className="os-color-swatch" style={{ backgroundColor: value }} aria-label={label} aria-haspopup="dialog" aria-expanded={open} aria-controls={panelId}
            onClick={() => { if (open) panel.current.hidePopover(); else { panel.current.showPopover(); position(); panel.current.focus(); } }} />
        <Input aria-label={`${label}色值`} value={draft ?? value} spellCheck={false} maxLength={7} onChange={event => setDraft(event.target.value)} onBlur={commit} onKeyDown={event => { if (event.key === 'Enter') commit(); if (event.key === 'Escape') setDraft(null); }} />
        <div ref={panel} id={panelId} popover="auto" role="dialog" aria-label={`${label}选择器`} tabIndex={-1} className="os-color-panel"
            onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); panel.current.hidePopover(); trigger.current.focus(); } }}>
            <div className="os-color-panel-heading"><span>{label}</span><Button appearance="plain" aria-label="关闭颜色选择器" onClick={() => { panel.current.hidePopover(); trigger.current.focus(); }}><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="m2 2 8 8M10 2l-8 8" /></svg></Button></div>
            <div className="os-color-field" style={{ backgroundColor: `hsl(${hsv[0]} 100% 50%)` }} aria-hidden="true"
                onPointerDown={event => { if (event.button !== 0) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); pick(event); }}
                onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) pick(event); }}
                onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) { pick(event); event.currentTarget.releasePointerCapture(event.pointerId); } }}>
                <span style={{ left: `${hsv[1] * 100}%`, top: `${(1 - hsv[2]) * 100}%`, backgroundColor: value }} />
            </div>
            <label className="os-color-channel"><span>色相</span><input className="os-color-hue" type="range" min="0" max="360" step="1" value={hsv[0]} onChange={event => update([Number(event.target.value), hsv[1], hsv[2]])} /></label>
            <label className="os-color-channel"><span>饱和度</span><input className="os-color-level" style={{ '--color-track': `linear-gradient(to right, ${hsvToHex([hsv[0], 0, hsv[2]])}, ${hsvToHex([hsv[0], 1, hsv[2]])})` }} type="range" min="0" max="100" value={Math.round(hsv[1] * 100)} onChange={event => update([hsv[0], Number(event.target.value) / 100, hsv[2]])} /></label>
            <label className="os-color-channel"><span>明度</span><input className="os-color-level" style={{ '--color-track': `linear-gradient(to right, #000, ${hsvToHex([hsv[0], hsv[1], 1])})` }} type="range" min="0" max="100" value={Math.round(hsv[2] * 100)} onChange={event => update([hsv[0], hsv[1], Number(event.target.value) / 100])} /></label>
            <div className="os-color-panel-value"><span style={{ backgroundColor: value }} /><output>{value.toUpperCase()}</output></div>
        </div>
    </div>;
}
export function ColorSwatches({ colors, value, onValueChange, label }) {
    return <div className="os-color-swatches" role="group" aria-label={label}>
        {colors.map(color => <Button appearance="plain" className="os-color-swatch" key={color} style={{ backgroundColor: color }} aria-label={`使用颜色 ${color}`} title={color} aria-pressed={value === color} onClick={() => onValueChange(color)} />)}
    </div>;
}
