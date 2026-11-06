import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import axios from 'axios';
import Sidebar from './Sidebar.js';
import './BookDetail.css';

// LocalDateTime("2026-07-02T14:30:00") → "2026.07.02" 형식으로 변환
const formatDate = (dateTime) => {
    if (!dateTime) return '-';
    const d = new Date(dateTime);
    if (isNaN(d)) return '-';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd}`;
};

const BookDetail = () => {
    const { bookId } = useParams();
    const navigate = useNavigate();

    const [book, setBook] = useState(null);
    const [roomData, setRoomData] = useState(null); // 그룹명/인원 (roomId로 조회)
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBookDetail = async () => {
            const token = localStorage.getItem('accessToken');
            setIsLoading(true);

            try {
                const headers = { 'Authorization': `Bearer ${token}` };

                // 단건 조회 API가 없어 두 상태를 조회한 뒤 bookId로 찾음
                const [readingRes, completedRes] = await Promise.all([
                    axios.get(`http://localhost:8080/api/userbooks?status=READING`, { headers }),
                    axios.get(`http://localhost:8080/api/userbooks?status=COMPLETED`, { headers })
                ]);

                const readingList = Array.isArray(readingRes.data) ? readingRes.data : readingRes.data.data;
                const completedList = Array.isArray(completedRes.data) ? completedRes.data : completedRes.data.data;
                const allBooks = [...(readingList || []), ...(completedList || [])];

                const found = allBooks.find(b => String(b.bookId) === String(bookId));
                if (!found) {
                    setError("책을 찾을 수 없습니다.");
                    return;
                }
                setBook(found);

                // roomId가 있으면 방 정보(그룹명/인원) 조회
                if (found.roomId != null) {
                    try {
                        const roomRes = await axios.get(`http://localhost:8080/api/v1/rooms/${found.roomId}`, { headers });
                        if (roomRes.data.success) {
                            setRoomData(roomRes.data.data);
                        }
                    } catch (roomErr) {
                        console.error("방 정보 로딩 실패:", roomErr);
                        // 방 정보만 실패해도 책 상세는 그대로 보여줌
                    }
                }

            } catch (err) {
                console.error("책 상세 로딩 실패:", err);
                if (err.response && err.response.status === 401) {
                    navigate("/login");
                    return;
                }
                setError("책 정보를 불러오는 데 실패했습니다.");
            } finally {
                setIsLoading(false);
            }
        };

        if (bookId) fetchBookDetail();
    }, [bookId, navigate]);

    if (isLoading) return <div className="loading">책 정보를 불러오는 중...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!book) return <div className="error">정보가 없습니다.</div>;

    return (
        <div className="detail-page">

            {/* 기존 공용 사이드바 */}
            <Sidebar />

            <div className="detail-content">

                {/* 상단 탭 내비게이션 */}
                <header className="shelf-topbar">
                    <nav className="shelf-tabs">
                        <button className="shelf-tab" onClick={() => navigate("/myprofile")}>마이프로필</button>
                        <button className="shelf-tab active" onClick={() => navigate("/bookshelf")}>책장</button>
                        <button className="shelf-tab" onClick={() => navigate("/scrap")}>스크랩</button>
                    </nav>
                </header>

                <div className="detail-layout">

                    {/* 1. 왼쪽 표지 패널 */}
                    <div className="detail-cover-panel">
                        <button className="detail-back-btn" onClick={() => navigate(-1)}>‹</button>
                        {/* DTO에 표지 필드가 없어 제목 기반 대체 표지 사용 */}
                        <div className="detail-cover fallback">{book.title}</div>
                    </div>

                    {/* 2. 오른쪽 메인 콘텐츠 영역 */}
                    <div className="detail-main-content">

                        {/* 상단 제목 - 저자 */}
                        <div className="detail-header-section">
                            <h1 className="detail-title">{book.title}</h1>
                            <span className="detail-author">– {book.author}</span>
                        </div>

                        {/* 상태 + 시작일/완독일 바 (DTO의 startDate / endDate) */}
                        <div className="detail-status-bar">
                            <span className={`status-badge ${book.status === 'COMPLETED' ? 'done' : 'reading'}`}>
                                {book.status === 'COMPLETED' ? '완독' : '읽는중'}
                            </span>
                            <span className="date-box">{formatDate(book.startDate)}</span>
                            <span className="date-sep">–</span>
                            <span className="date-box">{formatDate(book.endDate)}</span>
                        </div>

                        {/* 그룹 정보 카드 (roomId가 있을 때만) */}
                        {book.roomId != null && (
                            <div className="detail-group-card">
                                <div className="group-row">
                                    <span className="group-label">그룹명:</span>
                                    <span className="group-value">{roomData?.name || '-'}</span>
                                </div>
                                <div className="group-row">
                                    <span className="group-label">인원:</span>
                                    <span className="group-value">
                                        {roomData?.memberInfo ? `${roomData.memberInfo.length}명` : '-'}
                                    </span>
                                </div>
                                <div className="group-row">
                                    <span className="group-label">나의 컬러:</span>
                                    <span className="my-color-dot"></span>
                                </div>
                            </div>
                        )}

                        {/* 리뷰 카드 (리뷰 API가 아직 없어 빈 상태 표시) */}
                        <div className="detail-review-card">
                            <p className="review-empty">등록된 리뷰가 없습니다</p>
                            <button className="review-write-btn">리뷰 적으러가기</button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookDetail;