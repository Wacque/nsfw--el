/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import fs from 'fs';
import { IpcMessage } from '../../interface';
import { TaskStatus } from '../../constants';

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 4343;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

export function checkFolderAndCreateIfNot(folderPath: string) {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }
}

export function createIpcMessage<T>(status: TaskStatus, message: string, data?: T): IpcMessage<T> {
    return { status, message, data };
}

export function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
