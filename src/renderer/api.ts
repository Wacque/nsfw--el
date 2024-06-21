import http from './axios';
import { ApiResponseBase, CreateTaskResponse, initScriptResponse } from '../../interface';

export const createTask =  (name: string, description: string) => {
    return http.post<CreateTaskResponse>('/task/create_task', {
        name,
        description
    });
};

export const initScript = (taskId: number, script: string) => {
    return http.post<initScriptResponse>('/script/init_script', {
        task_id: taskId,
        template_script: script
    });
}

export const optimizeScript = (taskId: number, user_prompt: string) => {
    return http.post<ApiResponseBase<void>>('/script/optimize_script', {
        task_id: taskId,
        user_prompt
    });
}

export const getScript = function(taskId: number) {
    return http.get(`/script/get_script`, {
        params: {
            task_id: taskId,
            script_type: "beta"
        }
    });
}

export const debugScript = function(taskId: number, prompt: string) {
    return http.post(`/script/debug_script`, {
        task_id: taskId,
        user_prompt: prompt
    });
}

export const submitResult = function(taskId: number, rawData: any[]) {
    return http.post(`/data_process/start`, {
        task_id: taskId,
        raw_data: rawData
    });
}
