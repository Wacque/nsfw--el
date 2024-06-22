import { Link } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import React from 'react';
import { Divider } from 'antd';

export default function Header() {
    return <div className={'head'}>
        <Link className={'font-song text-black font-bold font-20px'} to={'..'}><ArrowLeftOutlined /> 返回</Link>
        <Divider/>
    </div>
}
