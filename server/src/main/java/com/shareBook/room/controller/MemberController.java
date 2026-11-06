package com.shareBook.room.controller;

import com.shareBook.config.JwtTokenProvider;
import com.shareBook.room.dto.member.JoinMemberRequestDTO;
import com.shareBook.room.dto.member.LeaveMemberRequestDTO;
import com.shareBook.room.dto.member.MemberResponseDTO;
import com.shareBook.room.dto.member.PenColorRequest;
import com.shareBook.room.entity.Member;
import com.shareBook.room.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/rooms")
public class MemberController {
    private final MemberService memberService;
    private final JwtTokenProvider jwtTokenProvider;

    //방으로 들어가기
    @PostMapping("/{roomId}/join")
    public ResponseEntity<Long> joinMemberApi(
            // TODO: 토큰 정보 받기
            @RequestHeader("Authorization")String authorization,
            @PathVariable Long roomId,
            @RequestBody JoinMemberRequestDTO dto
    ){
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("유효하지 않은 토큰 형식입니다.");
        }

        String token = authorization.substring(7);
        Long userId=Long.valueOf(jwtTokenProvider.getUserId(token));

        dto.setRoomId(roomId);
        Long id=memberService.JoinMember(userId,dto);
        return ResponseEntity.ok(id);
    }

    //방 나가기 소프트 삭제
    @DeleteMapping("/{roomId}/delete/{userId}")
    public ResponseEntity<String> leaveMemberApi(@PathVariable Long userId,@PathVariable Long roomId) {
        memberService.leaveMember(userId,roomId);
        return ResponseEntity.ok("방에서 나갔습니다.");
    }
    
    //스스로 방나가기 소프트 삭제
    @DeleteMapping("/{roomId}/leave")
    public ResponseEntity<String> leaveApi(@RequestHeader("Authorization")String authorization,@PathVariable Long roomId,@RequestBody(required = false)LeaveMemberRequestDTO dto){
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("유효하지 않은 토큰 형식입니다.");
        }

        String token = authorization.substring(7);
        Long userId=Long.valueOf(jwtTokenProvider.getUserId(token));

        Long memberId = (dto != null) ? dto.getMemberId() : null;
        memberService.leaveSelfMember(userId,roomId,memberId);
        return ResponseEntity.ok("스스로 방에서 나갔습니다.");
    }

    //방 삭제로 나가기 - 소프트
    @DeleteMapping("/{roomId}/end")
    public ResponseEntity<String> endMemberApi(@PathVariable Long roomId){
        memberService.endMember(roomId);
        return ResponseEntity.ok("방 삭제로 인해 방에서 나갔습니다.");
    }

    //방 친구 리스트 보여주기
    @GetMapping("/{roomId}/members")
    public ResponseEntity<List<MemberResponseDTO>> memberListApi(@PathVariable Long roomId) {
        return ResponseEntity.ok(memberService.getMember(roomId));
    }

    //색깔 변경
    @PatchMapping("/{roomId}/color")
    public ResponseEntity<MemberResponseDTO> upDateColorApi(@RequestHeader("Authorization")String authorization,@PathVariable Long roomId,@RequestBody PenColorRequest request){
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("유효하지 않은 토큰 형식입니다.");
        }

        String token = authorization.substring(7);
        Long userId=Long.valueOf(jwtTokenProvider.getUserId(token));

        Member member=memberService.upDateColor(userId,roomId, request.getPenColor());
        return ResponseEntity.ok(MemberResponseDTO.from(member));
    }
}
