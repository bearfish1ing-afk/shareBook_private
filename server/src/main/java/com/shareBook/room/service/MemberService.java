package com.shareBook.room.service;

import com.shareBook.room.dto.member.JoinMemberRequestDTO;
import com.shareBook.room.dto.member.LeaveMemberRequestDTO;
import com.shareBook.room.dto.member.MemberResponseDTO;
import com.shareBook.room.entity.*;
import com.shareBook.room.repository.MemberRepository;
import com.shareBook.room.repository.RoomBookRepository;
import com.shareBook.room.repository.RoomRepository;
import com.shareBook.user.entity.User;
import com.shareBook.user.repostiory.UserRepository;
import com.shareBook.userbook.service.UserBookService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.swing.text.html.Option;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MemberService {
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final MemberRepository memberRepository;
    private final UserBookService userBookService;
    private final RoomService roomService;

    //방 안 사용자 존재여부 확인
    @Transactional
    public boolean existUser(Long userId,Long roomId){
        return memberRepository.existsByUserIdAndRoomId(userId, roomId);
    }

    @Transactional
    public Long getMemberIdByUserId(Long userId, Long roomId) {
        Member member = memberRepository.findByUserIdAndRoomId(userId, roomId)
                .orElseThrow(()-> new IllegalArgumentException("이 방에 없는 유저입니다."));
        return member.getId();
    }

    //방으로 들어가기
    @Transactional
    public Long JoinMember(Long userId, JoinMemberRequestDTO dto){
        Room room=roomRepository.findById(dto.getRoomId())
                .orElseThrow(()->new IllegalArgumentException("방 없음"));

        //invitecode를 하고싶을 경우
        if(!room.getJoinCode().equals(dto.getJoinCode())){
            throw new IllegalArgumentException("초대 코드가 틀렸습니다.");
        }

        if(memberRepository.countByRoomIdAndStatus(dto.getRoomId(), MemberStatus.ACTIVE) >= 6){
            throw new IllegalArgumentException("방이 꽉 찼습니다.");
        }

        if(memberRepository.existsByRoomIdAndPenColorAndStatus(dto.getRoomId(), dto.getPenColor(), MemberStatus.ACTIVE)){
            throw new IllegalArgumentException("이미 사용중인 색입니다.");
        }

        //재입장 확인
        Optional<Member> existing = memberRepository.findByUserIdAndRoomId(userId, dto.getRoomId());
        if (existing.isPresent()) {
            Member member = existing.get();
            if (member.getStatus() == MemberStatus.ACTIVE) {
                throw new IllegalArgumentException("이미 방에 존재합니다.");
            }
            member.reactivate(dto.getPenColor());
            return member.getId();
        }

        //사용자 존재여부 확인
        User user=userRepository.findById(userId)
                .orElseThrow(()->new IllegalArgumentException("사용자 없음"));

        Member entity= Member.builder()
                .user(user)
                .room(room)
                .role(MemberRole.MEMBER)
                .penColor(dto.getPenColor())
                .status(MemberStatus.ACTIVE)
                .build();
        room.addMember(entity);

        userBookService.addRoomBooksToUser(user,room);
        return memberRepository.save(entity).getId();
    }
    //스스로 방 나가기
    @Transactional
    public void leaveSelfMember(Long userId, Long roomId,Long memberId){
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("방 없음"));

        if (room.getOwnerId().equals(userId)) {
            if (memberId== null) {
                throw new IllegalArgumentException("방장은 나가기 전에 다음 방장을 지정해야 합니다.");
            }
            if (memberId.equals(userId)) {
                throw new IllegalArgumentException("자기 자신에게는 위임할 수 없습니다.");
            }

            roomService.updateRoomOwner(roomId, userId, memberId);
        }
        memberRepository.endPersonMemberRoom(userId,roomId);
    }

    //방장이 내보내기 소프트 삭제
    @Transactional
    public void leaveMember(Long userId, Long roomId){
        memberRepository.endPersonMemberRoom(userId,roomId);
    }

    //방 종료 시 나가기 소프트 삭제
    @Transactional
    public void endMember(Long roomId){
        memberRepository.endMemberRoom(roomId);
    }

    //방 친구 리스트 보여주기
    @Transactional
    public List<MemberResponseDTO> getMember(Long roomId){
        return memberRepository.findByRoomIdAndStatus(roomId,MemberStatus.ACTIVE).stream()
                .map(MemberResponseDTO::from)
                .toList();
    }

    //색깔 변경가능
    @Transactional
    public Member upDateColor(Long userId,Long roomId,String penColor){
        Member entity=memberRepository.findByUserIdAndRoomId(userId,roomId)
                .orElseThrow(()->new IllegalArgumentException("방에 존재하지 않은 사용자입니다."));

        if(memberRepository.existsByRoomIdAndPenColor(roomId,penColor)){
            throw new IllegalArgumentException("이미 사용중인 색입니다.");
        }
        entity.updateColor(penColor);

        return entity;
    }
}
