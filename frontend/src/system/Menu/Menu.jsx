/* eslint-disable react/prop-types */
import { forwardRef } from 'react';
import { Button } from '../Controls/Controls.jsx';
import './Menu.css';

export const MenuSurface = forwardRef(function MenuSurface({ className = '', ...props }, ref) {
    return <div ref={ref} className={`os-menu-surface ${className}`} {...props} />;
});

export const MenuItem = forwardRef(function MenuItem({ className = '', ...props }, ref) {
    return <Button {...props} ref={ref} appearance="plain" className={`os-menu-item ${className}`} />;
});

export function MenuSeparator() {
    return <hr className="os-menu-separator" />;
}
