import { createRoot } from 'react-dom/client';
import App from './App';
import { HashRouter, Route,  Routes } from 'react-router-dom';
import Home from './Home';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
    <HashRouter>
        <Routes>
            <Route path="/app" element={<App />} />
            <Route path="/" element={<Home/>} />
        </Routes>
    </HashRouter>
);

// calling IPC exposed from preload script
window.electron.ipcRenderer.once('ipc-example', (arg) => {
    // eslint-disable-next-line no-console
    console.log(arg);
});

window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);
