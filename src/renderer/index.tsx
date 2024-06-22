import { createRoot } from 'react-dom/client';
import App from './pages/App';
import { HashRouter, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import './base.scss';
import TopProvider from './TopProvider';
import Step1 from './pages/Step1';
import RunPage from './pages/RunPage';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
    <TopProvider>
        <HashRouter>
            <Routes>
                <Route path="app" element={<App />} />
                <Route path="/" element={<Home />} />
                <Route path="/step1" element={<Step1 />} />
                <Route path="/run" element={<RunPage />} />
            </Routes>
        </HashRouter>
    </TopProvider>
);

// calling IPC exposed from preload script
window.electron.ipcRenderer.once('ipc-example', (arg) => {
    // eslint-disable-next-line no-console
    console.log(arg);
});

window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);
