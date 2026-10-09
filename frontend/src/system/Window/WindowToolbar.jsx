/* eslint-disable react/prop-types */
import { useContext } from 'react';
import { createPortal } from 'react-dom';

import { WindowToolbarContext } from './WindowToolbarContext.js';

// Keep page state and handlers in the app while rendering controls in its window chrome.
export function WindowToolbar({ children, label, className = '' }) {
    const toolbar = useContext(WindowToolbarContext);
    return toolbar?.host ? createPortal(<div className={`os-window-toolbar ${className}`} role="group" aria-label={label} onPointerDown={toolbar.onPointerDown} onDoubleClick={toolbar.onDoubleClick}>{children}</div>, toolbar.host) : null;
}
