package com.shareBook.memo.controller;

import com.shareBook.memo.dto.MemoCreateRequestDto;
import com.shareBook.memo.dto.MemoResponseDto;
import com.shareBook.memo.dto.MemoUpdateRequestDto;
import com.shareBook.memo.service.MemoService;
import com.shareBook.user.dto.UserNameProfileResponse;
import com.shareBook.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal; // 💡 어노테이션 추가
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/memos")
@RequiredArgsConstructor
public class MemoController {

    private final MemoService memoService;
    /**
     *  1. 메모 등록 (드래그 후 메모 저장 버튼 클릭 시)
     * POST /api/memos
     */
    @PostMapping
    public ResponseEntity<MemoResponseDto> createMemo(
            @AuthenticationPrincipal UserDetails userDetails, // 💡 시큐리티가 토큰 까서 유저 정보 바로 주입!
            @ModelAttribute MemoCreateRequestDto requestDto) {

        // userDetails 내부에서 회원 식별자(PK)를 꺼내서 서비스로 토스
        Long userId = Long.valueOf(userDetails.getUsername());

        MemoResponseDto response = memoService.createMemo(userId, requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 2. 특정 책방 도서에 달린 모든 메모 목록 조회 (책방 입장 및 페이지 로딩 시)
     * GET /api/memos/room-book/{roomBookId}
     */
    @GetMapping("/room-book/{roomBookId}")
    public ResponseEntity<List<MemoResponseDto>> getMemosByRoomBook(
            @PathVariable("roomBookId") Long roomBookId) {

        List<MemoResponseDto> responses = memoService.getMemosByRoomBook(roomBookId);
        return ResponseEntity.ok(responses);
    }

    /**
     * 3. 메모 수정
     * PUT /api/memos/{memoId}
     */
    @PutMapping("/{memoId}")
    public ResponseEntity<MemoResponseDto> updateMemo(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("memoId") Long memoId,
            @ModelAttribute MemoUpdateRequestDto requestDto) {

        Long userId = Long.valueOf(userDetails.getUsername());
        MemoResponseDto response = memoService.updateMemo(userId, memoId, requestDto);

        return ResponseEntity.ok(response);
    }

    /**
     * 4. 메모 삭제
     * DELETE /api/memos/{memoId}
     */
    @DeleteMapping("/{memoId}")
    public ResponseEntity<Void> deleteMemo(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("memoId") Long memoId) {

        Long userId = Long.valueOf(userDetails.getUsername());
        memoService.deleteMemo(userId, memoId);

        return ResponseEntity.noContent().build(); // 204 No Content 반환
    }
}