import { Fragment, useEffect, useState } from 'react';
import { getTaskList } from './api';
import { TaskItem } from '../../interface';
import { Card, Col, Row, Skeleton, Space } from 'antd';

const TaskItemView = function({ item }: { item: TaskItem }) {
    return <Card title={item.name}  style={{ width: 300 }}>
        <p>ID: {item.id}</p>
        <p>{item.description}</p>
        <p>{item.status}</p>
    </Card>;

};

export default function Home() {
    const [taskList, setTaskList] = useState<TaskItem[]>();
    const [onLoading, setOnLoading] = useState<boolean>(true);

    useEffect(() => {
        init();
    }, []);

    const init = function() {
        getTaskList().then((res) => {
            console.log(res.data)
            setTaskList(res.data);
        }).finally(() => {
            setOnLoading(false);
        })
    };

    if(onLoading) {
        return <Skeleton />;
    }

    return <Row>
        <Col className={'bg-red-400'} span={16}>
        hello
        </Col>
        <Col span={8}>
            <div>
                <Row gutter={[16, 16]}>
                    {
                        ...(taskList?.map((item) => <Col><TaskItemView item={item} /></Col>) ?? [])
                    }
                </Row>
            </div>
        </Col>
    </Row>
}
