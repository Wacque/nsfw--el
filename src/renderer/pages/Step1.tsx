import { Fragment, useContext, useEffect, useState } from 'react';
import Header from '../Component/Header';
import { TARGET_URL } from '../../../constants';
import { Button, Modal, Spin } from 'antd';
import { TopContext } from '../TopProvider';
import { useNavigate } from 'react-router-dom';

const AfterRecord = function() {
    const {recording, codegenResult, scriptInit, messageApi} = useContext(TopContext)
    const [onStarting, setOnStarting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const navigate = useNavigate();

    const next = async function() {
        try {
            setOnStarting(true)
            await scriptInit()
            setShowSuccessModal(true)
        } catch (e) {
            console.log('error', e)
            messageApi.error("出错了，请重试")
        } finally {
            setOnStarting(false)
        }
    }

    const handleOk = function() {
        setShowSuccessModal(false)
        navigate('/run')
    }

    const handleCancel = function() {
        setShowSuccessModal(false)
    }


    return <div>
        <div className={'font-song font-20px font-bold'}>
            - 人工演示完成 -
        </div>
        <Button onClick={next} className={'font-song font-20px font-bold'}>初始化任务</Button>
        <div className={'font-song font-20px'}>
            {codegenResult}
        </div>
        <Spin spinning={onStarting} fullscreen />
        <Modal title="Basic Modal" open={showSuccessModal} okText={'去测试'} onOk={handleOk} onCancel={handleCancel}>
            <div>
                初始化成功
            </div>
        </Modal>
    </div>

}

export default function Step1() {
    const {handleStartRecorder, recording, codegenResult, setCodegenResult} = useContext(TopContext)
    useEffect(() => {
        setCodegenResult("")
    }, []);
    return <div >
        <Header/>
        <div className={"wrapper-padding"}>
            <div className={'font-song font-20px font-bold'}>
               - 首先 -
            </div>
            <div className={"flex-center"}>
                {
                    codegenResult ? <AfterRecord/> : <Button disabled={recording} className={'font-song'} onClick={handleStartRecorder}>{recording ? "录制中.." : "开始向 AI 演示"}</Button>
                }
            </div>
        </div>
    </div>
}
