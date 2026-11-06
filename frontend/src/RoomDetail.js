import React, { useState, useEffect, useRef} from "react";
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import { useNavigate, useParams } from "react-router-dom";
import axios from 'axios';
import './RoomDetail.css';
import Sidebar from './Sidebar.js';
import { TwitterPicker } from "react-color";
import api from './api.js';

{/*todo: 방 생성 기능 추가,
        UserBook 불러올 때 마지막 읽은 페이지, coverImage, 출판사 등이 안옴 지금*/}

const RoomDetail = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();

    const [roomData, setRoomData] = useState(null);
    const [books, setBooks] = useState([]);
    const [currentStatus, setCurrentStatus] = useState('READING'); // 상태 필터 추가
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRoomAllData = async () => {
            const token = localStorage.getItem('accessToken');
            const payload = JSON.parse(atob(token.split(".")[1]));
            setCurrentUserId(payload.userId);
            setIsLoading(true);

            try {
                // 1. 방 상세 정보 (기존과 동일)
                const roomRes = await axios.get(`http://localhost:8080/api/v1/rooms/${roomId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (roomRes.data.success) {
                    setRoomData(roomRes.data.data);

                    // 🔥 토큰 갱신 로직만 살짝 추가 (선택사항)
                    const newAuth = roomRes.headers['authorization'];
                    if (newAuth) localStorage.setItem('accessToken', newAuth.split(" ")[1]);
                }

                // 2. 책 목록 조회 (상태 필터 status 추가)
                // 명세: GET /api/v1/rooms/{roomId}/books?status={status}
                const bookRes = await axios.get(`http://localhost:8080/api/v1/rooms/${roomId}/books?status=${currentStatus}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                // 데이터가 success 객체에 감싸져 오는지, 배열로 바로 오는지 확인 후 세팅
                const bookList = Array.isArray(bookRes.data) ? bookRes.data : bookRes.data.data;
                setBooks(bookList || []);

            } catch (err) {
                console.error("데이터 로딩 실패:", err);
                setError("방 정보를 불러오는 데 실패했습니다.");
            } finally {
                setIsLoading(false);
            }
        };

        if (roomId) fetchRoomAllData();
    }, [roomId, currentStatus]); // 👈 currentStatus가 바뀔 때마다 다시 호출

    const deleteMember = async () => {
        const token = localStorage.getItem('accessToken');
        try {
            const response = await axios.delete(`http://localhost:8080/api/v1/rooms/${roomId}/leave`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            navigate("/");
        } catch (error) {
            console.error("에러", error);
        }
    };

    const deleteMemberAll = async (userId) => {
        const token = localStorage.getItem('accessToken');
        try {
            const response = await axios.delete(`http://localhost:8080/api/v1/rooms/${roomId}/leave`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );         
            setRoomData(prev=>({
                ...prev,
                memberInfo: prev.memberInfo.filter(
                    member=>member.userId!=userId//삭제할 userId를 제외한 나머지 보여주기
                )
            }));

            console.log("삭제 성공", response.data);
        } catch (error) {
            console.error("에러", error);
        }
    };
    if (isLoading) return <div className="loading">방 정보를 불러오는 중...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!roomData) return <div className="error">정보가 없습니다.</div>;

    return (
        <div className="room-detail-container">
            <header className="room-header">
                <button className="back-btn" onClick={() => navigate(`/`)}>←</button>
                <h1>{roomData.name}</h1>
                <span className="join-code">코드: {roomData.joinCode}</span>
                {roomData.ownerId !== currentUserId && (
                    <button type="button" onClick={deleteMember}>
                        나가기
                    </button>
                )}
                <button type="button" onClick={()=>navigate(`/room/${roomId}/color`)}>색깔 변경</button>
            </header>

            <main className="room-main-content">
                <section className="detail-section">
                    <div className="section-title">
                        {/* 탭 메뉴 UI */}
                        <div className="status-tabs">
                            <h3
                                className={currentStatus === 'READING' ? 'active-tab' : ''}
                                onClick={() => setCurrentStatus('READING')}
                                style={{ cursor: 'pointer', marginRight: '15px' }}
                            >📖 읽고 있는 책</h3>
                            <h3
                                className={currentStatus === 'COMPLETED' ? 'active-tab' : ''}
                                onClick={() => setCurrentStatus('COMPLETED')}
                                style={{ cursor: 'pointer' }}
                            >✅ 다 읽은 책</h3>
                        </div>
                        <button className="add-book-btn" onClick={() => navigate(`book-choice`)}>+</button>
                    </div>

                    <div className="book-scroll-container">
                        {books.length > 0 ? (
                            books.map(book => (
                                <div
                                    key={book.roomBookId}
                                    className="room-book-card"
                                    onClick={() => navigate(`/epub/${roomId}/${book.roomBookId}`)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <img src={book.coverImage} alt={book.title} className="detail-book-cover" />
                                    <div className="room-book-info">
                                        <h4>{book.title}</h4>
                                        <p>{book.author}</p>
                                        <span className="added-by">추가: {book.addedByName}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="empty-msg">아직 등록된 책이 없습니다.</p>
                        )}
                    </div>
                </section>

                <section className="detail-section">
                    <h3>👥 멤버 목록 ({roomData.memberInfo ? roomData.memberInfo.length : 0})</h3>
                    <div className="member-grid">
                        {roomData.memberInfo && roomData.memberInfo.map(member => (
                            <div key={member.userId} className="member-card">
                                <div className="member-pen" style={{ backgroundColor: member.penColor }}></div>
                                <span className="member-name">{member.nickname}</span>
                                {member.role === 'HOST' && <span className="host-tag">HOST</span>}
                                {currentUserId===roomData.ownerId && member.role!=='HOST' && (
                                    <button onClick={() => deleteMemberAll(member.userId)}>
                                        삭제
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* 섹션 3: 독후감 (현재 API 명세에는 없으므로 UI 뼈대만 유지) */}
                <section className="detail-section">
                    <h3>📝 독후감 기록</h3>
                    <div className="report-placeholder">
                        <p>준비 중인 기능입니다.</p>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default RoomDetail;