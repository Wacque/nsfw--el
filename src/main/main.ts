import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { exec, spawn, ChildProcessWithoutNullStreams } from 'child_process';
import kill from 'tree-kill';
import fs from 'fs';

export const AUTH_FILE_PATH = path.resolve(__dirname, '../auth/auth.json');
const CODEGEN_RESULT_PATH = path.resolve(__dirname, '../codegen-result');
const PLAYWRIGHT_CONFIG_PATH = path.resolve(__dirname, '../config/playwright.config.js');

const getAuthFilePath = () => {
   // check if the file exists
    if (fs.existsSync(AUTH_FILE_PATH)) {
         return AUTH_FILE_PATH;
    }

    return ""
}

class AppUpdater {
    constructor() {
        log.transports.file.level = 'info';
        autoUpdater.logger = log;
        void autoUpdater.checkForUpdatesAndNotify();
    }
}

let mainWindow: BrowserWindow | null = null;
let recorderProcess: ChildProcessWithoutNullStreams | null = null;

const createWindow = async () => {
    const isDebug =
        process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

    if (isDebug) {
        const {
            default: installExtension,
            REACT_DEVELOPER_TOOLS
        } = require('electron-devtools-installer');
        await installExtension(REACT_DEVELOPER_TOOLS);
        require('electron-debug')();
    }

    const RESOURCES_PATH = app.isPackaged
        ? path.join(process.resourcesPath, 'assets')
        : path.join(__dirname, '../../assets');

    const getAssetPath = (...paths: string[]): string => {
        return path.join(RESOURCES_PATH, ...paths);
    };

    mainWindow = new BrowserWindow({
        show: false,
        width: 1024,
        height: 728,
        icon: getAssetPath('icon.png'),
        webPreferences: {
            preload: app.isPackaged
                ? path.join(__dirname, 'preload.js')
                : path.join(__dirname, '../../.erb/dll/preload.js')
        }
    });

    void mainWindow.loadURL(resolveHtmlPath('index.html'));

    mainWindow.on('ready-to-show', () => {
        if (!mainWindow) {
            throw new Error('"mainWindow" is not defined');
        }
        if (process.env.START_MINIMIZED) {
            mainWindow.minimize();
        } else {
            mainWindow.show();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    const menuBuilder = new MenuBuilder(mainWindow);
    menuBuilder.buildMenu();

    mainWindow.webContents.setWindowOpenHandler((edata) => {
        shell.openExternal(edata.url);
        return { action: 'deny' };
    });

    new AppUpdater();
};
ipcMain.handle('start-recorder', async (event, url) => {
    let recorderOutput = '';

    recorderProcess = spawn('npx', [
        'playwright',
        'codegen',
        url,
        '-o',
        path.resolve(CODEGEN_RESULT_PATH, "my-test.spec.js"),
        `--save-storage=${AUTH_FILE_PATH}`,
        `--load-storage=${getAuthFilePath()}`
    ]);

    recorderProcess.stdout.on('data', (data) => {
        recorderOutput += data.toString();
        if (mainWindow) {
            mainWindow.webContents.send('test-output', `Recorder: ${data}`);
        }
        console.log('recorder 1', data.toString())
    });

    recorderProcess.stderr.on('data', (data) => {
        recorderOutput += data.toString();
        if (mainWindow) {
            mainWindow.webContents.send('test-output', `Recorder Error: ${data}`);
        }
        console.log('recorder 2', data.toString())
    });

    recorderProcess.on('close', (code) => {
        console.log('recorder close', code)

        if (mainWindow) {
            mainWindow.webContents.send('recorder-stopped');
            mainWindow.webContents.send('test-output', `Recorder exited with code ${code}`);
            mainWindow.webContents.send('recorder-result', recorderOutput);
        }
    });

    if (mainWindow) {
        mainWindow.webContents.send('test-output', 'Recorder started.');
    }
});

ipcMain.handle('stop-recorder', async () => {
    if (recorderProcess) {
        const { pid } = recorderProcess;
        console.log('pid', pid);
        try {
            kill(pid!, 'SIGTERM', (err) => {
                if (err) {
                    if (mainWindow) {
                        mainWindow.webContents.send('test-output', `Error: ${err.message}`);
                    }
                } else {
                    if (mainWindow) {
                        mainWindow.webContents.send('recorder-stopped');
                    }
                }
            });
        } catch (error: any) {
            if (mainWindow) {
                mainWindow.webContents.send('test-output', `Error: ${error.message}`);
            }
        }
    } else {
        if (mainWindow) {
            mainWindow.webContents.send('test-output', 'No recorder process to stop.');
        }
    }
});

ipcMain.handle('run-spec', () => {
    exec(
        `npx playwright test --headed ${path.resolve(CODEGEN_RESULT_PATH, "my-test.spec.js")}`,
        (error, stdout, stderr) => {
            if (error) {
                mainWindow?.webContents.send('test-output', `Error: ${error.message}`);
                return;
            }
            if (stderr) {
                mainWindow?.webContents.send('test-output', `Stderr: ${stderr}`);
                return;
            }
            mainWindow?.webContents.send('test-output', `Stdout: ${stdout}`);
        }
    );
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) createWindow();
});

app
    .whenReady()
    .then(() => {
        createWindow();
        app.on('activate', () => {
            if (mainWindow === null) createWindow();
        });
    })
    .catch(console.log);
