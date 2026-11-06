package com.shareBook.highlight.controller;

import com.shareBook.config.JwtTokenProvider;
import com.shareBook.highlight.dto.HighlightCreateRequestDTO;
import com.shareBook.highlight.dto.HighlightResponseDTO;
import com.shareBook.highlight.service.HighlightService;
import com.shareBook.room.dto.ApiResponse;
import com.shareBook.room.service.MemberService;
import jakarta.validation.constraints.Null;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/highlight")
public class HighlightController {
    private final HighlightService highlightService;
    private final JwtTokenProvider jwtTokenProvider;
    private final MemberService memberService;

    @PostMapping
    ResponseEntity<HighlightResponseDTO.ForEpub> createHighlight(
            @RequestHeader("Authorization")String authorization,
            @RequestBody HighlightCreateRequestDTO requestDto
    ){
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("유효하지 않은 토큰 형식입니다.");
        }

        String token = authorization.substring(7);
        Long userId=Long.valueOf(jwtTokenProvider.getUserId(token));
        return ResponseEntity.ok(highlightService.createHighlight(
                userId, requestDto.getRoomBookId(), requestDto.getCfi(),
                requestDto.getContent()));
    }

    // 특정 룸북의 모든 하이라이트 조회
    @GetMapping("/{roomBookId}")
    ResponseEntity<List<HighlightResponseDTO.ForEpub>> getHighlightByRoomBook(
            @RequestHeader("Authorization")String authorization,
            @PathVariable("roomBookId") Long roomBookId
    ) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("유효하지 않은 토큰 형식입니다.");
        }

        String token = authorization.substring(7);
        Long userId=Long.valueOf(jwtTokenProvider.getUserId(token));
        return ResponseEntity.ok(highlightService.getHighlightByRoomBook(userId, roomBookId));

    }

    // 특정 룸북에서 특정 멤버가 쓴 하이라이트만 조회
    @GetMapping("/{roomBookId}/member")
    ResponseEntity<List<HighlightResponseDTO.ForEpub>> getHighlightByRoomBookIdAndMember(
            @RequestHeader("Authorization")String authorization,
            @PathVariable("roomBookId") Long roomBookId
    ) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("유효하지 않은 토큰 형식입니다.");
        }

        String token = authorization.substring(7);
        Long userId=Long.valueOf(jwtTokenProvider.getUserId(token));
        return ResponseEntity.ok(highlightService.getHighlightByRoomBookIdAndMember(userId, roomBookId));

    }

    // 특정 유저가 쓴 모든 하이라이트 조회
    @GetMapping("/users")
    ResponseEntity<List<HighlightResponseDTO.ForUserScrap>> getHighlightByMember(
            @RequestHeader("Authorization")String authorization
    ) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("유효하지 않은 토큰 형식입니다.");
        }

        String token = authorization.substring(7);
        Long userId=Long.valueOf(jwtTokenProvider.getUserId(token));
        return ResponseEntity.ok(highlightService.getHighlightByMember(userId));
    }

    //roomDetail 페이지용 해당 방의 가장 최신 스크랩
    @GetMapping("/{roomId}/latest")
    ResponseEntity<HighlightResponseDTO.ForRoomMain> getLatestHighlight(
            @RequestHeader("Authorization")String authorization,
            @PathVariable("roomId") Long roomId
    ) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("유효하지 않은 토큰 형식입니다.");
        }

        String token = authorization.substring(7);
        Long userId=Long.valueOf(jwtTokenProvider.getUserId(token));
        return ResponseEntity.ok(highlightService.getLatestHighlightForRoomMain(userId, roomId));
    }

    @GetMapping("/userCount")
    ResponseEntity<Long> getUsersHighLightCount(
            @RequestHeader("Authorization")String authorization
    ){
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("유효하지 않은 토큰 형식입니다.");
        }

        String token = authorization.substring(7);
        Long userId=Long.valueOf(jwtTokenProvider.getUserId(token));
        return ResponseEntity.ok(highlightService.getHighlightCountByMember(userId));
    }

    // 하이라이트 삭제
    @DeleteMapping("/{highlightId}")
    ResponseEntity<ApiResponse<Void>> deleteHighlight(
            @RequestHeader("Authorization")String authorization,
            @PathVariable("highlightId")Long highlightId
    ) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("유효하지 않은 토큰 형식입니다.");
        }

        String token = authorization.substring(7);
        Long userId=Long.valueOf(jwtTokenProvider.getUserId(token));
        highlightService.deleteHighlight(userId, highlightId);
        return ResponseEntity.ok(ApiResponse.success("삭제 완료", null));
    }
}

