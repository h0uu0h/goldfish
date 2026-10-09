import { WindowToolbar } from '../Window/WindowToolbar.jsx';
/* eslint-disable react/prop-types */
import { useId, useRef } from 'react';
import { SegmentedControl } from '../Controls/Controls.jsx';
import './Settings.css';

export function SettingsPanel({ label, sections, section, onSectionChange, children, actions, status }) {
    const scroll = useRef(null);
    return <div className="os-settings">
        <WindowToolbar label={label} className="os-settings-navigation"><SegmentedControl label={label} options={sections} value={section} onValueChange={value => { onSectionChange(value); scroll.current?.scrollTo(0, 0); }} /></WindowToolbar>
        <div ref={scroll} className="os-settings-content os-scroll">{children}</div>
        <footer className="os-settings-footer"><span role="status">{status}</span><div className="os-settings-actions">{actions}</div></footer>
    </div>;
}
export function SettingsGroup({ title, children }) {
    return <fieldset className="os-settings-group">{title && <legend>{title}</legend>}<div>{children}</div></fieldset>;
}
export function SettingsRow({ label, children, labelAlign = 'center' }) {
    const id = useId();
    return <div className="os-settings-row" data-label-align={labelAlign}><label htmlFor={typeof children === 'function' ? id : undefined}>{label}</label><div className="os-settings-value">{typeof children === 'function' ? children(id) : children}</div></div>;
}
