import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { I18nProvider } from './i18n.js';
import './styles.css';
performance.mark('cvforge:renderer-module-ready');
createRoot(document.getElementById('root')!).render(<I18nProvider><App/></I18nProvider>);
