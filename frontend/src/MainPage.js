import React, { useState, useEffect, useRef} from "react";
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import './MainPage.css';
import Sidebar from './Sidebar.js';
import { TwitterPicker } from "react-color"
//import MyRoom from "./MyRoom";
import RoomAddPopup from "./RoomAddPopup.js";

import api from './api';

// 표지 URL 유효성 검사 — "", null, "null", "undefined", 공백 문자열 모두 걸러냄
const isValidCover = (url) => {
    if (!url || typeof url !== 'string') return false;
    const t = url.trim();
    if (!t) return false;
    return !['null', 'undefined', 'none', 'n/a'].includes(t.toLowerCase());
};

const MainPage = () => {
    const navigate = useNavigate();
    const [readingBooks, setReadingBooks] = useState([]);
    const [myRooms, setMyRooms] = useState([]);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [failedCovers, setFailedCovers] = useState({}); // 이미지 로드 실패한 책 기록

    const token = localStorage.getItem("accessToken");
    const [scrollTop, setScrollTop] = useState(0);

    useEffect(() => {
        // ★ 브라우저 창 전체의 스크롤을 감지하는 함수
        const handleWindowScroll = () => {
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
            setScrollTop(currentScroll);
        };
        window.addEventListener("scroll", handleWindowScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleWindowScroll);
    }, []);

    //애니메이션
    const hintOpacity = Math.max(0, 1 - scrollTop / 80);
    const progress = Math.min(1, scrollTop / 100);
    const YPosition = -160*progress;

    // API 중복 호출을 막기 위한 안전장치
    const isFetching = useRef(false);
    const hasFetched = useRef(false);

    useEffect(() => {
        const fetchData = async () => {
            if (isFetching.current || hasFetched.current) {
                return;
            }

            isFetching.current = true;

            // 1. 읽고 있는 책 목록 요청
            try {
                console.log("[API 요청 1] 책 목록 호출 시작...");
                const bookRes = await api.get(`/api/userbooks?status=READING`);
                console.log("[API 완료] 책 목록 데이터:", bookRes.data);
                setReadingBooks(bookRes.data || []);
            } catch (err) {
                console.error("[API 에러] 책 목록 로딩 실패:", err);
                setReadingBooks([]);
            }

            // 2. 내 방 목록 요청
            try {
                console.log("[API 요청 2] 내 방 목록 호출 시작...");
                const roomRes = await api.get('/api/v1/rooms/my');
                console.log("[API 완료] 내 방 목록 데이터:", roomRes.data);
                if (roomRes.data && roomRes.data.success) {
                    setMyRooms(roomRes.data.data || []);
                } else {
                    setMyRooms([]);
                }
                hasFetched.current = true;
            } catch (err) {
                console.error("[API 에러] 방 목록 로딩 실패:", err);
                setMyRooms([]);
            } finally {
                isFetching.current = false;
            }
        };

        fetchData();
    }, []);

    // 표지 렌더링 — 이미지가 있으면 이미지, 없거나 로드 실패하면 제목 기반 대체 표지
    const renderCover = (item) => {
        const show = isValidCover(item.coverImageUrl) && !failedCovers[item.bookId];
        return show ? (
            <img
                src={item.coverImageUrl}
                alt={item.title}
                className="book-cover"
                onError={() => setFailedCovers(p => ({ ...p, [item.bookId]: true }))}
            />
        ) : (
            <div className="book-cover book-cover-fallback">{item.title}</div>
        );
    };

    return (
        <div className="main-container">
            <header className="topbar"></header>
            <Sidebar />
            <main className="main-content">
                {/* 내 방 섹션 */}
                <section className="horizontal-section">
                    <div className="main-room-header">
                        <h3>나의 교환독서방</h3>
                    </div>
                    <div className="card-list">
                        {myRooms.map((room,index) => (
                            <div key={`room-${room.roomId}-${index}`} className="room-item" onClick={() => navigate(`/room/${room.roomId}`)}>
                                <div className="room-border">
                                    <img className="room-img" src="./exampleRoom1.png" alt="room"/>
                                </div>
                                <p className="room-name">{room.name}</p>
                            </div>
                        ))}
                        <div className="room-item" onClick={()=>setIsPopupOpen(true)}>
                            <div className="room-border">
                                <img className="room-img" src="/room-add-button.png" alt="room-add"/>
                                <div className="room-hover-overlay"></div>

                                <RoomAddPopup
                                    isOpen={isPopupOpen}
                                    onClose={()=>setIsPopupOpen(false)}
                                />

                            </div>
                        </div>
                        {myRooms.length === 0 && <p className="empty">아직 방이 없습니다.</p>}
                    </div>
                </section>

                {/* 힌트 문구 */}
                <div
                    className="scroll-hint-text"
                    style={{ opacity: hintOpacity }}
                >
                    my books ↓
                </div>

                {/* 읽고 있는 책 섹션 */}
                <section
                    className="horizontal-section-book animate-section"
                    style={{ transform: `translateY(${YPosition}px)` }}
                >
                    <div className="ReadingSectionBox">
                        <h3>나의 책</h3>
                    </div>
                    <div className="card-list-book">
                        {readingBooks.map((item, index) => {
                            const matchingRoom = myRooms.find(room => room.roomId === item.roomId);

                            return (
                                <div key={`book-${item.bookId}-${index}`} className="book-card">
                                    {item ? (
                                        <>
                                            {renderCover(item)}
                                            <div className="bookcard-right">
                                                <p className="book-title-text">{item.title}</p>
                                                <p className="book-author-text">{item.author || "임시 작가"} </p>
                                                <div className="bookcard-line"/>
                                                <p className="room-tag">
                                                    {matchingRoom ? matchingRoom.name : "로딩 중..."}
                                                </p>
                                            </div>
                                            <div className="book-hover-overlay">
                                                <button className="book-hover-button">
                                                    <div className="book-hover-box">read</div>
                                                </button>
                                                <button className="book-hover-button">
                                                    <div className="book-hover-box">memo</div>
                                                </button>
                                                <button className="book-hover-button">
                                                    <div className="book-hover-box">review</div>
                                                </button>
                                            </div>
                                        </>

                                    ) : (
                                        <p>책 정보를 불러올 수 없습니다.</p>
                                    )}

                                </div>
                            );
                        })}
                        {readingBooks.length === 0 && <p className="empty">읽고 있는 책이 없습니다.</p>}
                    </div>
                </section>
            </main>
        </div>
    );
}
export default MainPage;