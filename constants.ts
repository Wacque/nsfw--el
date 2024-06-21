export const AUTH_FILE_NAME = 'auth.json';
export const AUTH_FILE_FOLDER_NAME = 'auth';
export const RUN_OUTPUT_FOLDER_NAME = 'run-output';
export const CODEGEN_OUTPUT_FOLDER_NAME = 'codegen-output';
export const READY_TO_RUN = 'ready-to-run';
export const API_BASE_URL = 'http://10.255.9.247:8080/api';
export const TOKEN_KEY = "X-TOKEN"
export const TOKEN = 'nsfMw.20240622';
export const EVENTS = {
    START_RECORDER: 'start-recorder',
    STOP_RECORDER: 'stop-recorder',
    RUN_SPEC: 'run-spec',
    TEST_OUTPUT: 'test-output',
    RECORDER_STOPPED: 'recorder-stopped',
    RECORDER_RESULT: 'recorder-result',
    RECORDER_STARTED: 'recorder-started',
    SPEC_RUN_STATUS: 'spec-run-status',
    SPEC_RUN_ENDED: 'spec-run-ended',
    SPEC_RUN_STARTED: 'spec-run-started',
    SPEC_PREPARE_READY_TO_RUN: 'spec-prepare-ready-to-run',
    SPEC_PREPARE_RESULT: 'spec-prepare-result',
};


export enum TaskStatus {
    Success = 'success',
    Error = 'error',
    Info = 'info',
}
