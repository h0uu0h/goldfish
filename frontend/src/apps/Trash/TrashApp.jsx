import { useDesign } from '../../system/Design/DesignContext.jsx';
import { resolveAppIcon } from '../../system/Design/iconThemes.js';
import { getApp } from '../meta.js';
import './TrashApp.css';

export default function TrashApp() {
    const { params: { iconTheme } } = useDesign();
    return <div className="trash-app" data-icon-theme={iconTheme}>
        <div className="trash-empty"><img src={resolveAppIcon(getApp('trash'), iconTheme)} alt="" /><h2>废纸篓是空的</h2><p>暂无已删除的项目。</p></div>
        <footer>0 个项目</footer>
    </div>;
}
