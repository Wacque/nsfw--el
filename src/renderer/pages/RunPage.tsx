import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Divider, Flex, Input, Layout, Spin, Table } from 'antd';
import Header from '../Component/Header';
import { TopContext } from '../TopProvider';
import { TaskStatus } from '../../../constants';
import {ReloadOutlined} from '@ant-design/icons';

const { TextArea } = Input;
const { Header: AntHeader, Content, Sider, Footer } = Layout;

const commonRender = (text: any) => {
    if (typeof text === 'string') {
        // Check if the string is a URL of an image
        if (text.match(/\.(jpeg|jpg|gif|png)$/) != null) {
            return <img src={text} alt="img" style={{ width: '100px' }} />;
        }

        // Check if the string is a URL
        try {
            const url = new URL(text);
            return <a href={text} target="_blank" rel="noopener noreferrer">{text}</a>;
        } catch (e) {
            // If text is not a valid URL, treat it as a regular string
            return text;
        }
    }

    if (typeof text === 'number') {
        return text;
    }

    // Convert other types to string for rendering
    return JSON.stringify(text);
};


const RunPage = () => {
    const {
        startRunSpec,
        selectedTask,
        runStatus,
        runError,
        runningSpec,
        runResult,
        submitOptimize,
        debugPrompt,
        refreshData,
        scriptInit,
        handleStartRecorder,
        recording,
        resetError
    } = useContext(TopContext);
    const inputRef = useRef<string>('');
    const [startLoading, setStartLoading] = useState(false);

    const getTableStruct = function() {
        if (runResult && runResult.length > 0) {
            const first = runResult[0];
            return Object.keys(first).map((key) => {
                return {
                    title: key,
                    dataIndex: key,
                    key: key,
                    render: (text: string) => commonRender(text)
                };
            });
        }

        return [];

    };

    const getTableData = function() {
        return runResult?.map((item, index) => {
            return {
                ...item,
                key: index
            };
        });

    };

    const inputChange = function(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        inputRef.current = e.target.value;
    };

    useEffect(() => {
        resetError()
    }, []);

    const getError = function() {
        if (runStatus === TaskStatus.Error) {
            return <div className={'mt-20px'}>
                <Alert type={'error'} message={<div>
                    {runError}
                </div>}>
                </Alert>
                <Button onClick={startDebug}>一键调试错误</Button>
            </div>;
        }

        return null;

    };

    const startDebug = async function() {
        try {
            setStartLoading(true);
            await debugPrompt();
        } finally {
            setStartLoading(false);
        }
    };

    const startOptimize = async function() {
        try {
            setStartLoading(true);
            await submitOptimize(inputRef.current);
        } finally {
            setStartLoading(false);
        }
    };

    const goInit = async function() {
        try {
            setStartLoading(true);
            await scriptInit();
        } finally {
            setStartLoading(false);
        }
    }

    const goRecord = function() {
        handleStartRecorder()
    }

    return (
        <Layout style={{ height: '100vh', overflowY: 'scroll' }}>
            <Header />
            <Spin spinning={runningSpec || startLoading || recording} fullscreen />
            <Layout className={'wrapper-padding'}>
                <Layout>
                    <div className="font-bold w-fit flex-item-center  font-14px">
                        <div className={'mr-20px'}>任务 ID：{selectedTask?.id}</div>
                        <div className="mr-20px">任务名称：{selectedTask?.name}</div>
                        <div className="font-bold mr-20px">任务描述: {selectedTask?.description}</div>
                    </div>
                    <Divider />
                    <Content>
                        <div className="content-wrapper">
                            <Flex style={{ width: '100%' }}>
                                <Card title="内嵌浏览器 / 图文渲染区域" style={{ minHeight: 300, flex: 1 }}>
                                    <div className="browser-area">内嵌浏览器 / 图文渲染区域</div>
                                </Card>
                                <div style={{ width: '20px' }}></div>
                                <Card title="用自然语言描述你的指令"
                                      style={{ minHeight: 150, flex: 1 }}>
                                    <TextArea onChange={inputChange} placeholder={'请描述你的需求'} rows={4} />
                                    <div className={'mt-20px'}>
                                        <Button type="default" className="mr-10px"
                                                onClick={startOptimize}>优化</Button>
                                        <Button type="default" className="mr-10px" onClick={startRunSpec}>测试</Button>
                                        <Button type="default" className="mr-10px">发布</Button>
                                    </div>
                                    <div className={'mt-20px'}>
                                        <Button type="default" className="mr-10px" onClick={goInit}>初始化任务</Button>
                                        <Button type="default" className="mr-10px" onClick={goRecord}>开始录制</Button>
                                    </div>
                                </Card>
                            </Flex>
                            {getError()}
                            <Divider />
                            <Card title={
                                <div className={'flex-space-between'}>
                                   <div>
                                       数据区域
                                   </div>
                                    <div className={'cursor-pointer'} onClick={refreshData}>
                                        <ReloadOutlined />
                                    </div>
                                </div>
                            } style={{ minHeight: 100 }}>
                                <div>
                                    <Table scroll={{ x: 1300 }} pagination={{ pageSize: 3 }} dataSource={getTableData()}
                                           columns={getTableStruct()} />
                                </div>
                            </Card>
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </Layout>
    );
};

export default RunPage;
