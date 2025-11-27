import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n';
import { signalAppReady } from './bootLoader';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

// Signal that app is ready to hide the initial loader
signalAppReady();
