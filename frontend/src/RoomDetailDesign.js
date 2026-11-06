import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import { useNavigate, useParams } from "react-router-dom";
import axios from 'axios';
import './RoomDetailDesign.css';
import Sidebar from './Sidebar.js';
import { TwitterPicker } from "react-color";
import RoomBookChoice from './roomBookChoice.js';

const RoomDetailDesign = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();

    const [roomData, setRoomData] = useState(null);
    const [books, setBooks] = useState([]);
    const [currentStatus, setCurrentStatus] = useState('READING'); // 상태 필터 추가
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [isBookEditMode, setIsBookEditMode] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const customColors = [
        "#f78da7", "#ff8b94", "#ffaaa6", "#ffd3b6", "#dcedc1", "#a8e6cf", "#b8e994",
        "#fab1a0", "#fdcb6e", "#ffeaa7", "#74b9ff", "#a29bfe", "#dfe6e9", "#b2bec3"
    ];

    useEffect(() => {
        const fetchRoomAllData = async () => {
            const token = localStorage.getItem('accessToken');
            const payload = JSON.parse(atob(token.split(".")[1]));
            setCurrentUserId(payload.userId);
            setIsLoading(true);

            try {
                const headers = { 'Authorization': `Bearer ${token}` };
                // 1. 방 상세 정보 (기존과 동일)
                const [roomRes, scrapText] = await Promise.all([
                    axios.get(`http://localhost:8080/api/v1/rooms/${roomId}`, {headers}),
                    axios.get(`http://localhost:8080/api/highlight/${roomId}/latest`, {headers})
                ]);
            

                if (roomRes.data.success) {
                    setRoomData({...roomRes.data.data, latestScrap: scrapText.data});

                    const newAuth = roomRes.headers['authorization'];
                    if (newAuth) localStorage.setItem('accessToken', newAuth.split(" ")[1]);
                }

                const bookRes = await axios.get(`http://localhost:8080/api/v1/rooms/${roomId}/booklist`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const bookList = Array.isArray(bookRes.data) ? bookRes.data : bookRes.data.data;
                setBooks(bookList || [])

            } catch (err) {
                console.error("데이터 로딩 실패:", err);
                setError("방 정보를 불러오는 데 실패했습니다.");
            } finally {
                setIsLoading(false);
            }
        };

        if (roomId) fetchRoomAllData();
    }, [roomId, currentStatus]);

    const handleStartEdit = () => {
        setNewRoomName(roomData.name); // 기존 방 이름을 input에 초기값으로 세팅
        setIsEditingName(true);
    };

    const handleUpdateName = async () => {
        if (!newRoomName.trim()) {
            alert("방 이름은 공백일 수 없습니다.");
            return;
        }

        const token = localStorage.getItem('accessToken');
        try {
            const response = await axios.patch(`http://localhost:8080/api/v1/rooms/${roomId}/update-name`,
                {name: newRoomName},
                {headers: { Authorization: `Bearer ${token}`}}
            );

            setRoomData(prev => ({ ...prev, name: newRoomName }));
            setIsEditingName(false);
        } catch (error) {
            console.error("방 이름 변경 실패", error);
        }
    };

    // 룸북 삭제
    const handleDeleteBook = async (roomBookId, bookTitle) => {
    if (!window.confirm(`정말 [${bookTitle}] 책을 이 방에서 삭제하시겠습니까?`)) return;

    const token = localStorage.getItem('accessToken');
    try {
        await axios.delete(`http://localhost:8080/api/v1/rooms/${roomId}/${roomBookId}/delete`, 
            { headers : { 'Authorization': `Bearer ${token}` }}
            
        );
        
        setBooks(prev => prev.filter(book => book.roomBookId !== roomBookId));
        alert("책이 성공적으로 삭제되었습니다.");
    } catch (error) {
        console.error("책 삭제 실패:", error);
        alert("책 삭제에 실패했습니다.");
    }
};

    // 하이라이트 cfi-> 페이지 계산
    // const parsePageFromCfi = (cfi) =>{
    //     if(!cfi) return "";
    //     const pageMatch = cfi.match(/page-(\d+)/i) || cfi.match(/\[(\d+)\]/) || cfi.match(/(\d+)/);
    //     return pageMatch ? `${pageMatch[1]}p` : "p.확인";
    // }

    const deleteMember = async (userId, nickname) => {
        if (!window.confirm(`정말 ${nickname}님을 이 방에서 내보내시겠습니까?`)) return;
        const token = localStorage.getItem('accessToken');
        try {
            const response = await axios.delete(`http://localhost:8080/api/v1/rooms/${roomId}/delete/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );         
            setRoomData(prev=>({
                ...prev,
                memberInfo: prev.memberInfo.filter(member=>member.userId!=userId)
            }));
            alert(`${nickname}님을 내보냈습니다.`)

        } catch (error) {
            console.error("멤버 내보내기 에러", error);
            alert("멤버 내보내기에 실패했습니다.");
        }
    };

    const handleLeaveRoom = async () => {
        if (!window.confirm("정말 이 방에서 나가시겠습니까?")) return;

        const token = localStorage.getItem('accessToken');
        try {
            await axios.delete(`http://localhost:8080/api/v1/rooms/${roomId}/leave`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );         
            
            alert("방에서 성공적으로 나갔습니다.");
            navigate("/");
        } catch (error) {
            console.error("방 나가기 에러", error);
            alert("방 나가기에 실패했습니다.");
        }
    };

    const handleClosePage = () => {
        navigate(-1); 
    };

    const takenColors = roomData?.memberInfo
    ? roomData.memberInfo
        .filter(member => member.userId !== currentUserId)
        .map(member => member.penColor?.toLowerCase())
    : [];

    const handleColorChange = async (color) => {
        const selectedColorHex = color.hex.toLowerCase();
        if (takenColors.includes(selectedColorHex)) {
            alert("이미 사용 중인 색입니다.");
            return;
        }
        const token = localStorage.getItem('accessToken');
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            
            await axios.patch(`http://localhost:8080/api/v1/rooms/${roomId}/color`, 
                { penColor: color.hex }, 
                { headers }
            );

            setRoomData(prev => ({
                ...prev,
                memberInfo: prev.memberInfo.map(member => 
                    member.userId === currentUserId ? { ...member, penColor: color.hex } : member
                )
            }));
            
            setShowColorPicker(false);
        } catch (error) {
            console.error("펜 색상 변경 실패:", error);
        }
    };

    if (isLoading) return <div className="loading">방 정보를 불러오는 중...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!roomData) return <div className="error">정보가 없습니다.</div>;

    return (
        <div className="room-info-overlay">
            <Sidebar />
            <div className="room-info-modal">
                
                {/* 우측 상단 닫기 버튼 */}
                <button className="room-close-btn" onClick={handleClosePage}>✕</button>

                {/* 1. 왼쪽 세로 책 목록 사이드바 */}
                <div className="room-sidebar">
                    <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', justifyContent: 'center', alignItems: 'center', marginBottom: '15px', width: '100%'}}>
                        <span className="sidebar-title" style={{ margin: 0 }}>책 목록</span>
                        <button 
                            className="book-list-edit-toggle-btn"
                            onClick={() => setIsBookEditMode(!isBookEditMode)}
                            style={{position:'absolute', right: 5}}
                        >
                            {isBookEditMode ? '완료' : '편집'}
                        </button>
                    </div>
                    {/* <span className="sidebar-title">책 목록</span> */}
                    
                    <div className="book-scroller">
                        {/* 책 추가 버튼 */}
                        <button className="book-add-card">
                            <span className="plus-icon" onClick={()=>navigate(`/room/${roomId}/book-choice`)}>+</span>
                        </button>

                        {/* 등록된 책 목록 피지컬 렌더링 */}
                        {books.map(book => (
                            <div 
                                key={book.roomBookId} 
                                className={`tilted-book-card ${isBookEditMode ? 'editing' : ''}`} 
                                onClick={() => {
                                    // 🚀 편집 모드가 아닐 때만(평소에만) 책 뷰어로 이동!
                                    if (!isBookEditMode) {
                                        navigate(`/epub/${roomId}/${book.roomBookId}`);
                                    }
                                }}
                                style={{ cursor: isBookEditMode ? "default" : "pointer", position: 'relative' }}
                            >
                                {/* 🚀 편집 모드(isBookEditMode)가 켜졌을 때만 덮어씌워지는 반투명 오버레이 패널 */}
                                {isBookEditMode && (
                                    <div className="book-edit-overlay">
                                        <button 
                                            className="edit-action-btn complete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                alert("완독 처리 백엔드 연결 필요!"); 
                                            }}
                                        >
                                            완독
                                        </button>
                                        <button 
                                            className="edit-action-btn delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteBook(book.roomBookId, book.title);
                                            }}
                                        >
                                            삭제
                                        </button>
                                    </div>
                                )}

                                <div className="book-title-vertical"> 
                                    <img src={book.coverImage} alt={book.title} />
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* 하단 화살표 인디케이터 */}
                    <div className="sidebar-arrow-down">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M6 9L12 15L18 9" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                </div>

                {/* 2. 오른쪽 메인 콘텐츠 영역 */}
                <div className="room-main-content">
                    
                    {/* 상단 타이틀 & 초대코드 헤더 */}
                    <div className="room-header-section">
                        <div className="room-title-wrapper"> 
                            {isEditingName ? (
                                <input 
                                    type="text" 
                                    value={newRoomName} 
                                    onChange={(e) => setNewRoomName(e.target.value)}
                                    /* 엔터는 저장 esc는 취소 */
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleUpdateName();
                                        } else if (e.key === 'Escape') {
                                            setIsEditingName(false);
                                        }
                                    }}
                                    /* 입력하다가 딴 데 클릭(포커스 아웃)해도 저장 */
                                    onBlur={handleUpdateName} 
                                    autoFocus
                                    className="room-main-title-input"
                                />
                            ) : (
                                <>
                                    <h1 className="room-main-title">{roomData.name}</h1>
                                    <button className="room-edit-icon" onClick={handleStartEdit}>
                                        <svg width="24" height="24" stroke="#a3a3a3" stroke-width="1.5" fill="none" >
                                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z" />
                                            <line x1="17" y1="4" x2="20" y2="7" />
                                        </svg>
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="room-invite-code">
                            초대코드 #{roomData.joinCode}
                        </div>
                    </div>

                    {/* 중앙 하이라이트 배너 카드 */}
                   <div className="room-highlight-banner" onClick={()=>navigate(`/epub/${roomId}/${roomData?.latestScrap?.roomBookId}`)}>
                        <p className="highlight-text-blur">
                            {roomData?.latestScrap?.content || "아직 스크랩이 없습니다."}
                        </p>

                        <div className="member-circle-banner" style={{ border: `1.5px solid ${roomData?.latestScrap?.penColor}` }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="#aaa">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5-4-8-4z"/>
                            </svg>
                        </div> 

                        <div className="highlight-meta">
                            <span className="highlight-book-title">{roomData?.latestScrap?.bookTitle}</span>
                            {/* <span className="highlight-book-page">{parsePageFromCfi(roomData?.latestScrap?.cfi)}</span> */}
                            <div className="hl-color-dot" style={{ backgroundColor: roomData?.latestScrap?.penColor }}/>
                        </div>

                    </div>
               

                    {/* 하단 멤버 리스트 구성 섹션 */}
                    <div className="room-member-section">
                        {roomData.memberInfo && roomData.memberInfo.filter(member=>member.status!=='ENDED').map(member => {
                            const isMe = member.userId === currentUserId;
                            const amIHost = roomData.memberInfo.find(m => m.userId === currentUserId)?.role === 'HOST';

                            return (
                            
                            <div key={member.id} className="member-row">
                                {/* 프로필 아이콘 */}
                                <div className="member-avatar-wrapper">
                                    <div className="member-avatar-circle">
                                        {member.profileImage ? (
                                            <img
                                                src={member.profileImage}
                                                alt=""
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="#aaa">
                                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5-4-8-4z"/>
                                            </svg>
                                        )}
                                    </div>
                                </div>

                                {/* 유저 본문 정보 */}
                                <div className="member-info-text">
                                    <div className="member-info">
                                        <div className="member-initial-badge" style={{ backgroundColor: member.penColor }}/>
                                        <p className="member-nickname"></p>{member.nickname}
                                    </div>
                                    <div className="member-status">{member.role}</div>
                                </div>

                                {/*내보내기(방장용), 펜 색상 변경 버튼*/}
                                <div className="member-action-buttons" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    
                                    {/* 내 프로필 옆 펜 색상 변경 피커 노출 */}
                                    {isMe && (
                                        <div style={{ position: 'relative' }}>
                                            <button 
                                                className="pen-edit-btn" 
                                                onClick={() => setShowColorPicker(!showColorPicker)}
                                                style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer' }}
                                            >
                                                🎨
                                            </button>

                                            {showColorPicker && (
                                                <div className="custom-color-popover">
                                                    <div className="popover-triangle-arrow" />
                                                    
                                                    {/* 컬러 칩 그리드 컨레이너 */}
                                                    <div className="color-swatch-grid">
                                                        {customColors.map(color => {
                                                            // 이미 다른 유저가 사용 중인 색상인지 확인
                                                            const isTaken = takenColors.includes(color.toLowerCase());

                                                            return (
                                                                <button
                                                                    key={color}
                                                                    className={`color-swatch-item-room ${isTaken ? 'is-taken' : ''}`}
                                                                    style={{ backgroundColor: color }}
                                                                    onClick={() => !isTaken && handleColorChange({ hex: color })}
                                                                    disabled={isTaken}
                                                                    title={isTaken ? "다른 멤버가 사용 중인 색상입니다" : color}
                                                                >
                                                                    {/*선점된 색상 위에 흰색 체크표시*/}
                                                                    {isTaken && <span className="swatch-check-mark">✓</span>}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/*  내가 방장(HOST)이고, '타인'일 때만 강퇴 버튼 노출 */}
                                    {amIHost && !isMe && (
                                        <button 
                                            className="member-kick-btn"
                                            onClick={() => deleteMember(member.userId)}
                                            style={{
                                                background: '#fff1f0',
                                                border: '1px solid #ffa39e',
                                                color: '#f5222d',
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                fontSize: '13px',
                                                fontWeight: '500',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            내보내기
                                        </button>
                                    )}
                                </div>
                            </div>
                            );
                        })}
                    </div>

                    {/* 방 나가기 버튼 */}
                    <div className="room-leave-section" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                            onClick={handleLeaveRoom}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'transparent',
                                border: '1px solid #d9d9d9',
                                color: '#666',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = '#fff1f0';
                                e.currentTarget.style.borderColor = '#ffa39e';
                                e.currentTarget.style.color = '#f5222d';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.borderColor = '#d9d9d9';
                                e.currentTarget.style.color = '#666';
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            방 나가기
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default RoomDetailDesign;