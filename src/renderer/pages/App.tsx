import React, { useState, useEffect, useRef } from 'react';
import { CreateTaskResponse, IpcMessage } from '../../../interface';
import { createTask, debugScript, getScript, initScript, optimizeScript, submitResult } from '../api';
import { TARGET_URL, TaskStatus } from '../../../constants';
import { getLatestState } from '../utils';
import { Button } from 'antd';
import '../styles/app.scss'
import Header from '../Component/Header';

const App = () => {
    const [url, setUrl] = useState('');
    const [output, setOutput] = useState<IpcMessage[]>([]);
    const [recording, setRecording] = useState(false);
    const [runningSpec, setRunningSpec] = useState(false);
    const [task, setTask] = useState<CreateTaskResponse>();
    const codegenResult = useRef<string>();
    const optimizeTextRef = useRef<HTMLTextAreaElement>(null);
    const [scriptResult, setScriptResult] = useState<string>();
    const [prepareRunFileName, setPrepareRunFileName] = useState();
    const [runError, setRunError] = useState<string>();

    const handleStartRecorder = () => {
        void window.electron.startRecorder(TARGET_URL);
    };

    const handleStopRecorder = () => {
        void window.electron.stopRecorder();
    };

    const handleRunSpec = async () => {
        const _fileName = await getLatestState(setPrepareRunFileName)
        // todo
        void window.electron.runSpec(_fileName!);
    };

    useEffect(() => {
        const handleTestOutput = (message: IpcMessage) => {
            setOutput((prevOutput) => [...prevOutput, message]);
        };

        const handleRecorderStarted = () => {
            setRecording(true);
        };

        const handleRecorderStopped = async (message: IpcMessage) => {
            setRecording(false);

            if (message.status === TaskStatus.Success) {
                codegenResult.current = message?.data ?? '';
            }
        };


        const handleSpecRunStarted = () => {
            setRunningSpec(true);
        };

        const handleSpecRunStopped = (e: IpcMessage) => {
            setRunningSpec(false);

            if(e.status === TaskStatus.Error) {
                setRunError(e.message ?? "")
            }
        };

        const handelSpecRunStatus = function(e: IpcMessage) {
            console.log('handelSpecRunStatus', e);
            if(e.status === TaskStatus.Success) {
                setRunningSpec(false);
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
        window.electron.onSpecRunEnded(handleSpecRunStopped);
        window.electron.onSpecRunStatus(handelSpecRunStatus);
        window.electron.onPrepareRun(handlePrepareRun)

        return () => {

        };
    }, []);

    const afterInitScript = async function(taskId: number) {
        // const a = await getScript(taskId)
        // console.log("script===================", a.data)
        // setScriptResult(a.data)
        void getPreparedFile(taskId)
    }


    const startCreateTask = async function() {
        const res = await createTask('hello world', 'this is a test task');
        setTask(res!.data!);
    };

    const submitOptimize = async function() {
        const _task = await getLatestState(setTask);

        const res = await optimizeScript(_task!.task_id, optimizeTextRef.current!.value);
        console.log(res);
        void getPreparedFile(_task!.task_id)
    };

    const scriptInit = async function() {
        const _task = await getLatestState(setTask);
        const res = await initScript(_task?.task_id ?? 0, codegenResult.current!);
        void afterInitScript(res.data.task_id);
    }

    const getPreparedFile = async function(taskId: number){
        await window.electron.prepareReadyToRun(taskId);
        console.log('getPreparedFile', taskId)
    }

    const debugPrompt = async function() {
        const _error = await getLatestState(setRunError)
        const _task = await getLatestState(setTask)
        const res = await debugScript(_task?.task_id!, _error!)
        void getPreparedFile(_task?.task_id!)
    }

    const uploadResult = async function() {
        const res = await window.electron.getRunResultData()
        console.log('res', res)
        void submitResult(task!.task_id, res)
    }

    return (
        <div>
            <Header/>
            {
                task && <div>
                <div>Id: {task.task_id}</div>
                <div>Create at: {task.created_at}</div>
              </div>
            }
            <Button onClick={uploadResult}>
                submit result
            </Button>
            <button onClick={startCreateTask}>
                create task
            </button>
            <button onClick={handleStartRecorder} disabled={recording || runningSpec}>
                Start Recorder
            </button>
            <button onClick={handleStopRecorder} disabled={!recording || runningSpec}>
                Stop Recorder
            </button>
            <button onClick={handleRunSpec} disabled={recording || runningSpec}>
                Run Test Spec
            </button>
            <div>
                prepareRunFileName: {prepareRunFileName}
                <h2>
                    Optimize script
                </h2>
                <textarea ref={optimizeTextRef} name="" id=""></textarea>
                <div>
                    <button onClick={submitOptimize}>Submit</button>
                </div>
                <h3>Optimize Result</h3>
                <div>
                    {scriptResult}
                </div>
            </div>
            <div>
                <button onClick={scriptInit}>Init Script</button>
                <button>Publish</button>
            </div>
            <h2>Output</h2>
            <pre>
                {output.map((line, index) => (
                    <div key={index}>{line.message}</div>
                ))}
              </pre>
            <h2>Run error</h2>
            <div>
                {runError}
            </div>
            <button onClick={debugPrompt}>debug</button>
        </div>
    );
};

export default App;
