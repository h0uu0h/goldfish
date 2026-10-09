/* eslint-disable react/prop-types */
import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import { MenuSurface, MenuItem } from '../Menu/Menu.jsx';

export const Select = forwardRef(function Select({ options, value, defaultValue, className = '', onValueChange, onChange, disabled, name, id, ...props }, ref) {
    const trigger = useRef(null);
    const panel = useRef(null);
    const listId = useId();
    const [localValue, setLocalValue] = useState(defaultValue ?? options[0]?.value);
    const [open, setOpen] = useState(false);
    const current = value ?? localValue;
    const selected = options.findIndex(option => String(option.value) === String(current));
    const [active, setActive] = useState(selected);
    const search = useRef({ text: '', time: 0 });
    const close = (restoreFocus = true) => {
        panel.current.hidePopover();
        if (restoreFocus) trigger.current.focus();
    };
    const position = () => {
        const anchor = trigger.current.getBoundingClientRect();
        const popup = panel.current;
        popup.style.width = `${Math.min(Math.max(anchor.width, 180), window.innerWidth - 16)}px`;
        popup.style.left = `${Math.max(8, Math.min(anchor.right - popup.offsetWidth, window.innerWidth - popup.offsetWidth - 8))}px`;
        const item = popup.children[Math.max(0, selected)];
        popup.style.top = `${Math.max(8, Math.min(anchor.top + anchor.height / 2 - (item ? item.offsetTop - popup.scrollTop + item.offsetHeight / 2 : 0), window.innerHeight - popup.offsetHeight - 8))}px`;
    };
    useEffect(() => {
        const popup = panel.current;
        const sync = event => setOpen(event.newState === 'open');
        popup.addEventListener('toggle', sync);
        return () => popup.removeEventListener('toggle', sync);
    }, []);
    useEffect(() => {
        if (!open) return;
        const dismiss = event => { if (!panel.current.contains(event.target)) panel.current.hidePopover(); };
        window.addEventListener('resize', dismiss);
        window.addEventListener('scroll', dismiss, true);
        return () => {
            window.removeEventListener('resize', dismiss);
            window.removeEventListener('scroll', dismiss, true);
        };
    }, [open]);
    useEffect(() => { if (disabled) panel.current.hidePopover(); }, [disabled]);
    const focusItem = index => {
        setActive(index);
        panel.current.children[index]?.focus({ preventScroll: true });
        panel.current.children[index]?.scrollIntoView({ block: 'nearest' });
    };
    const show = () => {
        panel.current.showPopover();
        const index = selected >= 0 && !options[selected].disabled ? selected : options.findIndex(option => !option.disabled);
        focusItem(index);
        position();
    };
    const choose = index => {
        const option = options[index];
        if (!option || option.disabled) return;
        const next = String(option.value);
        setLocalValue(next);
        onValueChange?.(next);
        onChange?.({ target: { value: next, name, id }, currentTarget: { value: next, name, id } });
        close();
    };
    const keyDown = event => {
        const enabled = options.map((option, index) => option.disabled ? -1 : index).filter(index => index >= 0);
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return; }
        if (event.key === 'Tab') { close(); return; }
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            const index = enabled.indexOf(active);
            focusItem(event.key === 'Home' ? enabled[0] : event.key === 'End' ? enabled.at(-1) : enabled[(index + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length]);
        } else if (event.key.length === 1 && event.key !== ' ' && !event.metaKey && !event.ctrlKey && !event.altKey) {
            event.preventDefault();
            const now = Date.now();
            search.current = { text: (now - search.current.time < 700 ? search.current.text : '') + event.key.toLocaleLowerCase(), time: now };
            const index = enabled.find(index => String(options[index].label).toLocaleLowerCase().startsWith(search.current.text));
            if (index !== undefined) focusItem(index);
        }
    };
    return <>
        <button {...props} ref={node => { trigger.current = node; if (typeof ref === 'function') ref(node); else if (ref) ref.current = node; }} id={id} type="button" disabled={disabled} className={`os-select ${className}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={listId}
            onClick={() => panel.current.matches(':popover-open') ? close() : show()}
            onKeyDown={event => { if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) { event.preventDefault(); show(); } }}>
            <span className="os-select-label">{options[selected]?.label ?? '请选择'}</span>
            <span className="os-select-arrows" aria-hidden="true"><svg width="10" height="14" viewBox="0 0 10 14"><path d="m2 5 3-3 3 3M2 9l3 3 3-3" /></svg></span>
        </button>
        {name && <input type="hidden" name={name} value={current ?? ''} disabled={disabled} />}
        <MenuSurface ref={panel} id={listId} popover="auto" role="listbox" aria-labelledby={id} aria-label={props['aria-label']} className="os-select-menu" onKeyDown={keyDown}>
            {options.map((option, index) => <MenuItem key={option.value} role="option" aria-selected={index === selected} disabled={option.disabled} tabIndex={-1} className={index === active ? 'os-select-option is-active' : 'os-select-option'} onPointerMove={() => { if (!option.disabled) { setActive(index); panel.current.children[index]?.focus({ preventScroll: true }); } }} onClick={() => choose(index)}>
                <span className="os-select-check" aria-hidden="true">{index === selected ? '✓' : ''}</span><span>{option.label}</span>
            </MenuItem>)}
        </MenuSurface>
    </>;
});
