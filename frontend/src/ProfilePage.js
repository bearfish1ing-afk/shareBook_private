import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';   // ← 경로는 실제 위치에 맞게 조정하세요
import './MyPage.css';

import api from "./api";
import "./Sidebar.css";
import SidebarBackground from "./SidebarBackground";

// 표지 URL 유효성 검사 — "", null, "null", "undefined", 공백 문자열 모두 걸러냄
const isValidCover = (url) => {
    if (!url || typeof url !== 'string') return false;
    const t = url.trim();
    if (!t) return false;
    return !['null', 'undefined', 'none', 'n/a'].includes(t.toLowerCase());
};

const ProfilePage = () => {
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [books, setBooks] = useState([]);           // 내 책 전체 (READING + COMPLETED)
    const [randomBooks, setRandomBooks] = useState([]); // 최근 방문 옆에 띄울 랜덤 4권
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [failedCovers, setFailedCovers] = useState({}); // 이미지 로드 실패한 책 기록

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.warn("로그아웃 요청 실패, 로컬 정리는 계속 진행:", error);
        } finally {
            localStorage.removeItem('accessToken');
            navigate('/login');
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setError('로그인이 필요합니다.');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const res = await api.get('/api/v1/user/me');

                const data = res.data?.data ?? res.data;
                setProfile(data);
            } catch (err) {
                console.error('프로필 로딩 실패:', err);
                setError('프로필 정보를 불러오는 데 실패했습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    // 최근 방문 섹션용: 책장과 동일하게 백엔드에서 내 책 조회
    useEffect(() => {
        const fetchUserBooks = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            try {
                const [readingRes, completedRes] = await Promise.all([
                    api.get('/api/userbooks?status=READING'),
                    api.get('/api/userbooks?status=COMPLETED')
                ]);

                const readingList = Array.isArray(readingRes.data) ? readingRes.data : readingRes.data.data;
                const completedList = Array.isArray(completedRes.data) ? completedRes.data : completedRes.data.data;
                const all = [...(readingList || []), ...(completedList || [])];
                setBooks(all);

                // 최근 방문(읽는중 첫 책)을 제외한 나머지에서 랜덤 4권 뽑기
                const recent = all.find(b => b.status === 'READING') || all[0];
                const rest = all.filter(b => b !== recent);
                const shuffled = [...rest].sort(() => Math.random() - 0.5);
                setRandomBooks(shuffled.slice(0, 4));

            } catch (err) {
                console.error('책 목록 로딩 실패:', err);
                // 최근 방문 섹션만 비워두고 프로필은 그대로 표시
            }
        };

        fetchUserBooks();
    }, []);

    // 최근 방문: 책장과 동일하게 읽는중 책 중 첫 번째
    const recentBook = books.find(b => b.status === 'READING') || books[0];

    // 표지 렌더링 — 이미지가 있으면 이미지, 없거나 실패하면 대체 표지
    const renderCover = (book) => {
        const show = isValidCover(book.coverImageUrl) && !failedCovers[book.bookId];
        return show ? (
            <img
                src={book.coverImageUrl}
                alt={book.title}
                onError={() => setFailedCovers(p => ({ ...p, [book.bookId]: true }))}
            />
        ) : (
            <div className="recent-cover-fallback">{book.title}</div>
        );
    };

    // 사이드바를 항상 함께 렌더링하기 위한 래퍼
    const Layout = ({ children }) => (
        <div className="profile-layout">
            <Sidebar />
            <div className="profile-page">{children}</div>
        </div>
    );

    if (isLoading) return <Layout><div className="profile-loading">프로필을 불러오는 중...</div></Layout>;
    if (error) return <Layout><div className="profile-error">{error}</div></Layout>;
    if (!profile) return <Layout><div className="profile-error">프로필 정보가 없습니다.</div></Layout>;

    const {
        name = '이름없음',
        profileImage,
        hashtags = [],            // 백엔드 연결 전이면 빈 배열 → 미표시
        readingCount = 0,
        completedCount = 0,
        scrapCount = 0,
    } = profile;

    return (
        <Layout>
            <div className="profile-container">
                {/* ===== 상단 프로필 카드 ===== */}
                <section className="profile-hero-card">
                    {/* 각진 다크 배너 */}
                    <div className="profile-banner">
                        <h2 className="profile-greeting">
                            <span className="profile-greeting-name">{name}</span> 님, 즐거운 독서시간 보내고 계신가요?
                        </h2>
                        <button className="profile-edit-btn" onClick={() => navigate('/profile/edit')}>
                            ✏️ 프로필 수정
                        </button>
                        <button className="logout-button" onClick={handleLogout}>로그아웃</button>
                    </div>

                    <div className="profile-body">
                        {/* 왼쪽: 아바타 (+ 해시태그) */}
                        <div className="profile-left">
                            <div className="profile-avatar">
                                {profileImage ? (
                                    <img src={profileImage} alt={name} />
                                ) : (
                                    <div className="profile-avatar-placeholder">{name.charAt(0)}</div>
                                )}
                            </div>

                            {hashtags.length > 0 && (
                                <div className="profile-tags">
                                    {hashtags.map((tag, i) => (
                                        <span key={i} className="profile-tag">
                                            #{String(tag).replace(/^#/, '')}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 오른쪽: 통계 + 탭 */}
                        <div className="profile-right">
                            <ul className="profile-stats">
                                <li>
                                    <span className="stat-label">읽고있는 책</span>
                                    <span className="stat-value">{readingCount}</span>
                                    <span className="stat-unit">권</span>
                                </li>
                                <li>
                                    <span className="stat-label">완독한 책</span>
                                    <span className="stat-value">{completedCount}</span>
                                    <span className="stat-unit">권</span>
                                </li>
                                <li>
                                    <span className="stat-label">스크랩한 문장</span>
                                    <span className="stat-value">{scrapCount}</span>
                                    <span className="stat-unit">개</span>
                                </li>
                            </ul>

                            {/* 책장/스크랩 페이지로 이동 (설정 탭 제거) */}
                            <nav className="profile-tabs">
                                <button onClick={() => navigate('/bookshelf')}>책장</button>
                                <button onClick={() => navigate('/scrap')}>스크랩</button>
                            </nav>
                        </div>
                    </div>
                    <div className="color-fill"></div>
                </section>

                {/* ===== 하단: 최근 방문 (책장과 동일 데이터: /api/userbooks) ===== */}
                <section className="profile-recent">
                    <div className="recent-header">최근 방문</div>

                    <div className="recent-body">
                        {!recentBook ? (
                            <div className="recent-empty">아직 방문한 책이 없어요.</div>
                        ) : (
                            <>
                                {/* 왼쪽: 최근 방문 책 (읽는중 첫 책) */}
                                <div
                                    className="recent-feature"
                                    onClick={() => navigate(`/bookshelf/${recentBook.bookId}`)}
                                >
                                    {renderCover(recentBook)}
                                </div>

                                <div className="recent-divider" />

                                {/* 오른쪽: 내 책 중 랜덤 4권 */}
                                <div className="recent-list">
                                    {randomBooks.map((book) => (
                                        <div
                                            key={book.bookId}
                                            className="recent-item"
                                            onClick={() => navigate(`/bookshelf/${book.bookId}`)}
                                        >
                                            {renderCover(book)}
                                        </div>
                                    ))}
                                </div>

                                <button className="recent-more" onClick={() => navigate('/bookshelf')}>
                                    더보기
                                </button>
                            </>
                        )}
                    </div>
                </section>
            </div>
        </Layout>
    );
};

export default ProfilePage;