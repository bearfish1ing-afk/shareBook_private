import api from './api';
import React, { useState, useEffect } from 'react';
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

const CommentComponent = ({ memoId }) => {
    const currentUserId = getCurrentUserId();

    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [newImageFile, setNewImageFile] = useState(null);

    // 인라인 편집 상태
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editContent, setEditContent] = useState('');

    const fetchComments = async () => {
        try {
            const response = await api.get(`/api/comments/memo/${memoId}`);
            setComments(response.data);
        } catch (error) {
            console.error("코멘트 로드 실패: ", error);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [memoId]);

    const handleCreateComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const formData = new FormData();
            formData.append('memoId', memoId);
            formData.append('content', newComment);
            if (newImageFile) {
                formData.append('picture', newImageFile);
            }

            await api.post('/api/comments', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setNewComment('');
            setNewImageFile(null);
            fetchComments();
        } catch (error) {
            console.error("코멘트 작성 실패: ", error);
        }
    };

    const startEditComment = (comment) => {
        setEditingCommentId(comment.commentId);
        setEditContent(comment.content);
    };

    const cancelEditComment = () => {
        setEditingCommentId(null);
        setEditContent('');
    };

    const handleSaveComment = async (commentId) => {
        if (!editContent.trim()) return;

        try {
            const formData = new FormData();
            formData.append('content', editContent);
            // picture 안 보냄 -> 기존 이미지 유지

            await api.put(`/api/comments/${commentId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            cancelEditComment();
            fetchComments();
        } catch (error) {
            console.error("코멘트 수정 실패: ", error);
        }
    };

    const handleDeleteCommentImage = async (commentId, currentContent) => {
        if (!window.confirm("첨부된 이미지를 삭제하시겠습니까?")) return;

        try {
            const formData = new FormData();
            formData.append('content', currentContent);
            formData.append('deleteOldPicture', true);

            await api.put(`/api/comments/${commentId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchComments();
        } catch (error) {
            console.error("이미지 삭제 실패: ", error);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("코멘트를 삭제하시겠습니까?")) return;

        try {
            await api.delete(`/api/comments/${commentId}`);
            fetchComments();
        } catch (error) {
            console.error("코멘트 삭제 실패: ", error);
        }
    };

    return (
        <div className="popup-comments">
            <div className="popup-comment-list">
                {comments.map((comment) => {
                    const isOwner = currentUserId != null && Number(comment.userId) === Number(currentUserId);
                    const isEditing = editingCommentId === comment.commentId;

                    return (
                        <div
                            key={comment.commentId}
                            className="popup-comment-row"
                            style={{
                                backgroundColor: hexToRgba(comment.penColor, 0.15),
                                borderColor: hexToRgba(comment.penColor, 0.55)
                            }}
                        >
                            <span className="popup-comment-dot" style={{ backgroundColor: comment.penColor }} />
                            <strong className="popup-comment-nickname">{comment.nickname}</strong>

                            {isEditing ? (
                                <>
                                    <input
                                        type="text"
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="popup-comment-edit-input"
                                        autoFocus
                                    />
                                    <span className="popup-comment-edit-actions">
                                        <button type="button" onClick={() => handleSaveComment(comment.commentId)}>저장</button>
                                        <button type="button" onClick={cancelEditComment}>취소</button>
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="popup-comment-text">{comment.content}</span>

                                    {comment.picture && (
                                        <span className="popup-comment-image-wrap">
                                            <img src={comment.picture} alt="첨부 이미지" className="popup-comment-image" />
                                            {isOwner && (
                                                <button
                                                    type="button"
                                                    className="popup-comment-image-delete"
                                                    onClick={() => handleDeleteCommentImage(comment.commentId, comment.content)}
                                                >
                                                    이미지 삭제
                                                </button>
                                            )}
                                        </span>
                                    )}

                                    {isOwner && (
                                        <span className="popup-comment-actions">
                                            <button type="button" onClick={() => startEditComment(comment)}>수정</button>
                                            <button type="button" onClick={() => handleDeleteComment(comment.commentId)}>삭제</button>
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            <form onSubmit={handleCreateComment} className="popup-comment-form">
                <input
                    type="text"
                    placeholder="코멘트 달기..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="popup-comment-input"
                />
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewImageFile(e.target.files[0] || null)}
                    className="popup-comment-file"
                />
                <button type="submit" className="popup-comment-submit">등록</button>
            </form>
        </div>
    );
};

export default CommentComponent;