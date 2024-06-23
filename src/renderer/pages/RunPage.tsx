import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Divider,Image, Flex, Input, Layout, Modal, Spin, Table, Tooltip } from 'antd';
import Header from '../Component/Header';
import { TopContext } from '../TopProvider';
import { STATIC_FILE_SERVE_PORT, TaskStatus } from '../../../constants';
import { ReloadOutlined } from '@ant-design/icons';
import ErrorBoundary from 'antd/lib/alert/ErrorBoundary';

const { TextArea } = Input;
const { Header: AntHeader, Content, Sider, Footer } = Layout;

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
        resetError,
        resetResult
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
                    ellipsis: true,
                    render: (text: string) => commonRender(text)
                };
            });
        }

        return [];

    };

    const commonRender = (text: any) => {
        if (typeof text === 'string') {
            // Check if the string is a URL of an image
            if (text.match(/\.(jpeg|jpg|gif|png)$/) != null) {
                const url = `http://localhost:${STATIC_FILE_SERVE_PORT}/${text}`
                return <Image
                    src={url}
                    style={{
                        maxWidth: '150px',
                        maxHeight: '150px'
                    }}
                    preview={{
                        mask: "点击预览",
                        onVisibleChange: (value) => { console.log(value); }
                    }}
                />;
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
        return <ErrorBoundary>
            <Tooltip placement="topLeft" title={JSON.stringify(text)}>
               <span style={{
                   whiteSpace: 'nowrap',
                   overflow: 'hidden',
                   textOverflow: 'ellipsis',
                   maxWidth: 150,
                   display: 'inline-block'
               }}>
                 {JSON.stringify(text)}
               </span>
            </Tooltip>
        </ErrorBoundary>;
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
        resetError();
        resetResult();
    }, []);

    const getError = function() {
        if (runStatus === TaskStatus.Error) {
            return <div className={'mt-20px'}>
                <Alert type={'error'} message={<div>
                   运行出错～～
                </div>}>
                </Alert>
                <Button className={'mt-20px'} onClick={startDebug}>一键调试错误</Button>
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
    };

    const goRecord = function() {
        handleStartRecorder();
    };

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
                    <div className={'mt-20px'}>
                        <Button type="default" className="mr-10px"
                                onClick={goRecord}>(1)人工演示</Button>
                        <Button type="default" className="mr-10px"
                                onClick={goInit}>(2)初始化任务</Button>
                    </div>
                    <Divider />
                    <Content>
                        <div className="content-wrapper">
                            <Flex style={{ width: '100%' }}>
                                {/*<Card title="内嵌浏览器 / 图文渲染区域" style={{ minHeight: 300, flex: 1 }}>*/}
                                {/*    <div className="browser-area">内嵌浏览器 / 图文渲染区域</div>*/}
                                {/*</Card>*/}
                                {/*<div style={{ width: '20px' }}></div>*/}
                                <Card title="请描述你的需求"
                                      style={{ minHeight: 150, flex: 1 }}>
                                    <TextArea onChange={inputChange} placeholder={'请描述你的需求'} rows={4} />
                                    <div className={'mt-20px'}>
                                        <div className={'flex-space-between'}>
                                            <div>
                                                <Button type="default" className="mr-10px"
                                                        onClick={startRunSpec}>(3)测试</Button>
                                                <Button type="default" className="mr-10px"
                                                        onClick={startOptimize}>(4)优化</Button>
                                            </div>
                                            <div>
                                                <Button type="default" className="mr-10px">(5)发布</Button>
                                            </div>
                                        </div>
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
                                  <ErrorBoundary>
                                      <Table scroll={{ x: 1300 }} pagination={{ pageSize: 3 }} dataSource={getTableData()}
                                             columns={getTableStruct()} />
                                  </ErrorBoundary>
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
