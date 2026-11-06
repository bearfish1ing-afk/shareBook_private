package com.shareBook.comment.service;

import com.shareBook.comment.dto.CommentCreateRequestDto;
import com.shareBook.comment.dto.CommentResponseDto;
import com.shareBook.comment.dto.CommentUpdateRequestDto;
import java.util.List;

public interface CommentService {
    // 코멘트 작성
    CommentResponseDto createComment(Long userId, CommentCreateRequestDto requestDto);

    // 특정 메모에 달린 모든 코멘트 과거순 조회
    List<CommentResponseDto> getCommentsByMemo(Long memoId);

    CommentResponseDto updateComment(Long userId, Long commentId, CommentUpdateRequestDto requestDto);
    void deleteComment(Long userId, Long commentId);

}