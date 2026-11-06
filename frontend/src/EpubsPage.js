import EpubViewer from "./EpubViewer";
import { useState, useEffect } from 'react';
import {useParams} from "react-router-dom";
import api from "./api";
import MemoSidebar from "./MemoSidebar";
import "./EpubPage.css";

const EPubsPage = () => {
    const {roomId, roomBookId}= useParams();

    const [memos, setMemos] = useState([]);
    const [highlights, setHighlights] = useState([]); // 스크랩(하이라이트) 목록
    const [rendition, setRendition] = useState(null); // EpubViewer의 rendition 객체를 공유받음
    const [sidebarOpen, setSidebarOpen] = useState(false); //나중에 수정할 예정. 임시로 넣은 사이드바 상태
    const [isLoading, setIsLoading] = useState(true);
    const [epubUrl, setEpubUrl] = useState("");

    const fetchMemos = async () => {
        if (!roomBookId){
            return;
        }
        try {
            const response = await api.get(`/api/memos/room-book/${roomBookId}`);
            setMemos(response.data);
        }
        catch (error) {
            console.error("메모 조회 실패: ", error);
        }
    }

    // 스크랩(하이라이트) 목록 조회
    const fetchHighlights = async () => {
        if (!roomBookId) return;

        try {
            const response = await api.get(`/api/highlight/${roomBookId}`);
            setHighlights(response.data);
        } catch (error) {
            console.error("스크랩 조회 실패:", error);
        }
    };

    // 2. 백엔드에서 S3 Presigned URL 가져오기
    const fetchEpubUrl = async () => {
        if (!roomId || !roomBookId) return;
        setIsLoading(true);
        try {
            const res = await api.get(`/api/v1/rooms/${roomId}/books/${roomBookId}`);
            setEpubUrl(res.data.epubUrl);
            console.log("백엔드 실제 응답 데이터:", res.data);

            // 최근 읽은 책 기록 (POST /api/userbooks/{bookId}/last-read)
            if (res.data.bookId) {
                api.post(`/api/userbooks/${res.data.bookId}/last-read`)
                    .catch((err) => console.error("최근 읽은 책 기록 실패:", err));
            } else {
                console.warn("응답에 bookId가 없어 최근 읽은 책 기록을 건너뜁니다. 백엔드 응답 DTO에 bookId 추가 필요.");
            }

        } catch (error) {
            console.error("EPUB URL 조회 실패:", error);
            // API 연동 예외 발생 시 로컬 에셋으로 임시 폴백 처리
            // setEpubUrl("/assets/fly.epub");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEpubUrl();
        fetchMemos();
        fetchHighlights();
    }, [roomId, roomBookId]);


    if (isLoading) return <div className="loading">책을 불러오는 중...</div>;
    if (!epubUrl) return <div className="error">책 주소를 찾을 수 없습니다.</div>;


    return (
        <div className="epub-wrapper">
            <div className="epub-viewer">
                <EpubViewer
                    url={epubUrl}
                    roomBookId={roomBookId}
                    memos={memos}
                    highlights={highlights}
                    onMemoCreated={fetchMemos}
                    onScrapCreated={fetchHighlights}
                    onRenditionReady={setRendition}
                />
            </div>

            {/* 2. 플로팅 버튼, 나중에 수정 */}
            <button
                className="floating-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
                {sidebarOpen ? "✕" : "memo"}
            </button>

            {/* 3. 사이드바 컴포넌트, 나중에 수정 */}
            <div
                className="sidebar-container"
                style={{
                    transform: sidebarOpen ? "translateX(0)" : "translateX(100%)",
                }}
            >
                <MemoSidebar
                    memos={memos}
                    roomBookId={roomBookId}
                    rendition={rendition}
                    onMemoChanged={fetchMemos}
                />
            </div>
        </div>
    );
};

export default EPubsPage;