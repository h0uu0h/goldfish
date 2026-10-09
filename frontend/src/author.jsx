import { createRoot } from 'react-dom/client';
import AboutApp from './apps/About/AboutApp.jsx';
import './apps/About/AuthorDocument.css';

createRoot(document.getElementById('root')).render(<AboutApp />);
