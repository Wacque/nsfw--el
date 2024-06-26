import { TaskStatus } from './constants';

export interface IpcMessage<T = void> {
    status: TaskStatus;
    message: string;
    data?: T;
}

export interface CreateTaskResponse {
    created_at: string;
    task_id: number;
}

export interface initScriptResponse {
    task_id: number;
}

export interface TaskItem {
    description: string;
    id: string;
    name: string;
    status: string;
}

export interface ApiResponseBase<T> {
    code: number,
    msg: string,
    data: T
}
