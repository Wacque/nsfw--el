import { devices } from '@playwright/test';
import path from 'path';
import { AUTH_FILE_FOLDER_NAME, AUTH_FILE_NAME, RUN_OUTPUT_FOLDER_NAME } from './constants';

const config = {
  use: {
    // 定义所有测试的全局配置
    storageState: path.resolve(process.cwd(), `${AUTH_FILE_FOLDER_NAME}/${AUTH_FILE_NAME}`),
    outputDir: path.resolve(process.cwd(), RUN_OUTPUT_FOLDER_NAME),
    // 使用桌面浏览器的某个设备配置（您可以修改为其他配置）
    ...devices['Desktop Chrome']
  },
  reporter: [
    ['list'],
    ['json', { outputFile: 'reporter.json' }],
    // 也可以使用其他报告器，比如 'html'
    // ['html', { open: 'never' }],
  ],
};

export default config;
