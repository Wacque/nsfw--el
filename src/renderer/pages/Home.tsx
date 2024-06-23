import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { TaskItem } from '../../../interface';
import { Card, Col, Row, Skeleton, Tag, Typography, Button, Space, Divider, Modal, Form, Input } from 'antd';
import '../styles/home.scss';
import { ArrowRightOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { TopContext } from '../TopProvider';
import FormItem from 'antd/es/form/FormItem';

const { Title, Paragraph } = Typography;

const TaskItemView = function({ item }: { item: TaskItem }) {
    const { setSelectedTask } = useContext(TopContext);
    const navigate = useNavigate();
    const getTag = function() {
        switch (item.status) {
            case 'error':
                return <Tag color="red">{item.status}</Tag>;
            case 'ready':
                return <Tag color="green">{item.status}</Tag>;
            case 'beta':
                return <Tag color="orange">{item.status}</Tag>;
            default:
                return <Tag color="blue">{item.status}</Tag>;
        }
    };

    const go = function(item: TaskItem) {
        setSelectedTask(item);
        // navigate('/step1')
        navigate('/run');
    };

    return (
        <Card
            title={
                <div className={'flex-space-between'}>
                    <div title={item.name} className={'overflow-ellipsis flex-space-between'} style={{width: "70%", whiteSpace: "nowrap"}}>{item.name}</div>
                    <span>{getTag()}</span>
                </div>
            }
            bordered={false}
            hoverable
            style={{ marginBottom: '24px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}
        >
            <Paragraph>ID: {item.id}</Paragraph>
            <Paragraph>{item.description}</Paragraph>
            <Divider />
            <div className={'flex-end'}>
                <Button type="primary" onClick={() => go(item)} icon={<ArrowRightOutlined />}>
                    去执行
                </Button>
            </div>
        </Card>
    );
};

export default function Home() {
    const { taskList, onLoadTask, loadTask, startCreateTask, messageApi } = useContext(TopContext);
    const [modalOpen, setModalOpen] = useState(false);
    const [form] = Form.useForm();
    //
    // useEffect(() => {
    //     onLoadTask();
    // }, [onLoadTask]);
    const newTask = function() {
        setModalOpen(true);
    };

    const handleOk = async function() {
        console.log(form.getFieldsValue());
        const { name, description } = form.getFieldsValue();
        await startCreateTask(name, description);
        messageApi.success('新增成功')
        setModalOpen(false)
        form.resetFields()
    };

    const handleCancel = function() {
        setModalOpen(false)
        form.resetFields()
    };

    return (
        <div style={{ height: '100vh', overflowY: 'scroll' }}>
            <Row className={'home'} gutter={[32, 32]} style={{ padding: '24px' }}>
                <Col span={24} style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <iframe className={'frame'} src="https://phoboslab.org/wipeout/" style={{
                        width: '100%',
                        height: '400px',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                    }} />
                    {/*<div className={'cover flex-center'}>*/}
                    {/*    <Title level={1} className={"name flex-center"} style={{ fontSize: '48px', margin: '24px 0' }}>*/}
                    {/*        明察*/}
                    {/*    </Title>*/}
                    {/*</div>*/}
                </Col>
                <Col span={24}>
                    <Title level={2} className={'font-bold mb-20px'} style={{ textAlign: 'center' }}>
                        任务列表
                        <div style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            margin: 'auto',
                            color: '#1677ff',
                            fontSize: '18px'
                        }}>
                            <PlusOutlined onClick={newTask} className={'mr-20px cursor-pointer'} />
                            <ReloadOutlined onClick={loadTask} className={'mr-20px cursor-pointer'} />
                        </div>
                    </Title>
                    <Divider />
                    <Row gutter={[32, 32]}>
                        {onLoadTask ? (
                            <Skeleton active paragraph={{ rows: 4 }} />
                        ) : (
                            taskList?.map((item) => (
                                <Col span={8} key={item.id}>
                                    <TaskItemView item={item} />
                                </Col>
                            ))
                        )}
                    </Row>
                </Col>
            </Row>
            <Modal title={<div>创建新任务</div>} open={modalOpen} cancelText={'取消'} okText={'确认'} onOk={handleOk}
                   onCancel={handleCancel}>
                <div style={{ height: '20px' }}></div>
                <Form form={form} labelCol={{ span: 4 }}>
                    <FormItem name={'name'} label={'任务名'}>
                        <Input />
                    </FormItem>
                    <FormItem name={'description'} label={'任务描述'}>
                        <Input />
                    </FormItem>
                </Form>
            </Modal>
        </div>
    );
}
