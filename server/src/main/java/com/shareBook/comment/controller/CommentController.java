package com.shareBook.comment.controller;

import com.shareBook.comment.dto.CommentCreateRequestDto;
import com.shareBook.comment.dto.CommentResponseDto;
import com.shareBook.comment.dto.CommentUpdateRequestDto;
import com.shareBook.comment.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal; // 💡 어노테이션 추가
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    /**
     *  1. 댓글 등록 (특정 메모 하단에 댓글 작성 시)
     * POST /api/comments
     */
    @PostMapping
    public ResponseEntity<CommentResponseDto> createComment(
            @AuthenticationPrincipal UserDetails userDetails,
            @ModelAttribute CommentCreateRequestDto requestDto) { // 💡 @RequestBody -> @ModelAttribute

        Long userId = Long.valueOf(userDetails.getUsername());
        CommentResponseDto response = commentService.createComment(userId, requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 2. 특정 메모에 달린 댓글 리스트 조회 (메모 클릭 시 팝업에 보일 댓글창용)
     * GET /api/comments/memo/{memoId}
     */
    @GetMapping("/memo/{memoId}")
    public ResponseEntity<List<CommentResponseDto>> getCommentsByMemo(
            @PathVariable("memoId") Long memoId) {

        List<CommentResponseDto> responses = commentService.getCommentsByMemo(memoId);
        return ResponseEntity.ok(responses);
    }

    /**
     * 3. 댓글 수정
     * PUT /api/comments/{commentId}
     */
    @PutMapping("/{commentId}")
    public ResponseEntity<CommentResponseDto> updateComment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("commentId") Long commentId,
            @ModelAttribute CommentUpdateRequestDto requestDto) { // 💡 @RequestBody -> @ModelAttribute

        Long userId = Long.valueOf(userDetails.getUsername());
        CommentResponseDto response = commentService.updateComment(userId, commentId, requestDto);
        return ResponseEntity.ok(response);
    }

    /**
     * 4. 댓글 삭제
     * DELETE /api/comments/{commentId}
     */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("commentId") Long commentId) {

        Long userId = Long.valueOf(userDetails.getUsername());
        commentService.deleteComment(userId, commentId);
        return ResponseEntity.noContent().build(); // 204 No Content
    }

}