import path from 'path';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { checkFolderAndCreateIfNot, createIpcMessage, delay, resolveHtmlPath } from './util';
import { ChildProcessWithoutNullStreams, exec, spawn } from 'child_process';
import kill from 'tree-kill';
import fs from 'fs';
import {
    API_BASE_URL,
    AUTH_FILE_FOLDER_NAME,
    AUTH_FILE_NAME,
    CODEGEN_OUTPUT_FOLDER_NAME,
    EVENTS,
    READY_TO_RUN,
    RUN_OUTPUT_FOLDER_NAME, STATIC_FILE_SERVE_PORT,
    TaskStatus,
    TOKEN,
    TOKEN_KEY, WS_SERVE_PORT
} from '../../constants';
import stripAnsi from 'strip-ansi';
import express from 'express'
// import WebSocket from 'ws'

const expressApp = express()
expressApp.use(express.static('.'))
expressApp.listen(STATIC_FILE_SERVE_PORT, () => {
    console.log('app runs in http://localhost:' + STATIC_FILE_SERVE_PORT)
})
//
// const server = new WebSocket.Server({ port: WS_SERVE_PORT });
//
// server.on('connection', (ws) => {
//     console.log('New client connected');
//
//     ws.on('message', (message) => {
//         console.log(`Received: ${message}`);
//         // Echo the message back to the client
//         ws.send(`You said: ${message}`);
//     });
//
//     ws.on('close', () => {
//         console.log('Client disconnected');
//     });
//
//     ws.on('error', (error) => {
//         console.error(`Error: ${error}`);
//     });
//
//     // Send a welcome message
//     ws.send('Welcome to the WebSocket server!');
// });
//
// console.log('WebSocket server is listening on ws://localhost:8080');

const ROOT_PATH = process.cwd();

const AUTH_FILE_FOLDER = path.resolve(ROOT_PATH, AUTH_FILE_FOLDER_NAME);
const CODEGEN_RESULT_FOLDER = path.resolve(ROOT_PATH, CODEGEN_OUTPUT_FOLDER_NAME);
const RUN_OUTPUT_FOLDER = path.resolve(ROOT_PATH, RUN_OUTPUT_FOLDER_NAME);
const CODEGEN_RESULT_FILE = path.resolve(CODEGEN_RESULT_FOLDER, 'my-test.spec.js');
const READY_TO_RUN_FOLDER = path.resolve(ROOT_PATH, READY_TO_RUN);
const RUN_ERROR_PATH = path.resolve(ROOT_PATH, 'runError.log');
const RUN_RESULT_PATH = path.resolve(ROOT_PATH, 'result.json');

checkFolderAndCreateIfNot(AUTH_FILE_FOLDER);
checkFolderAndCreateIfNot(CODEGEN_RESULT_FOLDER);
checkFolderAndCreateIfNot(RUN_OUTPUT_FOLDER);
checkFolderAndCreateIfNot(READY_TO_RUN_FOLDER);

const getAuthFilePath = () => {
    const filePath = path.resolve(AUTH_FILE_FOLDER, AUTH_FILE_NAME);
    if (fs.existsSync(filePath)) {
        return filePath;
    }
    return '';
};

class AppUpdater {
    constructor() {
        log.transports.file.level = 'info';
        autoUpdater.logger = log;
        void autoUpdater.checkForUpdatesAndNotify();
    }
}

let mainWindow: BrowserWindow | null = null;
let recorderProcess: ChildProcessWithoutNullStreams | null = null;

const sendMessageAfterRecordSuccessEnd = async function() {
    await delay(100);
    if (fs.existsSync(CODEGEN_RESULT_FILE)) {
        const codegenResult = fs.readFileSync(CODEGEN_RESULT_FILE, 'utf-8').toString();

        mainWindow!.webContents.send(EVENTS.RECORDER_STOPPED, createIpcMessage(
            TaskStatus.Success,
            'Recorder process successfully stopped.',
            codegenResult
        ));
    } else {
        mainWindow!.webContents.send(EVENTS.RECORDER_STOPPED, createIpcMessage(
            TaskStatus.Error,
            'Recorder process successfully stopped, but no codegen result found.'
        ));

    }
};

const getRunErrorLog = function() {
    if (fs.existsSync(RUN_ERROR_PATH)) {
        return stripAnsi(fs.readFileSync(RUN_ERROR_PATH, 'utf-8').toString());
    }

    return '';
};

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

ipcMain.handle(EVENTS.START_RECORDER, async (event, url) => {
    let recorderOutput = '';
    console.log('start recorder', path.resolve(AUTH_FILE_FOLDER, AUTH_FILE_NAME));
    try {
        recorderProcess = spawn('npx', [
            'playwright',
            'codegen',
            url,
            '-o',
            CODEGEN_RESULT_FILE,
            // `--save-storage=${path.resolve(AUTH_FILE_FOLDER, AUTH_FILE_NAME)}`,
            `--load-storage=${getAuthFilePath()}`
        ]);

        recorderProcess.stdout.on('data', (data) => {
            recorderOutput += data.toString();
            if (mainWindow) {
                mainWindow.webContents.send(EVENTS.TEST_OUTPUT, createIpcMessage(TaskStatus.Info, `Recorder: ${data}`));
            }
            console.log('recorder 1', data.toString());
        });

        recorderProcess.stderr.on('data', (data) => {
            recorderOutput += data.toString();
            if (mainWindow) {
                mainWindow.webContents.send(EVENTS.TEST_OUTPUT, createIpcMessage(TaskStatus.Error, `Recorder Error: ${data}`));
            }
            console.log('recorder 2', data.toString());
        });

        recorderProcess.on('close', (code) => {
            console.log('recorder close', code);

            if (mainWindow) {
                sendMessageAfterRecordSuccessEnd();
                mainWindow.webContents.send(EVENTS.RECORDER_RESULT, createIpcMessage(TaskStatus.Success, recorderOutput));
            }
        });

        if (mainWindow) {
            mainWindow.webContents.send(EVENTS.RECORDER_STARTED, createIpcMessage(
                TaskStatus.Success,
                'Recorder started.'
            ));
        }
    } catch (error: any) {
        if (mainWindow) {
            mainWindow.webContents.send(EVENTS.RECORDER_STARTED, createIpcMessage(
                TaskStatus.Error,
                `Error: ${error.message}`
            ));
        }
    }
});

ipcMain.handle(EVENTS.STOP_RECORDER, async () => {
    if (recorderProcess) {
        const { pid } = recorderProcess;
        console.log('pid', pid);
        try {
            kill(pid!, 'SIGTERM', (err) => {
                if (err) {
                    if (mainWindow) {
                        mainWindow.webContents.send(EVENTS.RECORDER_STOPPED, createIpcMessage(
                            TaskStatus.Error,
                            `Error: ${err.message}`
                        ));
                    }
                } else {
                    if (mainWindow) {
                        sendMessageAfterRecordSuccessEnd();
                    }
                }
            });
        } catch (error: any) {
            if (mainWindow) {
                mainWindow.webContents.send(EVENTS.RECORDER_STOPPED, createIpcMessage(
                    TaskStatus.Error,
                    `Error: ${error.message}`
                ));
            }
        }
    } else {
        if (mainWindow) {
            mainWindow.webContents.send(EVENTS.RECORDER_STOPPED, createIpcMessage(
                TaskStatus.Error,
                'No recorder process to stop.'
            ));
        }
    }
});

ipcMain.handle(EVENTS.SPEC_PREPARE_READY_TO_RUN, async (event, taskId) => {
    try {
        console.log('start');
        // use node-fetch to get file from /script/get_script, and then save to ready_to_run
        const fetch = require('node-fetch');
        const res = await fetch(`${API_BASE_URL}/script/get_script?task_id=${taskId}&script_type=beta`, {
            headers: {
                [TOKEN_KEY]: TOKEN
            }
        });
        const body = res.body;

        // get file name from body

        const fileName = res.headers.get('content-disposition')?.split('filename=')[1];

        const filePath = path.resolve(READY_TO_RUN_FOLDER, fileName);
        body.pipe(fs.createWriteStream(filePath));

        if (mainWindow) {
            mainWindow.webContents.send(EVENTS.SPEC_PREPARE_RESULT, createIpcMessage(
                TaskStatus.Success,
                'Spec prepared.',
                fileName
            ));
        }
    } catch (e) {
        console.error("eeee", e);
        mainWindow?.webContents.send(EVENTS.SPEC_PREPARE_RESULT, createIpcMessage(
            TaskStatus.Error,
            'load file fail'
        ));
    }

});

ipcMain.handle(EVENTS.RUN_SPEC, async (event, fileName: string) => {
    if (mainWindow) {
        mainWindow.webContents.send(EVENTS.SPEC_RUN_STARTED, createIpcMessage(
            TaskStatus.Success,
            'Spec run started.'
        ));
    }

    if (fs.existsSync(RUN_ERROR_PATH)) {
        fs.unlinkSync(RUN_ERROR_PATH);
    }

    console.log("fileName", fileName)

    try {
        const command = `npx playwright test --headed ${path.resolve(READY_TO_RUN_FOLDER, fileName)} > runError.log`;
        const childProcess = exec(command, (error, stdout, stderr) => {
            if (error) {
                console.log('error1', error);
                mainWindow?.webContents.send(EVENTS.SPEC_RUN_STATUS, createIpcMessage(
                    TaskStatus.Error,
                    getRunErrorLog()
                ));
                return;
            }
            if (stderr) {
                console.log('error2', stderr);
                mainWindow?.webContents.send(EVENTS.SPEC_RUN_STATUS, createIpcMessage(
                    TaskStatus.Error,
                    getRunErrorLog()
                ));
                return;
            }
            mainWindow?.webContents.send(EVENTS.SPEC_RUN_STATUS, createIpcMessage(
                TaskStatus.Success,
                `Stdout: ${stdout}`
            ));
        });

        childProcess.on('exit', (code, signal) => {
            mainWindow?.webContents.send(EVENTS.SPEC_RUN_STATUS, createIpcMessage(
                code === 0 ? TaskStatus.Success : TaskStatus.Error,
                `Process exited with code: ${code}, signal: ${signal}`
            ));
        });

        childProcess.on('close', (code) => {
            mainWindow?.webContents.send(EVENTS.SPEC_RUN_STATUS, createIpcMessage(
                code === 0 ? TaskStatus.Success : TaskStatus.Error,
                `Process closed with code: ${code}, ${code === 0 ? 'Spec run ended.' : getRunErrorLog()}`
            ));
        });

        childProcess.on('error', (err) => {
            mainWindow?.webContents.send(EVENTS.SPEC_RUN_STATUS, createIpcMessage(
                TaskStatus.Error,
                getRunErrorLog()
            ));
        });

    } catch (error: any) {
        console.log('error3', error);
        mainWindow?.webContents.send(EVENTS.SPEC_RUN_STATUS, createIpcMessage(
            TaskStatus.Error,
            getRunErrorLog()
        ));
    }
});

ipcMain.handle('get-run-result-data', async (event) => {
    if (fs.existsSync(RUN_RESULT_PATH)) {
        try {
            console.log(RUN_RESULT_PATH)
            return JSON.parse(fs.readFileSync(RUN_RESULT_PATH).toString());
        } catch (e) {
            console.log(e)
            return [];
        }
    }

    return []
});

async function fetchDataFromSomewhere() {
    // 模拟从其他地方获取数据
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ message: 'Hello from main process!' });
        }, 1000);
    });
}


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) void createWindow();
});

app
    .whenReady()
    .then(() => {
        void createWindow();
        app.on('activate', () => {
            if (mainWindow === null) void createWindow();
        });
    })
    .catch(console.log);
