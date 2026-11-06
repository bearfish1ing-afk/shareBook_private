import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Sidebar from "./Sidebar.js";
import "./roomBookChoice.css";

function SearchIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <line
        x1="16.5"
        y1="16.5"
        x2="21"
        y2="21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BookGridItem({ book, onSelect }) {
  return (
    <div className="book-grid__item">
      <button type="button" className="book-grid__select" onClick={() => onSelect(book)}>
        <span className="book-grid__cover">
          {book.coverImageUrl ? (
            <img src={book.coverImageUrl} alt={book.title} />
          ) : (
            <span className="book-grid__cover-placeholder" aria-hidden="true" />
          )}
        </span>
        <span className="book-grid__meta">
          <span className="book-grid__title">{book.title}</span>
          <span className="book-grid__sub">
            {book.author}{book.publisher ? ` · ${book.publisher}` : ""}
          </span>
        </span>
      </button>
    </div>
  );
}

function SuggestionList({ loading, error, results, query, activeIndex, onSelect, onHoverIndex }) {
  if (loading) {
    return <p className="search-panel__status">검색 중...</p>;
  }
  if (error) {
    return <p className="search-panel__status search-panel__status--error">오류: {error}</p>;
  }
  if (results.length === 0) {
    return <p className="search-panel__status">'{query}'에 대한 검색 결과가 없습니다.</p>;
  }
  return (
    <ul className="suggestion-list" role="listbox">
      {results.map((book, i) => (
        <li key={book.isbn || i} role="presentation">
          <button
            type="button"
            role="option"
            aria-selected={i === activeIndex}
            className={`suggestion-list__item${i === activeIndex ? " is-active" : ""}`}
            onMouseEnter={() => onHoverIndex(i)}
            onClick={() => onSelect(book)}
          >
            {book.title}
          </button>
        </li>
      ))}
    </ul>
  );
}

function RoomBookChoice() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const [recentBook, setRecentBook] = useState(null);   // 최근 읽은 책 (GET /api/userbooks/recent)
  const [randomBooks, setRandomBooks] = useState([]);   // Book DB에서 랜덤 6권 (내 책 제외)

  const debounceRef = useRef(null);
  const navigate = useNavigate();
  const { roomId } = useParams();

  const showSuggestions = query.trim().length > 0;

  // 검색 결과가 바뀌면 자동완성 하이라이트를 첫 번째 항목으로 초기화
  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  // 최근 읽은 책 + Book DB 전체에서 랜덤 6권 조회 — 더미데이터 없음
  useEffect(() => {
    const fetchInitialBooks = async () => {
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };

      try {
        // 1) 내 책 (랜덤 목록에서 제외할 목록)
        const [readingRes, completedRes] = await Promise.all([
          axios.get(`http://localhost:8080/api/userbooks?status=READING`, { headers }),
          axios.get(`http://localhost:8080/api/userbooks?status=COMPLETED`, { headers }),
        ]);
        const readingList = Array.isArray(readingRes.data) ? readingRes.data : readingRes.data.data;
        const completedList = Array.isArray(completedRes.data) ? completedRes.data : completedRes.data.data;
        const myBooks = [...(readingList || []), ...(completedList || [])];

        // 최근 방문: 실제 최근 읽은 책 API 사용 (lastReadAt 기준)
        try {
          const recentRes = await axios.get(`http://localhost:8080/api/userbooks/recent`, { headers });
          setRecentBook(recentRes.data || null);
        } catch (recentErr) {
          // 최근 읽은 책이 없으면(404/500 등) 카드 숨김
          console.warn("최근 읽은 책 조회 실패:", recentErr);
          setRecentBook(null);
        }

        // 2) Book DB 전체 목록 (BookController: GET /api/v1/books)
        const booksRes = await axios.get(`http://localhost:8080/api/v1/books`, { headers });
        const allBooks = Array.isArray(booksRes.data) ? booksRes.data : booksRes.data.data;

        // 내가 읽는중/읽은 책은 제외하고 랜덤 6권
        // (BookResponseDTO에 bookId가 없어 제목으로 비교 — bookId 추가되면 id 비교로 교체)
        const myTitles = new Set(myBooks.map((b) => b.title));
        const candidates = (allBooks || []).filter((b) => !myTitles.has(b.title));
        const shuffled = [...candidates].sort(() => Math.random() - 0.5);
        setRandomBooks(shuffled.slice(0, 6));
      } catch (err) {
        console.error("책 목록 로딩 실패:", err);
      }
    };

    fetchInitialBooks();
  }, []);

  // 검색: Book DB의 제목 검색 API 사용 (GET /api/v1/books/title?keyword=)
  // ※ /search는 현재 빈 리스트를 반환하도록 되어 있어 실제 동작하는 /title 사용
  const fetchBooks = async (value) => {
    if (!value.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8080/api/v1/books/title?keyword=${encodeURIComponent(value)}`
      );
      if (!res.ok) throw new Error("검색 실패");
      const data = await res.json();
      setResults(Array.isArray(data) ? data : data.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchBooks(val), 300);
  };

  const clearQuery = () => {
    clearTimeout(debounceRef.current);
    setQuery("");
    setResults([]);
    setError(null);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const book = results[activeIndex];
      if (book) handleSelect(book);
    } else if (e.key === "Escape") {
      clearQuery();
    }
  };

  // 선택한 책을 독서방에 추가
  // ※ BookResponseDTO에 bookId가 있어야 함 — 없으면 백엔드 DTO에 추가 필요
  const handleSelect = async (book) => {
    const bookId = book.bookId ?? book.id;
    if (bookId == null) {
      console.error("bookId가 없어 책을 추가할 수 없습니다. BookResponseDTO에 bookId를 추가하세요.", book);
      alert("책 정보에 ID가 없어 추가할 수 없습니다.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`http://localhost:8080/api/v1/rooms/${roomId}/books`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookId }),
      });

      if (!res.ok) {
        throw new Error("책 추가 실패");
      }

      alert("독서방에 책이 추가되었습니다.");

      // 책 선택 후 방 페이지로 이동
      navigate(`/room/${roomId}`);
    } catch (err) {
      console.error(err);
      alert("책 추가 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="page-backdrop">

      {/* 기존 공용 사이드바 */}
      <Sidebar />

      <div className="room-book-choice">

        {/* 검색바 + 닫기 (이미지 레이아웃) */}
        <div className="search-row">
          <div className="search-bar">
            <SearchIcon className="search-bar__icon" />
            <input
              className="search-bar__input"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="검색"
            />
            {query && (
              <button
                type="button"
                className="search-bar__clear"
                onClick={clearQuery}
                aria-label="검색어 지우기"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            className="overlay-close"
            onClick={() => navigate(-1)}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="search-panel">
          {showSuggestions ? (
            <SuggestionList
              loading={loading}
              error={error}
              results={results}
              query={query}
              activeIndex={activeIndex}
              onSelect={handleSelect}
              onHoverIndex={setActiveIndex}
            />
          ) : (
            <>
              {/* 최근 방문 — recent API 결과 사용, 책장(shelf)과 동일한 스타일의 카드 1개 */}
              {recentBook && (
                <section className="book-section">
                  <h3 className="book-section__title">최근 방문</h3>
                  <div
                    className="rbc-recent-card"
                    onClick={() => handleSelect(recentBook)}
                  >
                    {/* UserBookDTO에 표지 필드가 없어 제목 기반 대체 표지 */}
                    <div className="rbc-recent-cover">{recentBook.title}</div>
                    <div className="rbc-recent-info">
                      <div className="rbc-recent-top">
                        <div>
                          <div className="rbc-recent-title">{recentBook.title}</div>
                          <div className="rbc-recent-author">{recentBook.author}</div>
                        </div>
                        <span className={`rbc-badge ${recentBook.status === "COMPLETED" ? "done" : ""}`}>
                          {recentBook.status === "COMPLETED" ? "완독" : "읽는중"}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Book DB에서 랜덤 6권 (내가 읽는중/읽은 책 제외) */}
              <section className="book-section">
                <h3 className="book-section__title">이런 작품은 어때요?</h3>
                {randomBooks.length === 0 ? (
                  <p className="search-panel__status">추천할 책이 아직 없어요.</p>
                ) : (
                  <div className="book-grid">
                    {randomBooks.map((book, i) => (
                      <BookGridItem key={book.isbn || i} book={book} onSelect={handleSelect} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RoomBookChoice;