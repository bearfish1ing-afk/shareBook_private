import { useEffect, useState, useRef } from 'react';
import Epub from 'epubjs';
import api from './api';
import PopupComments from './PopupComments';
import "./EpubViewer.css";

const EPubViewer = ({ url, roomBookId, memos = [], highlights = [], onMemoCreated, onScrapCreated, onRenditionReady }) => {
    const renditionRef = useRef(null);
    const bookRef = useRef(null);
    const isInitialized = useRef(false);
    const bubbleRef = useRef(null);
    const popupRef = useRef(null); // 클릭 팝업 바깥 클릭 감지용
    const currentContentsRef = useRef(null);
    const containerRef = useRef(null); // .viewer-container 기준 좌표 계산용 (position:relative 컨테이닝 블록)
    const bookAreaRef = useRef(null); // 실제 보이는 스프레드 영역(#area) 기준 - 왼쪽/오른쪽 페이지 판별용
    const memosRef = useRef(memos); // 이벤트 핸들러 내부에서 최신 memos를 읽기 위한 ref
    const highlightsRef = useRef(highlights); // 스크랩(하이라이트) 목록 최신값 참조용

    // 말풍선 관련 상태값들
    const [bubbleVisible, setBubbleVisible] = useState(false);
    const [bubbleMode, setBubbleMode] = useState("choice"); // "choice" | "memo"
    const [bubblePosition, setBubblePosition] = useState({ top: 0, left: 0 });
    const [memoContent, setMemoContent] = useState("");
    const [currentCfiRange, setCurrentCfiRange] = useState("");

    // 이미지 상태 관리
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");

    // 왼쪽 여백에 표시할 메모 마커들 (기존 형광펜 대체)
    const [markers, setMarkers] = useState([]);
    const [hoveredMarkerId, setHoveredMarkerId] = useState(null); // hover 미리보기 툴팁용
    const [hoveredMemoId, setHoveredMemoId] = useState(null);
    const [commentsByMemoId, setCommentsByMemoId] = useState({}); // 메모별 코멘트 캐시
    const [activeMarkerKey, setActiveMarkerKey] = useState(null); // 클릭으로 고정된 팝업의 마커 key
    const [activeMarker, setActiveMarker] = useState(null);
    const activeMarkerRef = useRef(null); // handleOutsideClick(마운트 시 1회 생성)의 stale closure 방지용

    // 스크랩(하이라이트) 전용 색상 - 서버 응답에 색 필드가 없다는 가정하에 고정색 사용
    const SCRAP_HIGHLIGHT_COLOR = "#FFD166";

    // hex 색상을 rgba로 변환 (알파값 조절해서 옅은 배경/진한 테두리 만드는 용도 - PopupComments와 동일한 방식)
    const hexToRgba = (hex, alpha) => {
        if (!hex) return `rgba(148, 163, 184, ${alpha})`;
        let c = hex.replace("#", "");
        if (c.length === 3) c = c.split("").map((ch) => ch + ch).join("");
        const num = parseInt(c, 16);
        if (Number.isNaN(num)) return `rgba(148, 163, 184, ${alpha})`;
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // hex 색상을 흰색 쪽으로 섞어서 옅게 만드는 헬퍼 (물방울 배경색용)
    const lightenColor = (hex, amount = 0.6) => {
        if (!hex) return "#f5d3e0";
        let c = hex.replace("#", "");
        if (c.length === 3) c = c.split("").map((ch) => ch + ch).join("");
        const num = parseInt(c, 16);
        if (Number.isNaN(num)) return "#f5d3e0";
        const r = Math.round(((num >> 16) & 255) + (255 - ((num >> 16) & 255)) * amount);
        const g = Math.round(((num >> 8) & 255) + (255 - ((num >> 8) & 255)) * amount);
        const b = Math.round((num & 255) + (255 - (num & 255)) * amount);
        return `rgb(${r}, ${g}, ${b})`;
    };

    // 같은 자리에 하이라이트가 중복으로 쌓이는 것을 방지
    const setCfiHighlight = (cfi, color, className = "marker-highlight") => {
        if (!renditionRef.current || !cfi) return;
        try {
            renditionRef.current.annotations.remove(cfi, "highlight");
        } catch (e) {
            // 무시
        }
        try {
            renditionRef.current.annotations.add(
                "highlight",
                cfi,
                {},
                null,
                className,
                { fill: color, "fill-opacity": "0.35" }
            );
        } catch (e) {
            // 무시
        }
    };

    const clearCfiHighlight = (cfi) => {
        if (!renditionRef.current || !cfi) return;
        try {
            renditionRef.current.annotations.remove(cfi, "highlight");
        } catch (e) {
            // 무시
        }
    };

    // 스크랩(하이라이트) 목록 전체를 항상 켜둠 (메모와 달리 마커 없이 텍스트 하이라이트만)
    const applyScrapHighlights = () => {
        if (!renditionRef.current) return;
        highlightsRef.current.forEach((h) => {
            if (!h.cfi) return;
            setCfiHighlight(h.cfi, h.penColor || SCRAP_HIGHLIGHT_COLOR, "scrap-highlight");
        });
    };

    // 마커 hover 시작: 툴팁 표시 + 해당 cfi 구간에 임시 하이라이트
    const handleMarkerEnter = (marker, key) => {
        setHoveredMarkerId(key);
        setHoveredMemoId(marker.memoId);

        if (activeMarkerKey === key) return; // 이미 클릭으로 하이라이트 켜져있음

        setCfiHighlight(marker.cfi, marker.color);
    };

    // 마커 hover 종료: 툴팁 숨김, 클릭으로 고정된 팝업이 열려있는 마커면 하이라이트는 유지
    const handleMarkerLeave = (marker, key) => {
        setHoveredMarkerId(null);

        if (activeMarkerKey === key) return; // 팝업 열려있는 동안은 하이라이트 유지

        clearCfiHighlight(marker.cfi);
    };

    // 마커 클릭: 팝업 고정 오픈
    const handleMarkerClick = (marker, key) => {
        if (activeMarkerKey === key) {
            closeMarkerPopup();
            return;
        }

        // 다른 마커 팝업이 열려있었으면 그 하이라이트부터 정리
        if (activeMarkerRef.current) {
            clearCfiHighlight(activeMarkerRef.current.cfi);
        }

        setActiveMarkerKey(key);
        setActiveMarker(marker);
        setHoveredMarkerId(null); // 툴팁은 팝업 열리면 숨김

        setCfiHighlight(marker.cfi, marker.color);
    };

    const closeMarkerPopup = () => {
        const current = activeMarkerRef.current;
        if (current) {
            clearCfiHighlight(current.cfi);
        }
        setActiveMarkerKey(null);
        setActiveMarker(null);
    };

    // 팝업 고정 크기
    const POPUP_WIDTH = 300;
    const POPUP_HEIGHT = 420;

    // 텍스트 위치 기준으로 팝업을 열되, 페이지 상/하단을 벗어나면 방향을 반대로 뒤집어서 안 잘리게 함
    const getPopupTop = (marker) => {
        if (!marker) return 0;
        const edgeGap = 12; // 페이지 가장자리와 팝업 사이 최소 여백

        let top = marker.textTop - 20; // 기본: 텍스트보다 살짝 위에서 시작해서 아래로 펼쳐짐

        // 아래쪽 공간이 부족하면 -> 팝업 아래쪽 끝이 텍스트 근처에 오도록 위로 뒤집기
        if (top + POPUP_HEIGHT > marker.pageBottom - edgeGap) {
            top = marker.textTop - POPUP_HEIGHT + 40;
        }

        // 그래도(뒤집었는데도) 위쪽 경계를 벗어나면 페이지 상단에 붙임
        if (top < marker.pageTop + edgeGap) {
            top = marker.pageTop + edgeGap;
        }

        return top;
    };

    const closeBubble = (clearSelection = true) => {
        setBubbleVisible(false);
        setBubbleMode("choice");
        setMemoContent("");
        setSelectedFile(null);
        setPreviewUrl("");

        if (!clearSelection) return;

        try {
            if (currentContentsRef.current?.window?.getSelection) {
                currentContentsRef.current.window.getSelection().removeAllRanges();
            }
        } catch (e) {
            // 에러 무시
        }
    };

    // 컨테이너(.viewer-container) 기준 상대좌표로 마커 위치 계산
    const updateMarkers = () => {
        if (!renditionRef.current || !containerRef.current) return;

        const contentsList = renditionRef.current.getContents();
        const containerRect = containerRef.current.getBoundingClientRect();
        const newMarkers = [];

        memosRef.current.forEach((memo) => {
            if (!memo.cfi) return;

            contentsList.forEach((contents) => {
                const originalConsoleError = console.error;
                console.error = () => {};

                let range;
                try {
                    range = contents.range(memo.cfi);
                } catch (e) {
                    range = null;
                } finally {
                    console.error = originalConsoleError;
                }

                if (!range) return;

                try {
                    const rect = range.getBoundingClientRect();
                    if (!rect || (rect.width === 0 && rect.height === 0)) return; // 이 페이지에 없는 cfi

                    const iframe = contents.document.defaultView.frameElement;
                    const iframeRect = iframe.getBoundingClientRect();

                    if (!bookAreaRef.current) return;
                    const areaRect = bookAreaRef.current.getBoundingClientRect();
                    const selectionXInWindow = rect.left + iframeRect.left; // 화면(top window) 기준 x좌표
                    const selectionYInWindow = rect.top + iframeRect.top;

                    // 현재 실제로 보이는 스프레드 영역(#area) 밖이면 다른 페이지의 콘텐츠이므로 건너뛰어야함
                    // (iframe이 챕터 전체를 담고 있어서, 화면 밖 콘텐츠도 rect가 0이 아닌 값으로 잡힘)
                    const margin = 5;
                    const isWithinVisibleArea =
                        selectionXInWindow >= areaRect.left - margin &&
                        selectionXInWindow <= areaRect.right + margin &&
                        selectionYInWindow >= areaRect.top - margin &&
                        selectionYInWindow <= areaRect.bottom + margin;

                    if (!isWithinVisibleArea) return;

                    const isRightPage = selectionXInWindow > (areaRect.left + areaRect.width / 2);

                    const markerWidth = 32;
                    const markerHeight = 20;
                    const gap = -38;

                    newMarkers.push({
                        memoId: memo.memoId,
                        cfi: memo.cfi,
                        top: rect.top + iframeRect.top - containerRect.top + rect.height / 2 - markerHeight / 2,
                        left: isRightPage
                            ? areaRect.right - containerRect.left + gap                 // 오른쪽 페이지 -> #area 오른쪽 바깥
                            : areaRect.left - containerRect.left - (markerWidth + gap),  // 왼쪽 페이지 -> #area 왼쪽 바깥
                        side: isRightPage ? "right" : "left",
                        color: memo.penColor || "#ff4d94",
                        content: memo.content,
                        nickname: memo.nickname,
                        profileImg: memo.profileImg,
                        picture: memo.picture,
                        // 실제 하이라이트된 텍스트의 위치 (팝업을 텍스트 기준으로 붙이기 위함, 마커 위치와 별개)
                        textTop: rect.top + iframeRect.top - containerRect.top,
                        textLeft: rect.left + iframeRect.left - containerRect.left,
                        textRight: rect.left + iframeRect.left - containerRect.left + rect.width,
                        // 보이는 페이지 영역의 세로 범위 (팝업이 위/아래로 안 잘리게 클램핑하는 기준)
                        pageTop: areaRect.top - containerRect.top,
                        pageBottom: areaRect.bottom - containerRect.top
                    });
                } catch (e) {
                    // 현재 페이지에 존재하지 않는 cfi -> 무시
                }
            });
        });

        setMarkers(newMarkers);
    };

    useEffect(() => {
        if (isInitialized.current) return;
        isInitialized.current = true;
        let isMounted = true;

        const initEpub = async () => {
            try {
                const response = await fetch(url);
                const buffer = await response.arrayBuffer();

                if (!isMounted) return;

                bookRef.current = Epub(buffer);

                renditionRef.current = bookRef.current.renderTo("area", {
                    width: "100%",
                    height: "100%",
                    flow: "paginated",
                    spread: "always",
                    allowPopups: true,
                    sandbox: "allow-same-origin allow-scripts allow-forms"
                });

                renditionRef.current.themes.default({
                    "body": {
                        "font-family": "'Pretendard', 'Noto Sans KR', sans-serif !important",
                        "letter-spacing": "0.05em !important",
                        "line-height": "1.8 !important",
                        "font-size": "15px !important",
                        "color": "#1e293b !important",
                        "word-break": "break-all !important",
                        "text-align": "justify !important"
                    },
                    "p": {
                        "margin-bottom": "1em !important",
                        "text-indent": "1em !important"
                    }
                });

                renditionRef.current.display();
                onRenditionReady(renditionRef.current);

                renditionRef.current.on("selected", handleTextSelected);
                renditionRef.current.on("click", () => {
                    closeBubble(false);
                });

                // 페이지가 렌더링/이동될 때마다 마커 위치 재계산 + 스크랩 하이라이트 재적용
                renditionRef.current.on("rendered", updateMarkers);
                renditionRef.current.on("relocated", updateMarkers);
                renditionRef.current.on("rendered", applyScrapHighlights);
                renditionRef.current.on("relocated", applyScrapHighlights);

                applyScrapHighlights();

            } catch (error) {
                console.error("EPUB 로딩 또는 파싱 실패:", error);
                isInitialized.current = false;
            }
        };

        initEpub();

        // 드래그 발생 시 실행되는 핸들러
        const handleTextSelected = (cfiRange, contents) => {
            setBubbleVisible(false);
            setBubbleMode("choice");

            setCurrentCfiRange(cfiRange);
            currentContentsRef.current = contents;

            const selection = contents.window.getSelection();
            if (!selection || !selection.rangeCount) return;

            const range = selection.getRangeAt(0);
            if (range.collapsed || !selection.toString().trim()) return;

            const rect = range.getBoundingClientRect();
            const iframe = renditionRef.current.manager.container.querySelector('iframe');
            if (!iframe) return;
            const iframeRect = iframe.getBoundingClientRect();

            if (!containerRef.current) return;
            const containerRect = containerRef.current.getBoundingClientRect();

            setBubblePosition({
                top: rect.bottom + iframeRect.top - containerRect.top - 20,
                left: rect.left + iframeRect.left - containerRect.left + (rect.width / 2) + 20
            });

            setBubbleVisible(true);
        };

        // 외부 영역 클릭 제어
        const handleOutsideClick = (e) => {
            // 마커 자체를 클릭한 경우는 handleMarkerClick이 처리하므로 여기서 개입하지 않음
            if (e.target.closest && e.target.closest(".memo-marker")) return;

            if (bubbleRef.current && !bubbleRef.current.contains(e.target)) {
                // 파일 선택창을 누를 때 닫히는 현상 방지하기 위해 파일 인풋 타겟 체크 필요 시 조건 확장 가능
                if (e.target.type !== 'file') {
                    closeBubble(false);
                }
            }

            if (popupRef.current && !popupRef.current.contains(e.target)) {
                closeMarkerPopup();
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);

        return () => {
            isMounted = false;
            isInitialized.current = false;
            document.removeEventListener("mousedown", handleOutsideClick);

            if (renditionRef.current) {
                renditionRef.current.off("selected", handleTextSelected);
                renditionRef.current.off("rendered", updateMarkers);
                renditionRef.current.off("relocated", updateMarkers);
                renditionRef.current.off("rendered", applyScrapHighlights);
                renditionRef.current.off("relocated", applyScrapHighlights);
                renditionRef.current.destroy();
            }
            if (bookRef.current) {
                bookRef.current.destroy();
            }
        };
    }, [url]);

    // memos가 바뀔 때마다 ref를 최신화하고 마커 다시 계산
    useEffect(() => {
        memosRef.current = memos;
        updateMarkers();
    }, [memos]);

    // highlights(스크랩)가 바뀔 때마다 ref 최신화하고 다시 적용
    useEffect(() => {
        highlightsRef.current = highlights;
        applyScrapHighlights();
    }, [highlights]);

    // 클릭 팝업의 stale closure 방지용 ref 동기화
    useEffect(() => {
        activeMarkerRef.current = activeMarker;
    }, [activeMarker]);

    // hover 중인 메모의 코멘트를 불러오기 (한 번 불러온 memoId는 캐싱해서 재요청 안 함)
    useEffect(() => {
        if (!hoveredMemoId) return;
        if (commentsByMemoId[hoveredMemoId]) return; // 이미 캐싱됨

        let cancelled = false;
        api.get(`/api/comments/memo/${hoveredMemoId}`)
            .then((res) => {
                if (cancelled) return;
                setCommentsByMemoId((prev) => ({ ...prev, [hoveredMemoId]: res.data }));
            })
            .catch((error) => {
                console.error("코멘트 로드 실패:", error);
            });

        return () => { cancelled = true; };
    }, [hoveredMemoId]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            return;
        }

        setSelectedFile(file);
        //브라우저용
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        setSelectedFile(null);
        setPreviewUrl("");
    }

    const handleSaveMemo = async (e) => {
        e.preventDefault();
        if (!memoContent.trim() && !selectedFile) return;

        try {
            const formData = new FormData();
            formData.append("roomBookId", roomBookId);
            formData.append("cfi", currentCfiRange);
            formData.append("content", memoContent);

            if (selectedFile) {
                formData.append("picture", selectedFile);
            }

            await api.post('/api/memos', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            onMemoCreated();
            closeBubble(true);
        } catch (error) {
            console.error("메모 등록 실패:", error);
        }
    };

   const handleScrap = async () => {
       try {
           const selection = currentContentsRef.current?.window?.getSelection();
           const selectedText = selection?.toString()?.trim();

           if (!roomBookId || !currentCfiRange || !selectedText) return;

           await api.post("/api/highlight", {
               roomBookId: Number(roomBookId),
               cfi: currentCfiRange,
               content: selectedText,
           });

           if (onScrapCreated) {
               await onScrapCreated();
           }
       } catch (error) {
           console.error("스크랩 생성 실패:", error);
           alert("스크랩 저장 중 오류가 발생했습니다.");
       } finally {
           closeBubble(false);
       }
   };

    const prevPage = () => { renditionRef.current?.prev(); closeBubble(false); };
    const nextPage = () => { renditionRef.current?.next(); closeBubble(false); };

    return (
        <div className="viewer-container" ref={containerRef}>
            <div className="book-frame">
                <button onClick={prevPage} className="viewer-nav-btn prev">◀</button>
                <div id="area" className="book-area" ref={bookAreaRef} />
                <button onClick={nextPage} className="viewer-nav-btn next">▶</button>
            </div>

            {markers.map((marker, idx) => {
                const key = `${marker.memoId ?? marker.cfi ?? "marker"}-${idx}`;
                return (
                    <svg
                        key={key}
                        className="memo-marker"
                        viewBox="0 0 26 16"
                        style={{
                            position: "absolute",
                            top: `${marker.top}px`,
                            left: `${marker.left}px`
                        }}
                        onMouseEnter={() => handleMarkerEnter(marker, key)}
                        onMouseLeave={() => handleMarkerLeave(marker, key)}
                        onClick={() => handleMarkerClick(marker, key)}
                    >
                        {marker.side === "right" ? (
                            <>
                                <circle cx="18" cy="8" r="7" fill={lightenColor(marker.color)} />
                                <path d="M13,4 L7,8 L13,12 Z" fill={lightenColor(marker.color)} />
                                <circle cx="18" cy="8" r="3" fill={marker.color} />
                            </>
                        ) : (
                            <>
                                <circle cx="8" cy="8" r="7" fill={lightenColor(marker.color)} />
                                <path d="M13,4 L19,8 L13,12 Z" fill={lightenColor(marker.color)} />
                                <circle cx="8" cy="8" r="3" fill={marker.color} />
                            </>
                        )}
                    </svg>
                );
            })}

            {/* 마커 hover 미리보기 툴팁  */}
            {markers.map((marker, idx) => {
                const key = `${marker.memoId ?? marker.cfi ?? "marker"}-${idx}`;
                if (hoveredMarkerId !== key || activeMarkerKey === key) return null;

                return (
                    <div
                        key={`tooltip-${key}`}
                        className="marker-tooltip"
                        style={{
                            top: `${marker.top - 8}px`,
                            left: marker.side === "right"
                                ? `${marker.left - 240}px`   // 오른쪽 마커는 툴팁이 왼쪽으로 열리도록
                                : `${marker.left + 40}px`    // 왼쪽 마커는 툴팁이 오른쪽으로 열리도록
                        }}
                    >
                        <div className="marker-tooltip-header">
                            {marker.profileImg && (
                                <img src={marker.profileImg} alt="프로필사진" className="marker-tooltip-avatar" />
                            )}
                            <span className="marker-tooltip-dot" style={{ backgroundColor: marker.color }} />
                            <strong className="marker-tooltip-nickname">{marker.nickname}</strong>
                        </div>
                        <p className="marker-tooltip-content">{marker.content || "(내용 없음)"}</p>
                        {marker.picture && (
                            <img src={marker.picture} alt="메모 첨부 이미지" className="marker-tooltip-image" />
                        )}

                        {/* 코멘트 목록 (읽기 전용 - 작성/수정/삭제는 클릭 팝업에서만) */}
                        {(commentsByMemoId[marker.memoId] || []).length > 0 && (
                            <div className="marker-tooltip-comments">
                                {commentsByMemoId[marker.memoId].map((comment) => (
                                    <div key={comment.commentId} className="marker-tooltip-comment">
                                        <span
                                            className="marker-tooltip-comment-dot"
                                            style={{ backgroundColor: comment.penColor }}
                                        />
                                        <strong className="marker-tooltip-comment-nickname">{comment.nickname}</strong>
                                        <span className="marker-tooltip-comment-text">{comment.content}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* 마커 클릭 팝업 */}
            {activeMarker && (
                <div
                    ref={popupRef}
                    className="marker-popup"
                    style={{
                        top: `${getPopupTop(activeMarker)}px`,
                        left: activeMarker.side === "right"
                            ? `${activeMarker.textRight + 12}px`  // 오른쪽 페이지 텍스트 -> 텍스트 오른쪽 바깥으로
                            : `${activeMarker.textLeft - (POPUP_WIDTH - 60)}px`  // 왼쪽 페이지 텍스트 -> 텍스트 왼쪽 바깥으로
                    }}
                >
                    <button
                        type="button"
                        className="marker-popup-close"
                        onClick={closeMarkerPopup}
                        aria-label="닫기"
                    >
                        ✕
                    </button>

                    <div className="marker-popup-header">
                        {activeMarker.profileImg && (
                            <img
                                src={activeMarker.profileImg}
                                alt="프로필사진"
                                className="marker-popup-avatar"
                            />
                        )}
                    </div>

                    {/* 메모 본문  */}
                    <div className="marker-popup-memo">
                        {activeMarker.picture ? (
                            <div className="marker-popup-image-wrap">
                                <img
                                    src={activeMarker.picture}
                                    alt="메모 첨부 이미지"
                                    className="marker-popup-image"
                                />
                                {activeMarker.content && (
                                    <div
                                        className="marker-popup-caption"
                                        style={{
                                            backgroundColor: hexToRgba(activeMarker.color, 0.85),
                                            borderColor: hexToRgba(activeMarker.color, 0.55)
                                        }}
                                    >
                                        <span
                                            className="marker-popup-caption-dot"
                                            style={{ backgroundColor: activeMarker.color }}
                                        />
                                        {activeMarker.profileImg && (
                                            <img
                                                src={activeMarker.profileImg}
                                                alt=""
                                                className="marker-popup-caption-avatar"
                                            />
                                        )}
                                        <span>{activeMarker.content}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            activeMarker.content && (
                                <p
                                    className="marker-popup-content"
                                    style={{
                                        backgroundColor: hexToRgba(activeMarker.color, 0.15),
                                        borderColor: hexToRgba(activeMarker.color, 0.55)
                                    }}
                                >
                                    <span
                                        className="marker-popup-content-dot"
                                        style={{ backgroundColor: activeMarker.color }}
                                    />
                                    {activeMarker.content}
                                </p>
                            )
                        )}
                    </div>

                    <PopupComments memoId={activeMarker.memoId} />
                </div>
            )}
            {bubbleVisible && bubbleMode === "choice" && (
                <div
                    ref={bubbleRef}
                    className="selection-choice"
                    style={{
                        top: `${bubblePosition.top + 15}px`,
                        left: `${bubblePosition.left}px`
                    }}
                >
                    <button
                        type="button"
                        className="selection-choice-btn"
                        onClick={() => setBubbleMode("memo")}
                        title="메모"
                        aria-label="메모"
                    >
                        <img src="/memo-icon.png" className="choice-icon" alt="memoicon" />
                    </button>
                    <button
                        type="button"
                        className="selection-choice-btn"
                        onClick={handleScrap}
                        title="스크랩"
                        aria-label="스크랩"
                    >
                        <img src="/scrab-icon.png" className="choice-icon"  alt="scrabicon" />
                    </button>
                </div>
            )}

            {/* 메모 작성 폼 */}
            {bubbleVisible && bubbleMode === "memo" && (
                <div
                    ref={bubbleRef}
                    className="memo-bubble"
                    style={{
                        top: `${bubblePosition.top + 15}px`,
                        left: `${bubblePosition.left}px`
                    }}
                >
                    <div className="bubble-arrow" />

                    <form onSubmit={handleSaveMemo}>
                        <div className="bubble-form-layout">
                            <textarea
                                value={memoContent}
                                onChange={(e) => setMemoContent(e.target.value)}
                                placeholder="생각을 자유롭게 남기세요.."
                                className="bubble-textarea"
                                autoFocus
                            />
                            {previewUrl && (
                                <div style={{ position: 'relative', marginTop: '10px', textAlign: 'center' }}>
                                    <img
                                        src={previewUrl}
                                        alt="미리보기"
                                        style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '4px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        style={{
                                            position: 'absolute', top: '2px', right: '2px',
                                            background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
                                            borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer'
                                        }}
                                    >✕</button>
                                </div>
                            )}
                            <div className="bubble-btn-group">
                                <label style={{ cursor: 'pointer', fontSize: '18px' }} title="이미지 첨부">
                                    +
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                                <button type="submit" className="bubble-submit-btn">
                                    완료
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default EPubViewer;