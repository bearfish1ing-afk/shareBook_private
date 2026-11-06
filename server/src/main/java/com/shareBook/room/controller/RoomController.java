package com.shareBook.room.controller;

import com.shareBook.config.JwtTokenProvider;
import com.shareBook.room.dto.*;
import com.shareBook.room.dto.room.*;
import com.shareBook.room.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/rooms")
public class RoomController {
    private final RoomService roomService;

    @PostMapping
    public ResponseEntity<ApiResponse<RoomCreateResponseDTO>> createRoom(
            // TODO: JWT 토큰에서 User id 받아오기
            @AuthenticationPrincipal UserDetails userDetails,
            @Validated @RequestBody RoomCreateRequestDTO request
    ) {
        Long userId=Long.valueOf(userDetails.getUsername());
        RoomCreateResponseDTO response = roomService.createRoom(userId, request);
        return ResponseEntity.ok(ApiResponse.success("방 생성 성공", response));
    }

    //    @GetMapping
    //    public ResponseEntity<ApiResponse<List<RoomListResponseDTO>>> getAllRooms() {
    //        List<RoomListResponseDTO> rooms = roomService.getAllRooms();
    //        return ResponseEntity.ok(ApiResponse.success("조회되었습니다.", rooms));
    //    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<RoomListResponseDTO>>> getMyRooms(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long userId=Long.valueOf(userDetails.getUsername());
        List<RoomListResponseDTO> rooms = roomService.getMyRooms(userId);
        return ResponseEntity.ok(ApiResponse.success("참여중인 방 조회되었습니다.", rooms));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<RoomDetailResponseDTO>> getRoomByCode(@RequestParam String code) {
        RoomDetailResponseDTO room = roomService.getRoomByJoinCode(code);
        return ResponseEntity.ok(ApiResponse.success("초대코드 조회되었습니다.", room));
    }

    //관리자용
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomDetailResponseDTO>> getRoomById(@PathVariable Long id) {
        RoomDetailResponseDTO room = roomService.getRoomById(id);
        return ResponseEntity.ok(ApiResponse.success("id로 조회되었습니다.", room));
    }

    // 방만들기 헬퍼함수(방제목 생성)
    @GetMapping("/recommend-name")
    private ResponseEntity<String> generateRoomname() {
        return ResponseEntity.ok(roomService.generateRoomname());
    }

    @PatchMapping("/{roomId}/update-owner")
    private ResponseEntity<ApiResponse<RoomDetailResponseDTO>> updateRoomOwner(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long roomId,
            @RequestBody OwnerUpdateRequestDTO requestDTO // 바꿀 멤버의 유저아이디
    ) {
        Long userId=Long.valueOf(userDetails.getUsername());
        RoomDetailResponseDTO response = roomService.updateRoomOwner(roomId, userId, requestDTO.userId());
        return ResponseEntity.ok(ApiResponse.success("방장 변경 완료", response));
    }

    @PatchMapping("/{roomId}/update-name")
    private ResponseEntity<ApiResponse<RoomDetailResponseDTO>> updateRoomName(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long roomId,
            @RequestBody NameUpdateRequestDTO requestDTO
    ) {
        Long userId=Long.valueOf(userDetails.getUsername());
        RoomDetailResponseDTO response = roomService.updateRoomName(roomId, userId, requestDTO.name());
        return ResponseEntity.ok(ApiResponse.success("방 이름 변경 완료", response));
    }

    @DeleteMapping("/{roomId}")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(@PathVariable("roomId") Long roomId){
        roomService.deleteRoom(roomId);
        return ResponseEntity.ok(ApiResponse.success("삭제 완료", null));
    }


}
