// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  startTest: (url: string) => ipcRenderer.invoke('start-test', url),
  startRecorder: (url: string) => ipcRenderer.invoke('start-recorder', url),
  stopRecorder: () => ipcRenderer.invoke('stop-recorder'),
  runSpec: () => ipcRenderer.invoke('run-spec'),
  onTestOutput: (callback: (message: string) => void) =>
    ipcRenderer.on('test-output', (event, message) => callback(message)),
  onRecorderStarted: (callback: () => void) =>
    ipcRenderer.on('recorder-started', callback),
  onRecorderStopped: (callback: () => void) =>
    ipcRenderer.on('recorder-stopped', callback),
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
