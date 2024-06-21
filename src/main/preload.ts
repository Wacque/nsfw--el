// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { EVENTS } from '../../constants';
import { IpcMessage } from '../../interface';

export type Channels = 'ipc-example';

const electronHandler = {
    ipcRenderer: {
        sendMessage(channel: Channels, ...args: unknown[]) {
            ipcRenderer.send(channel, ...args);
        },
        on<T>(channel: Channels, func: (args: IpcMessage<T>) => void) {
            const subscription = (_event: IpcRendererEvent, args: IpcMessage<T>) => func(args);
            ipcRenderer.on(channel, subscription);

            return () => {
                ipcRenderer.removeListener(channel, subscription);
            };
        },
        once<T>(channel: Channels, func: (args: IpcMessage<T>) => void) {
            ipcRenderer.once(channel, (_event, args: IpcMessage<T>) => func(args));
        }
    },
    startRecorder: (url: string) => ipcRenderer.invoke(EVENTS.START_RECORDER, url),
    stopRecorder: () => ipcRenderer.invoke(EVENTS.STOP_RECORDER),
    runSpec: (fileName: string) => ipcRenderer.invoke(EVENTS.RUN_SPEC, fileName),
    prepareReadyToRun: (taskId: number) => ipcRenderer.invoke(EVENTS.SPEC_PREPARE_READY_TO_RUN, taskId),
    onTestOutput: (callback: (msg: IpcMessage) => void) =>
        ipcRenderer.on(EVENTS.TEST_OUTPUT, (event, msg: IpcMessage) => callback(msg)),
    onRecorderStarted: (callback: (msg: IpcMessage) => void) =>
        ipcRenderer.on(EVENTS.RECORDER_STARTED, (event, msg: IpcMessage) => callback(msg)),
    onRecorderStopped: (callback: (msg: IpcMessage) => void) =>
        ipcRenderer.on(EVENTS.RECORDER_STOPPED, (event, msg: IpcMessage) => callback(msg)),
    onSpecRunStatus: (callback: (msg: IpcMessage) => void) =>
        ipcRenderer.on(EVENTS.SPEC_RUN_STATUS, (event, msg: IpcMessage) => callback(msg)),
    onSpecRunStarted: (callback: (msg: IpcMessage) => void) =>
        ipcRenderer.on(EVENTS.SPEC_RUN_STARTED, (event, msg: IpcMessage) => callback(msg)),
    onSpecRunEnded: (callback: (msg: IpcMessage) => void) =>
        ipcRenderer.on(EVENTS.SPEC_RUN_ENDED, (event, msg: IpcMessage) => callback(msg)),
    onPrepareRun: (callback: (msg: IpcMessage) => void) =>
        ipcRenderer.on(EVENTS.SPEC_PREPARE_RESULT, (event, msg: IpcMessage) => callback(msg)),
    getRunResultData: () => ipcRenderer.invoke('get-run-result-data')
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
