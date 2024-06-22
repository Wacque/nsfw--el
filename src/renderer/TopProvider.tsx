import React, { createContext, Dispatch, MutableRefObject, useEffect, useRef, useState } from 'react';
import { CreateTaskResponse, IpcMessage, TaskItem } from '../../interface';
import { createTask, debugScript, getTaskList, initScript, optimizeScript, submitResult } from './api';
import { TARGET_URL, TaskStatus } from '../../constants';
import { getLatestState } from './utils';
import { message } from 'antd';
import { MessageInstance } from 'antd/es/message/interface';

interface ITopContext {
    taskList: TaskItem[];
    setTaskList: Dispatch<TaskItem[]>;
    onLoadTask: boolean,
    selectedTask?: TaskItem,
    setSelectedTask: Dispatch<TaskItem>
    handleStartRecorder: () => void;
    recording: boolean,
    codegenResult?: string,
    scriptInit: () => Promise<void>,
    messageApi: MessageInstance
    startRunSpec: () => void,
    runningSpec: boolean,
    runError?: string,
    runResult?: any[],
    submitOptimize: (userPrompt: string) => Promise<void>,
    setCodegenResult: Dispatch<string>,
    debugPrompt: () => Promise<void>,
    runStatus: TaskStatus,
    refreshData: () => void
}

export const TopContext = createContext<ITopContext>({} as ITopContext);

export default function TopProvider({children}: { children: React.ReactNode }) {
    const [taskList, setTaskList] = useState<TaskItem[]>([]);
    const [onLoadTask, setOnLoadTask] = useState(true);
    const [selectedTask, setSelectedTask] = useState<TaskItem>();
    const [url, setUrl] = useState('');
    const [output, setOutput] = useState<IpcMessage[]>([]);
    const [recording, setRecording] = useState(false);
    const [runningSpec, setRunningSpec] = useState(false);
    const [codegenResult, setCodegenResult] = useState("");
    const optimizeTextRef = useRef<HTMLTextAreaElement>(null);
    const [scriptResult, setScriptResult] = useState<string>();
    const [prepareRunFileName, setPrepareRunFileName] = useState();
    const [runError, setRunError] = useState<string>();
    const [messageApi, contextHolder] = message.useMessage();
    const [runResult, setRunResult] = useState<any[]>([]);
    const [runStatus, setRunStatus] = useState<TaskStatus>(TaskStatus.Success);

    useEffect(() => {
        getTaskList().then((res) => {
            setTaskList(res.data);
        }).finally(() => {
            setOnLoadTask(false)
        })

        const handleTestOutput = (message: IpcMessage) => {
            setOutput((prevOutput) => [...prevOutput, message]);
        };

        const handleRecorderStarted = () => {
            setRecording(true);
        };

        const handleRecorderStopped = async (message: IpcMessage) => {
            setRecording(false);

            if (message.status === TaskStatus.Success) {
                setCodegenResult(message?.data ?? "")
            }
        };


        const handleSpecRunStarted = () => {
            setRunningSpec(true);
        };

        // const handleSpecRunStopped = (e: IpcMessage) => {
        //     setRunningSpec(false);
        //
        //     if(e.status === TaskStatus.Error) {
        //         setRunError(e.message ?? "")
        //     }
        // };

        const handelSpecRunStatus = async function(e: IpcMessage) {
            console.log('handelSpecRunStatus', e);
            setRunStatus(e.status)
            if(e.status === TaskStatus.Success) {
                setRunError("")
                setRunningSpec(false);
                await refreshData()
            } else if (e.status === TaskStatus.Error) {
                setRunningSpec(false);
                setRunError(e.message ?? "")
            }

            if([TaskStatus.Success].includes(e.status)) {

            }
        };

        const handlePrepareRun = function(e: IpcMessage) {
            if(e.data) {
                setPrepareRunFileName(e.data)
            }
        }

        window.electron.onTestOutput(handleTestOutput);
        window.electron.onRecorderStarted(handleRecorderStarted);
        window.electron.onRecorderStopped(handleRecorderStopped);
        window.electron.onSpecRunStarted(handleSpecRunStarted);
        // window.electron.onSpecRunEnded(handleSpecRunStopped);
        window.electron.onSpecRunStatus(handelSpecRunStatus);
        window.electron.onPrepareRun(handlePrepareRun)
    }, []);

    const refreshData = async function() {
        const res = await getRunResultData()
        console.log('refreshData', res)
        messageApi.info('数据已经更新')
        setRunResult(res)
    }


    const handleStartRecorder = () => {
        void window.electron.startRecorder(TARGET_URL);
    };

    const handleStopRecorder = () => {
        void window.electron.stopRecorder();
    };

    const handleRunSpec = async () => {
        setRunError("")
        setRunStatus(TaskStatus.Success)
        const _fileName = await getLatestState(setPrepareRunFileName)

        if(_fileName) {
            void window.electron.runSpec(_fileName!);
        }
    };

    const afterInitScript = async function(taskId: number) {
        await getPreparedFile(taskId)
    }


    const startCreateTask = async function() {
        const res = await createTask('hello world', 'this is a test task');
        // setTask(res!.data!);
    };

    const submitOptimize = async function(userPrompt: string) {
        const _task = await getLatestState(setSelectedTask);
        console.log('submitOptimize',_task, _task?.id, userPrompt)

        const res = await optimizeScript(Number(_task!.id!), userPrompt);
        console.log(res);
        void getPreparedFile(Number(_task!.id!))
        messageApi.info('优化成功，接下来可以继续测试')
    };

    const scriptInit = async function() {
        const _task = await getLatestState(setSelectedTask);
        const _codegenResult = await getLatestState(setCodegenResult);
        const res = await initScript(_task?.id , _codegenResult!);
        await afterInitScript(res.data.task_id);
    }

    const getPreparedFile = async function(taskId: number){
        await window.electron.prepareReadyToRun(taskId);
        console.log('getPreparedFile', taskId)
    }

    const debugPrompt = async function() {
        let _error = await getLatestState(setRunError)
        const _task = await getLatestState(setSelectedTask)

        const res = await debugScript(Number(_task?.id!), _error!)
        await getPreparedFile(Number(_task?.id!))
        setRunError("")
        setRunStatus(TaskStatus.Success)
        messageApi.info('调试完成，接下来可以继续测试')
    }

    const getRunResultData = async function() {
        return await window.electron.getRunResultData()
    }

    const uploadResult = async function() {
        const res = await window.electron.getRunResultData()
        console.log('res', res)
        const _task = await getLatestState(selectedTask)
        void submitResult(_task!.id, res)
    }

    return <TopContext.Provider value={{
        taskList,
        setTaskList,
        onLoadTask,
        selectedTask,
        setSelectedTask,
        handleStartRecorder,
        recording,
        codegenResult,
        scriptInit,
        messageApi,
        startRunSpec: handleRunSpec,
        runningSpec,
        runError,
        runResult,
        submitOptimize,
        setCodegenResult,
        debugPrompt,
        runStatus,
        refreshData
    }}>
        {children}
        {contextHolder}
    </TopContext.Provider>;
}
