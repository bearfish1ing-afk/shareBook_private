import React, { useState } from 'react';
import axios from 'axios';

const HighlightTester = () => {
    // API 테스트에 필요한 입력값들 변수 관리
    const [roomBookId, setRoomBookId] = useState('1');
    const [roomId, setRoomId] = useState('1');
    const [highlightId, setHighlightId] = useState('1');
    
    // 등록용 더미 데이터
    const [cfi, setCfi] = useState('epubcfi(/6/4[chap-2]!/4/2/10/1:0)');
    const [content, setContent] = useState('이 책의 문장이 마음에 와닿았던 원인은 바로...');

    // API 통신 결과 콘솔 대용 화면 출력 State
    const [apiResult, setApiResult] = useState(null);

    // 공통 Axios 요청 빌더 (토큰 주입)
    const request = async (method, url, data = null) => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios({
                method,
                url: `http://localhost:8080/api/highlight${url}`,
                data,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            setApiResult({ status: response.status, data: response.data });
        } catch (error) {
            console.error(error);
            setApiResult({ 
                status: error.response?.status || 'ERROR', 
                data: error.response?.data || error.message 
            });
        }
    };

    return (
        <div style={{ padding: '30px', fontFamily: 'monospace', background: '#fafafa', minHeight: '100vh' }}>
            <h2>하이라이트 API 통합 검증 테스터</h2>
            <hr />

            {/* 변수 파라미터 입력 창고 */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', background: '#eee', padding: '15px', borderRadius: '8px' }}>
                <label>roomBookId: <input type="number" value={roomBookId} onChange={e => setRoomBookId(e.target.value)} style={{width: '60px'}} /></label>
                <label>roomId: <input type="number" value={roomId} onChange={e => setRoomId(e.target.value)} style={{width: '60px'}} /></label>
                {/* <label>highlightId: <input type="number" value={highlightId} onChange={e => setHighlightId(e.target.value)} style={{width: '60px'}} /></label> */}
            </div>

            {/* 1. 하이라이트 생성 섹션 */}
            <div style={{ background: '#fff', border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '8px' }}>
                <h4>[POST] 하이라이트 스크랩 등록</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                    <input type="text" value={cfi} onChange={e => setCfi(e.target.value)} placeholder="cfi 주소 입력" />
                    <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="스크랩 원문 문장 입력" rows="2" />
                </div>
                <button onClick={() => request('POST', '', { roomBookId: Number(roomBookId), cfi, content })} style={btnStyle('#4CAF50')}>
                    하이라이트 생성하기
                </button>
            </div>

            {/* 2. 조회 및 삭제 버튼 그룹 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                
                <div style={{ background: '#fff', border: '1px solid #ddd', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h4>[GET] 데이터 조회 기능</h4>
                    <button onClick={() => request('GET', `/${roomBookId}`)} style={btnStyle('#2196F3')}>
                        특정 룸북 전체 조회 (ForEpub)
                    </button>
                    <button onClick={() => request('GET', `/${roomBookId}/member`)} style={btnStyle('#2196F3')}>
                        룸북 내 "내 하이라이트" 조회 (ForEpub)
                    </button>
                    <button onClick={() => request('GET', '/users')} style={btnStyle('#9c27b0')}>
                        내 전체 스크랩 피드 조회 (ForUserScrap)
                    </button>
                    <button onClick={() => request('GET', `/${roomId}/latest`)} style={btnStyle('#ff9800')}>
                        독서방 메인 배너용 최신 스크랩 (ForRoomMain)
                    </button>
                </div>

                <div style={{ background: '#fff', border: '1px solid #ddd', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h4>[GET / DELETE] 집계 및 삭제</h4>
                    <button onClick={() => request('GET', '/userCount')} style={btnStyle('#009688')}>
                        내가 쓴 하이라이트 총 개수 카운트
                    </button>
                    <button onClick={() => request('DELETE', `/${highlightId}`)} style={btnStyle('#f44336')}>
                        특정 하이라이트 삭제하기 (Delete)
                    </button>
                </div>

            </div>

            {/* 3. 최종 결과 모니터링 창 */}
            <div style={{ background: '#333', color: '#fff', padding: '20px', borderRadius: '8px', boxShadow: 'inset 0 0 10px #000' }}>
                <h3 style={{ marginTop: 0, color: '#00ffcc' }}>
                    📡 API Response Monitor 
                    {apiResult && <span style={{ fontSize: '14px', color: '#fff', marginLeft: '15px' }}>(Status: {apiResult.status})</span>}
                </h3>
                <pre style={{ margin: 0, overflowX: 'auto', whiteSpace: 'pre-wrap', maxHeight: '300px', fontSize: '13px' }}>
                    {apiResult ? JSON.stringify(apiResult.data, null, 4) : "버튼을 누르면 스프링부트 결과가 여기에 찍힙니다."}
                </pre>
            </div>
        </div>
    );
};

// 단순 버튼 스타일 래퍼
const btnStyle = (color) => ({
    backgroundColor: color,
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
});

export default HighlightTester;