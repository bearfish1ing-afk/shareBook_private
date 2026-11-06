import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import Sidebar from './Sidebar.js';
import './BookShelf.css';

// 초성 계산용 상수
const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const CHO_MERGED = { "ㄲ":"ㄱ", "ㄸ":"ㄷ", "ㅃ":"ㅂ", "ㅆ":"ㅅ", "ㅉ":"ㅈ" };
const CHO_ORDER = ["ㄱ","ㄴ","ㄷ","ㄹ","ㅁ","ㅂ","ㅅ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ","A-Z","#"];

// 제목 첫 글자의 초성 구하기
const getInitial = (title) => {
    const ch = (title || "").trim().charAt(0);
    if (!ch) return "#";
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
        const cho = CHO[Math.floor((code - 0xac00) / 588)];
        return CHO_MERGED[cho] || cho;
    }
    if (/[a-z]/i.test(ch)) return "A-Z";
    return "#";
};

// 표지 URL 유효성 검사 — "", null, "null", "undefined", 공백 문자열 모두 걸러냄
const isValidCover = (url) => {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();
    if (!trimmed) return false;
    if (["null", "undefined", "none", "N/A"].includes(trimmed.toLowerCase())) return false;
    return true;
};

// 표지 컴포넌트 — 이미지 로드 실패 시 자동으로 대체 표지로 전환
const BookCover = ({ url, title }) => {
    const [failed, setFailed] = useState(false);

    // url이 바뀌면 실패 상태 초기화
    useEffect(() => {
        setFailed(false);
    }, [url]);

    const showImage = isValidCover(url) && !failed;

    return (
        <div className={`book-cover ${!showImage ? "fallback" : ""}`}>
            {showImage ? (
                <img
                    src={url}
                    alt={title}
                    onError={() => setFailed(true)}
                />
            ) : (
                <>
                    <span className="fallback-book-title">{title}</span>
                </>
            )}
        </div>
    );
};

const BookShelf = () => {
    const navigate = useNavigate();

    const [books, setBooks] = useState([]); // 백엔드에서 받은 전체 책 (READING + SUSPENDED + COMPLETED)
    const [recentBook, setRecentBook] = useState(null); // 최근 읽은 책 (GET /api/userbooks/recent)
    const [recentRoom, setRecentRoom] = useState(null); // 최근 방문 책의 방 정보 (그룹명/인원)
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserBooks = async () => {
            const token = localStorage.getItem('accessToken');
            setIsLoading(true);

            try {
                const headers = { 'Authorization': `Bearer ${token}` };

                // READING, SUSPENDED, COMPLETED 조회
                const [readingRes, suspendedRes, completedRes] = await Promise.all([
                    axios.get("http://localhost:8080/api/userbooks?status=READING", { headers }),
                    axios.get("http://localhost:8080/api/userbooks?status=SUSPENDED", { headers }),
                    axios.get("http://localhost:8080/api/userbooks?status=COMPLETED", { headers }),
                ]);

                const readingList = Array.isArray(readingRes.data)
                    ? readingRes.data
                    : readingRes.data.data;

                const suspendedList = Array.isArray(suspendedRes.data)
                    ? suspendedRes.data
                    : suspendedRes.data.data;

                const completedList = Array.isArray(completedRes.data)
                    ? completedRes.data
                    : completedRes.data.data;

                setBooks([
                    ...(readingList || []),
                    ...(suspendedList || []),
                    ...(completedList || []),
                ]);

                // 최근 방문: 실제 최근 읽은 책 API 사용 (lastReadAt 기준)
                try {
                    const recentRes = await axios.get(`http://localhost:8080/api/userbooks/recent`, { headers });
                    setRecentBook(recentRes.data || null);
                } catch (recentErr) {
                    // 최근 읽은 책이 없으면(404/500 등) 카드 숨김 — 책장은 그대로 보여줌
                    console.warn("최근 읽은 책 조회 실패:", recentErr);
                    setRecentBook(null);
                }

            } catch (err) {
                console.error("책장 로딩 실패:", err);
                if (err.response && err.response.status === 401) {
                    navigate("/login");
                    return;
                }
                setError("책장을 불러오는 데 실패했습니다.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserBooks();
    }, [navigate]);

    // 최근 방문 책의 방 정보(그룹명/인원) 조회
    useEffect(() => {
        if (!recentBook || recentBook.roomId == null) return;

        const fetchRecentRoom = async () => {
            const token = localStorage.getItem('accessToken');
            try {
                const roomRes = await axios.get(`http://localhost:8080/api/v1/rooms/${recentBook.roomId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (roomRes.data.success) {
                    setRecentRoom(roomRes.data.data);
                }
            } catch (roomErr) {
                console.error("방 정보 로딩 실패:", roomErr);
            }
        };

        fetchRecentRoom();
    }, [recentBook]);

    // 초성별 그룹핑
    const grouped = CHO_ORDER
        .map(key => ({
            key,
            list: books
                .filter(b => getInitial(b.title) === key)
                .sort((a, b) => (a.title || "").localeCompare(b.title || "", "ko"))
        }))
        .filter(g => g.list.length > 0);

    const scrollToGroup = (key) => {
        const el = document.getElementById(`group-${key}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    if (isLoading) return <div className="loading">책장을 불러오는 중...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="shelf-page">

            <Sidebar />

            <div className="shelf-content">

                {/* 상단 탭 내비게이션 */}
                <header className="shelf-topbar">
                    <nav className="shelf-tabs">
                        <button className="shelf-tab" onClick={() => navigate("/myprofile")}>마이프로필</button>
                        <button className="shelf-tab active">책장</button>
                        <button className="shelf-tab" onClick={() => navigate("/scrap")}>스크랩</button>
                    </nav>
                </header>

                <div className="shelf-layout">

                    {/* 초성 인덱스 레일 */}
                    <nav className="index-rail">
                        {grouped.map(g => (
                            <button
                                key={g.key}
                                className="index-item"
                                onClick={() => scrollToGroup(g.key)}
                            >
                                <span className="tick"></span>
                                <span className="label">{g.key}</span>
                            </button>
                        ))}
                    </nav>

                    {/* 메인 패널 */}
                    <main className="shelf-panel">

                        {books.length === 0 ? (
                            <div className="shelf-empty">
                                <p className="empty-title">아직 책장이 비어 있어요</p>
                                <p>책을 추가하면 여기에 초성별로 정리돼요.</p>
                            </div>
                        ) : (
                            <>
                                {/* 최근 방문 카드 */}
                                {recentBook && (
                                    <>
                                        <p className="section-title">최근 방문</p>
                                        <div
                                            className="recent-card"
                                            onClick={() => navigate(`/bookshelf/${recentBook.bookId}`)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <BookCover
                                                url={recentBook.coverImageUrl}
                                                title={recentBook.title}
                                            />
                                            <div className="recent-info">
                                                <div className="recent-info-top">
                                                    <div>
                                                        <div className="book-title">{recentBook.title}</div>
                                                        <div className="book-author">{recentBook.author}</div>
                                                    </div>
                                                    <span
                                                        className={`status-badge ${
                                                            recentBook.status === "COMPLETED"
                                                                ? "done"
                                                                : recentBook.status === "SUSPENDED"
                                                                ? "suspended"
                                                                : "reading"
                                                        }`}
                                                    >
                                                        {recentBook.status === "COMPLETED"
                                                            ? "완독"
                                                            : recentBook.status === "SUSPENDED"
                                                            ? "중단"
                                                            : "읽는중"}
                                                    </span>
                                                </div>

                                                {recentRoom && (
                                                    <div className="recent-info-bottom">
                                                        <span className="recent-room-name">{recentRoom.name}</span>
                                                        <span className="recent-member-count">
                                                            {recentRoom.memberInfo ? `${recentRoom.memberInfo.length}명` : ''}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <hr className="panel-divider" />
                                    </>
                                )}

                                {/* 초성별 책 그리드 */}
                                {grouped.map(g => (
                                    <section key={g.key}>
                                        <h2 className="group-heading" id={`group-${g.key}`}>{g.key}</h2>
                                        <div className="book-grid">
                                            {g.list.map(book => (
                                                <div
                                                    key={book.bookId}
                                                    className="book-card"
                                                    onClick={() => navigate(`/bookshelf/${book.bookId}`)}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <BookCover
                                                        url={book.coverImageUrl}
                                                        title={book.title}
                                                    />
                                                    <div className="book-meta">
                                                        <div className="book-title">{book.title}</div>
                                                        <div className="book-author">{book.author}</div>

                                                        {book.roomName && (
                                                            <div className="book-room-info">
                                                                <span className="book-room-name">{book.roomName}</span>
                                                                <span className="book-room-count">{book.memberCount}명</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            </>
                        )}

                    </main>
                </div>
            </div>
        </div>
    );
};

export default BookShelf;