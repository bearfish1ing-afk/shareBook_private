import { useState } from 'react';
import api from './api';
import CommentComponent from './CommentComponent';
import { getCurrentUserId } from './utils/auth';
import "./MemoSidebar.css";

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

const MemoSidebar = ({ memos, roomBookId, rendition, onMemoChanged }) => {
    const currentUserId = getCurrentUserId();

    const [editingMemoId, setEditingMemoId] = useState(null);
    const [editContent, setEditContent] = useState('');

    const startEditMemo = (memo) => {
        setEditingMemoId(memo.memoId);
        setEditContent(memo.content);
    };

    const cancelEditMemo = () => {
        setEditingMemoId(null);
        setEditContent('');
    };

    const handleSaveMemo = async (memoId) => {
        if (!editContent.trim()) return;

        try {
            const formData = new FormData();
            formData.append('content', editContent);
            // picture 안 보냄 -> 기존 이미지 유지

            await api.put(`/api/memos/${memoId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            cancelEditMemo();
            onMemoChanged();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteMemoImage = async (memoId, currentContent) => {
        if (!window.confirm("첨부된 이미지를 삭제하시겠습니까?")) return;

        try {
            const formData = new FormData();
            formData.append('content', currentContent);
            formData.append('deleteOldPicture', true);

            await api.put(`/api/memos/${memoId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onMemoChanged();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteMemo = async (memoId, cfi) => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;

        try {
            await api.delete(`/api/memos/${memoId}`);
            if (rendition) rendition.annotations.remove(cfi, "highlight");
            onMemoChanged();
        } catch (error) {
            console.error(error);
        }
    };

    const handleGoToMemo = (cfi) => {
        if (!rendition || !cfi) return;
        rendition.display(cfi);
    };

    return (
        <div className="memo-sidebar">
            <h3 className="memo-sidebar-title">이 책에 담긴 메모 ({memos.length})</h3>
            <div className="memo-sidebar-list">
                {memos.map((memo) => {
                    const isOwner = currentUserId != null && Number(memo.userId) === Number(currentUserId);
                    const isEditing = editingMemoId === memo.memoId;
                    const color = memo.penColor || "#ff4d94";

                    return (
                        <div key={memo.memoId} className="memo-card">
                            <div className="memo-card-header">
                                {memo.profileImg && (
                                    <img src={memo.profileImg} alt="프로필사진" className="memo-card-avatar" />
                                )}
                                <span className="memo-card-dot" style={{ backgroundColor: color }} />
                                <strong className="memo-card-nickname">{memo.nickname}</strong>
                            </div>

                            <div
                                className={`memo-card-body${!isEditing && rendition ? ' is-clickable' : ''}`}
                                onClick={() => !isEditing && handleGoToMemo(memo.cfi)}
                                title={isEditing ? undefined : "클릭하면 이 메모 위치로 이동합니다"}
                            >
                                {/* 이미지 + 캡션 오버레이 (marker-popup과 동일한 패턴) */}
                                {memo.picture && !isEditing && (
                                    <div className="memo-card-image-wrap">
                                        <img src={memo.picture} alt="메모 첨부 이미지" className="memo-card-image" />
                                        {memo.content && (
                                            <div
                                                className="memo-card-caption"
                                                style={{
                                                    backgroundColor: hexToRgba(color, 0.85),
                                                    borderColor: hexToRgba(color, 0.55)
                                                }}
                                            >
                                                <span className="memo-card-caption-dot" style={{ backgroundColor: color }} />
                                                <span>{memo.content}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 이미지가 없을 때만 본문을 별도 말풍선으로 표시 */}
                                {!memo.picture && !isEditing && memo.content && (
                                    <p
                                        className="memo-card-content"
                                        style={{
                                            backgroundColor: hexToRgba(color, 0.15),
                                            borderColor: hexToRgba(color, 0.55)
                                        }}
                                    >
                                        <span className="memo-card-content-dot" style={{ backgroundColor: color }} />
                                        {memo.content}
                                    </p>
                                )}

                                {isEditing && (
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="memo-card-edit-textarea"
                                        autoFocus
                                    />
                                )}
                            </div>

                            {isOwner && (
                                <div className="memo-card-actions">
                                    {isEditing ? (
                                        <>
                                            <button onClick={() => handleSaveMemo(memo.memoId)}>저장</button>
                                            <button onClick={cancelEditMemo}>취소</button>
                                        </>
                                    ) : (
                                        <button onClick={() => startEditMemo(memo)}>수정</button>
                                    )}
                                    {memo.picture && !isEditing && (
                                        <button onClick={() => handleDeleteMemoImage(memo.memoId, memo.content)}>이미지 삭제</button>
                                    )}
                                    {!isEditing && (
                                        <button onClick={() => handleDeleteMemo(memo.memoId, memo.cfi)}>삭제</button>
                                    )}
                                </div>
                            )}

                            <div className="memo-card-comments">
                                <CommentComponent memoId={memo.memoId} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MemoSidebar;