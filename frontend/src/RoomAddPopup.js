import React, { useState } from "react";
import { createPortal } from 'react-dom';
import { useNavigate } from "react-router-dom";
import './RoomAddPopup.css'
import CreateRoom from "./CreateRoom";
import JoinRoom from "./JoinRoom";
import JoinColorRoom from "./JoinColorRoom";

const RoomAddPopup = ({isOpen, onClose}) => {
    const [step, setStep] = useState('choice');
    const [roomData, setRoomData] = useState(null);
    const navigate = useNavigate();
    const handleNextStep = (data) => {
        setRoomData(data); // 검색된 방 정보 저장
        setStep('color-pick');
    };

    const closeHandler= () => {
        onClose();
        setStep('choice');
    };

    if (!isOpen) return null;
    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            {/* 내부 컨텐츠 클릭 시 팝업이 안 닫히도록 */}
            {(step==='choice') &&
                <div className="modal-content-2btn" onClick={(e) => e.stopPropagation()}>
                    {/* 우측 상단 닫기(X) 버튼 */}
                    <button className="modal-close-x" onClick={closeHandler}>✕</button>
                    
                    {/* 팝업 본문 버튼 */}
                    {step === 'choice' && (
                        <div className="modal-button-group">
                            <button className="modal-btn create-btn" onClick={()=> setStep('create')}>
                                방 만들기
                            </button>
                            <button className="modal-btn join-btn" onClick={() => setStep('join')}>
                                방 참여하기
                            </button>
                        </div>
                    )}
                </div>
            }

            {(step!=='choice') && (
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    {/* 우측 상단 닫기(X) 버튼 */}
                    <button className="modal-close-x" onClick={closeHandler}>✕</button>
                    {/* 상단 슬라이드 메뉴(세그멘티 컨트롤)*/}
                    <div className="segmented-control">
                        <label className="segment-option">
                            <input type="radio" name="segment" checked={step === 'create'} onChange={() => setStep('create')}/>
                            <div className="segment-text">방 만들기</div>
                        </label>

                        <label className="segment-option">
                            <input type="radio" name="segment" checked={step === 'join'} onChange={() => setStep('join')}/>
                            <div className="segment-text">방 참여하기</div>
                        </label>

                        <div
                            className="segment-active-indicator"
                            style={{
                                transform: `translateX(${step === 'create' ? 0 : 100}%)`,
                            }}
                        />
                    </div>
                    
                    {step === 'create' && (
                        <CreateRoom />
                    )}

                    {step === 'join' && (
                        <JoinRoom onNext={handleNextStep}/>
                    )}

                    {step === 'color-pick' && (
                        <JoinColorRoom roomData={roomData} onBack={()=>setStep('join')} />
                    )}
                </div>
            )}
        </div>,
        document.body
    );
};

export default RoomAddPopup;