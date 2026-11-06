import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';   // ← 경로는 실제 위치에 맞게 조정하세요
import './MyPage.css';

import api from "./api";
import "./Sidebar.css";
import SidebarBackground from "./SidebarBackground";

const API_BASE = 'http://localhost:8080/api/v1';

// 책 객체에서 고유 키를 안전하게 뽑는 헬퍼
// bookId → id → title 순으로 fallback (bookId가 DTO에 생기면 자동으로 그걸 사용)
const getBookKey = (book) => book?.bookId ?? book?.id ?? book?.title ?? null;

const ProfilePage = () => {
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [books, setBooks] = useState([]);             // 내 책 전체 (READING + COMPLETED)
    const [recentBook, setRecentBook] = useState(null); // 최근 읽은 책 (GET /api/userbooks/recent)
    const [randomBooks, setRandomBooks] = useState([]); // 최근 방문 옆에 띄울 랜덤 4권
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

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

    // 책 상세 페이지 이동 (bookId 없으면 이동하지 않고 로그만 남김)
    const goToBookDetail = (book) => {
        const id = book?.bookId ?? book?.id;
        if (id == null) {
            console.error("bookId가 없어 상세 페이지로 이동할 수 없습니다. DTO에 bookId 추가 필요:", book);
            return;
        }
        navigate(`/bookshelf/${id}`);
    };

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setError('로그인이 필요합니다.');
                setIsLoading(false);
                return;
            }

            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = payload.userId;

            setIsLoading(true);
            try {
                const res = await axios.get(`${API_BASE}/user/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = res.data?.data ?? res.data;
                setProfile(data);

                const newAuth = res.headers['authorization'];
                if (newAuth) localStorage.setItem('accessToken', newAuth.split(' ')[1]);
            } catch (err) {
                console.error('프로필 로딩 실패:', err);
                setError('프로필 정보를 불러오는 데 실패했습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    // 최근 방문 섹션용: 내 책 목록 + 실제 최근 읽은 책(recent API) 조회
    useEffect(() => {
        const fetchUserBooks = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            try {
                const headers = { Authorization: `Bearer ${token}` };
                const [readingRes, completedRes] = await Promise.all([
                    axios.get(`http://localhost:8080/api/userbooks?status=READING`, { headers }),
                    axios.get(`http://localhost:8080/api/userbooks?status=COMPLETED`, { headers })
                ]);

                const readingList = Array.isArray(readingRes.data) ? readingRes.data : readingRes.data.data;
                const completedList = Array.isArray(completedRes.data) ? completedRes.data : completedRes.data.data;
                const all = [...(readingList || []), ...(completedList || [])];
                setBooks(all);

                // 최근 읽은 책: RoomBookChoice와 동일한 방식으로 언래핑
                let recent = null;
                try {
                    const recentRes = await axios.get(`http://localhost:8080/api/userbooks/recent`, { headers });
                    console.log("recent 응답:", recentRes.data); // ← 구조 확인 후 지우세요
                    recent = recentRes.data || null;   // ← 변수에 먼저 담고
                } catch (recentErr) {
                    console.warn("최근 읽은 책 조회 실패:", recentErr);
                }
                setRecentBook(recent);                 // ← state에 반영

                // 랜덤 4권: 최근 방문 책 제외
                const recentKey = getBookKey(recent);  // ← setter가 아니라 recent 변수를 넘김
                const rest = recentKey != null
                    ? all.filter((b) => getBookKey(b) !== recentKey)
                    : all;
                const shuffled = [...rest].sort(() => Math.random() - 0.5);
                setRandomBooks(shuffled.slice(0, 4));

            } catch (err) {
                console.error('책 목록 로딩 실패:', err);
                // 최근 방문 섹션만 비워두고 프로필은 그대로 표시
            }
        };

        fetchUserBooks();
    }, []);

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
                </section>

                {/* ===== 하단: 최근 방문 (실제 최근 읽은 책: /api/userbooks/recent) ===== */}
                <section className="profile-recent">
                    <div className="recent-header">최근 방문</div>

                    <div className="recent-body">
                        {!recentBook ? (
                            <div className="recent-empty">아직 방문한 책이 없어요.</div>
                        ) : (
                            <>
                                {/* 왼쪽: 최근 방문 책 (recent API 결과) */}
                                <div
                                    className="recent-feature"
                                    onClick={() => goToBookDetail(recentBook)}
                                >
                                    {/* DTO에 표지 필드가 없어 제목 기반 대체 표지 사용 */}
                                    <div className="recent-cover-fallback">{recentBook.title}</div>
                                </div>

                                <div className="recent-divider" />

                                {/* 오른쪽: 내 책 중 랜덤 4권 (최근 방문 책 제외) */}
                                <div className="recent-list">
                                    {randomBooks.map((book, i) => (
                                        <div
                                            key={getBookKey(book) ?? i}
                                            className="recent-item"
                                            onClick={() => goToBookDetail(book)}
                                        >
                                            <div className="recent-cover-fallback">{book.title}</div>
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