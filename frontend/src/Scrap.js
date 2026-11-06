import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import Sidebar from './Sidebar.js';
import './Scrap.css';

// 하이라이트 형광펜 색상 팔레트
const HIGHLIGHT_COLORS = ['pink', 'yellow', 'green', 'purple'];
const colorOf = (highlightId) => HIGHLIGHT_COLORS[(highlightId || 0) % HIGHLIGHT_COLORS.length];

const Scrap = () => {
    const navigate = useNavigate();

    const [highlights, setHighlights] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMyHighlights = async () => {
            const token = localStorage.getItem('accessToken');
            setIsLoading(true);

            try {
                const res = await axios.get(`http://localhost:8080/api/highlight/users`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const list = Array.isArray(res.data) ? res.data : res.data.data;

                // 최신 스크랩순 정렬
                const sorted = (list || []).sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                );
                setHighlights(sorted);

            } catch (err) {
                console.error("스크랩 로딩 실패:", err);
                if (err.response && err.response.status === 401) {
                    navigate("/login");
                    return;
                }
                setError("스크랩을 불러오는 데 실패했습니다.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchMyHighlights();
    }, [navigate]);

    const handleDelete = async (highlightId) => {
        if (!window.confirm("이 스크랩을 삭제할까요?")) return;

        const token = localStorage.getItem('accessToken');
        try {
            await axios.delete(`http://localhost:8080/api/highlight/${highlightId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setHighlights(prev => prev.filter(h => h.highlightId !== highlightId));
        } catch (err) {
            console.error("스크랩 삭제 실패:", err);
            if (err.response && err.response.status === 401) {
                return;
            }
            alert("스크랩 삭제에 실패했습니다.");
        }
    };

    if (isLoading) return <div className="loading">스크랩을 불러오는 중...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="scrap-page">

            {/* 공용 사이드바 */}
            <Sidebar />

            <div className="scrap-content">

                {/* 상단 탭 내비게이션 (설정을 제외한 3단 탭 구조) */}
                <header className="shelf-topbar">
                    <nav className="shelf-tabs">
                        <button className="shelf-tab" onClick={() => navigate("/myprofile")}>마이프로필</button>
                        <button className="shelf-tab" onClick={() => navigate("/bookshelf")}>책장</button>
                        <button className="shelf-tab active">스크랩</button>
                    </nav>
                </header>

                {/* 메인 패널 (CSS 설정을 통해 내부 스크롤 작동) */}
                <main className="scrap-panel">

                    {highlights.length === 0 ? (
                        <div className="scrap-empty">
                            <p className="empty-title">아직 스크랩이 없어요</p>
                            <p>책을 읽다가 하이라이트하면 여기에 모여요.</p>
                        </div>
                    ) : (
                        <div className="scrap-grid">
                            {highlights.map(h => (
                                <article key={h.highlightId} className="scrap-card">

                                    {/* 헤더: '도서명 - 작가' */}
                                    <div className="scrap-card-head">
                                        <div className="scrap-card-meta">
                                            <span className="scrap-book-title">{h.bookTitle}</span>
                                            {h.author && <span className="scrap-author"> - {h.author}</span>}
                                        </div>
                                        <button
                                            className="scrap-delete-btn"
                                            onClick={() => handleDelete(h.highlightId)}
                                            aria-label="스크랩 삭제"
                                            title="삭제"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {/* 하이라이트 본문 */}
                                    <div className={`scrap-quote tone-${colorOf(h.highlightId)}`}>
                                        {h.content}
                                    </div>

                                </article>
                            ))}
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
};

export default Scrap;