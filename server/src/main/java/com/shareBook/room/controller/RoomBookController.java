package com.shareBook.room.controller;

import com.shareBook.config.JwtTokenProvider;
import com.shareBook.room.dto.ApiResponse;
import com.shareBook.room.dto.roombook.RoomBookAddRequestDTO;
import com.shareBook.room.dto.roombook.RoomBookDeleteRequestDTO;
import com.shareBook.room.dto.roombook.RoomBookDetailResponseDTO;
import com.shareBook.room.dto.roombook.RoomBookResponseDTO;
import com.shareBook.room.service.MemberService;
import com.shareBook.room.service.RoomBookService;
import com.shareBook.room.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/rooms")
public class RoomBookController {
    private final RoomBookService roomBookService;
    private final JwtTokenProvider jwtTokenProvider;
    private final MemberService memberService;

    // 전체조회
    @GetMapping("/{roomId}/books")
    public ResponseEntity<List<RoomBookResponseDTO>> getAllBooks(@PathVariable("roomId") Long roomId) {
        return ResponseEntity.ok(roomBookService.findAll(roomId));
    }


//    @GetMapping("/{roomId}/books/{bookId}")
//    public ResponseEntity<RoomBookResponseDTO> getAllBooks(@PathVariable("roomId") Long roomId, @PathVariable("bookId") Long bookId) {
//        return ResponseEntity.ok(roomBookService.findBookByRoomIdAndBookId(roomId, bookId));
//    }

    @GetMapping("/{roomId}/books/{roomBookId}")
    public ResponseEntity<RoomBookDetailResponseDTO> getRoomBookById(
            @RequestHeader("Authorization")String authorization,
            @PathVariable("roomId") Long roomId,
            @PathVariable("roomBookId") Long roomBookId
    ) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("유효하지 않은 토큰 형식입니다.");
        }

        String token = authorization.substring(7);
        Long userId=Long.valueOf(jwtTokenProvider.getUserId(token));
        return ResponseEntity.ok(roomBookService.findRoomBookById(roomBookId, roomId, userId));
    }


    // 책 추가
    @PostMapping("/{roomId}/books")
    public ResponseEntity<RoomBookResponseDTO> addBookToRoom(
            @RequestHeader("Authorization")String authorization,
            @PathVariable("roomId") Long roomId,
            @RequestBody RoomBookAddRequestDTO requestDTO
            ) {

        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("유효하지 않은 토큰 형식입니다.");
        }

        String token = authorization.substring(7);
        Long userId=Long.valueOf(jwtTokenProvider.getUserId(token));

        Long bookId = requestDTO.bookId();
        return ResponseEntity.ok(roomBookService.addBook(userId, roomId, bookId));
    }

//    // 상태별 조회
//    @GetMapping(value = "/{roomId}/books", params = "status")
//    public ResponseEntity<List<RoomBookResponseDTO>> getBooksByStatus(
//            @PathVariable("roomId") Long roomId,
//            @RequestParam String status) {
//        return ResponseEntity.ok(roomBookService.findByRoomIdAndStatus(roomId, status));
//    }

    @GetMapping(value = "/{roomId}/booklist")
    public ResponseEntity<List<RoomBookResponseDTO>> getBookList(
            @PathVariable("roomId") Long roomId
    ) {
        return ResponseEntity.ok(roomBookService.findByRoomIdAndDeleted(roomId));
    }


    // 완독처리
    @PatchMapping("/{roomId}/books/complete")
    public ResponseEntity<RoomBookResponseDTO> completeBook(
            @RequestHeader("Authorization")String authorization,
            @PathVariable("roomId") Long roomId,
            @RequestBody RoomBookAddRequestDTO requestDTO) {

        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("유효하지 않은 토큰 형식입니다.");
        }

        String token = authorization.substring(7);
        Long userId=Long.valueOf(jwtTokenProvider.getUserId(token));

        return ResponseEntity.ok(roomBookService.completeBook(roomId, requestDTO.bookId(), userId));
    }

    @DeleteMapping("/{roomId}/{roomBookId}/delete")
    public ResponseEntity<ApiResponse<Void>> deleteRoomBook(
            @RequestHeader("Authorization")String authorization,
            @PathVariable("roomId") Long roomId,
            @PathVariable("roomBookId") Long roomBookId
    ) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("유효하지 않은 토큰 형식입니다.");
        }

        String token = authorization.substring(7);
        Long userId=Long.valueOf(jwtTokenProvider.getUserId(token));
        roomBookService.deleteRoomBook(userId, roomId, roomBookId);
        return ResponseEntity.ok(ApiResponse.success("삭제 완료", null));
    }
}
