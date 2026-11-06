package com.shareBook.room.service;


import com.shareBook.book.service.S3Service;
import com.shareBook.room.dto.room.RoomCreateRequestDTO;
import com.shareBook.room.dto.room.RoomCreateResponseDTO;
import com.shareBook.room.dto.room.RoomDetailResponseDTO;
import com.shareBook.room.dto.room.RoomListResponseDTO;
import com.shareBook.room.entity.Member;
import com.shareBook.room.entity.MemberRole;
import com.shareBook.room.entity.MemberStatus;
import com.shareBook.room.entity.Room;
import com.shareBook.room.repository.MemberRepository;
import com.shareBook.user.entity.User;
import com.shareBook.room.repository.RoomRepository;
import com.shareBook.user.repostiory.UserRepository;
import com.shareBook.userbook.service.UserBookService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/*
    TODO:
        1. getAllRooms 관리자용으로 커스텀 - 이거는 나중에 ..
        2. 혹시모를 색상코드 틀린경우 예외처리
        3. 방 생성이랑 방제 네이밍 분리하기(네이밍이 우선되어야 함) v
        4. url 프론트엔드 링크로 발급하도록 만들기 v

 */

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomService {
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final MemberRepository memberRepository;
    private final UserBookService userBookService;
    private final S3Service s3Service;
    @Value("${app.frontend-url}")
    private String frontendUrl;

    // TODO: 멤버 레포지토리 선언 추가

    // 자동 방제 네이밍용 리스트
    private final List<String> preword = List.of(
            "똑똑한", "비밀의", "진지한", "춤바람난", "조용한", "비장한", "엄격한", "과감한", "멋진"
    );
    private final List<String> nouns = List.of(
            "서재", "책모임", "공유독서방", "독서단", "문장 수집가들", "필사가들", "천재들", "친구들", "공주님들"
    );

    // 1. 방 만들기
    @Transactional
    public RoomCreateResponseDTO createRoom(Long userId, RoomCreateRequestDTO request) {
        // 멤버 추가용 유저 여부 검증
        User user = userRepository.findById(userId)
                .orElseThrow(()-> new IllegalArgumentException(("존재하지 않는 유저입니다. 로그인해주세요. ")));


        // 이름이 비었을 때는 자동 생성..
        String roomName = (request.getName()==null || request.getName().isBlank()) ? generateRoomname() : request.getName();
        String joinCode = generateJoinCode();
        Room room = Room.builder()
                .name(roomName)
                .joinCode(joinCode)
                .ownerId(userId)
                .build();

        Room savedRoom = roomRepository.save(room);

        Member owner = Member.builder()
                .room(savedRoom)
                .user(user)
                .penColor((request.getPenColor()))
                .role(MemberRole.HOST)
                .build();
        memberRepository.save(owner);

        return RoomCreateResponseDTO.builder()
                .roomId(savedRoom.getId())
                .name(savedRoom.getName())
                .joinCode(savedRoom.getJoinCode())
                .inviteUrl(generateJoinUrl(savedRoom.getJoinCode()))
                .build();
    }

    // 방만들기 헬퍼함수(초대코드 생성)
    private String generateJoinCode() {
        String chars = IntStream.concat(
                        IntStream.rangeClosed('A', 'Z'),
                        IntStream.concat(
                                IntStream.rangeClosed('a', 'z'),
                                IntStream.rangeClosed('0', '9')
                        )
                )
                .filter(c -> c != 'O' && c != 'o' && c != '0') //헷갈릴만한 문자 제외
                .mapToObj(c -> String.valueOf((char) c))
                .collect(Collectors.joining());

        SecureRandom random = new SecureRandom();
        String code;
        do {
            code = IntStream.range(0, 6)
                    .map(i -> random.nextInt(chars.length()))
                    .mapToObj(chars::charAt)
                    .map(Object::toString)
                    .collect(Collectors.joining());
        } while (roomRepository.existsByJoinCode(code)); //중복생성 체크
        return code;
    }

    //방 제목 생성 함수
    public String generateRoomname() {
        Random random = new Random();
        String adj = preword.get(random.nextInt(preword.size()));
        String noun = nouns.get(random.nextInt(nouns.size()));
        return adj+" "+noun;
    }


    // 모든 방 조회
//    @Transactional(readOnly = true)
//    public List<RoomListResponseDTO> getAllRooms() {
//
//        return roomRepository.findAll().stream()
//                .map(room -> RoomListResponseDTO.from(room))
//                .toList();
//    }


    public RoomDetailResponseDTO getRoomById(Long roomId) {
        Room room = roomRepository.findDetailById(roomId)
                .orElseThrow(()->new IllegalArgumentException("방을 찾을 수 없어요"));
        List<Member> members = memberRepository.findByRoomIdAndStatus(roomId, MemberStatus.ACTIVE);
        return RoomDetailResponseDTO.from(room, members,s3Service);
    }


    public RoomDetailResponseDTO getRoomByJoinCode(String joinCode) {
        Room room = roomRepository.findByJoinCodeWithDetails(joinCode)
                .orElseThrow(()->new IllegalArgumentException("유효하지 않은 초대코드에요."));
        List<Member> members = memberRepository.findAllByRoomIdAndStatusWithUser(room.getId(), MemberStatus.ACTIVE);
        return RoomDetailResponseDTO.from(room, members,s3Service);
    }

    public List<RoomListResponseDTO> getMyRooms(Long userId) {
        return roomRepository.findAllByMembersUserIdAndMembersStatus(userId,MemberStatus.ACTIVE).stream()
                .map(room -> RoomListResponseDTO.from(room, userId))
                .toList();
    }

    private String generateJoinUrl(String joinCode){
        return frontendUrl+ "/invite?code=" +joinCode;
    }

    // 방장 변경 메소드
    @Transactional
    public RoomDetailResponseDTO updateRoomOwner(Long roomId, Long userId, Long memberUserId) {
        //1. 이 방의 ownerId 인지 검증
        Room room = roomRepository.findByOwnerIdAndId(userId, roomId)
                .orElseThrow(()->new IllegalArgumentException("방장 변경 권한이 없거나 존재하지 않는 방"));

        //2. 멤버 존재 여부 확인
        Member member = memberRepository.findByUserIdAndRoomIdAndStatus(memberUserId, roomId, MemberStatus.ACTIVE)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 멤버이거나 이 방의 멤버가 아님"));

        //4. 업데이트(방 ownerId 변경, memberRole 변경 / 기존 방장은 강등)
        Member ownerMember = memberRepository.findByUserIdAndRoomIdAndStatus(userId, roomId, MemberStatus.ACTIVE)
                .orElseThrow();
        ownerMember.updateRole(MemberRole.MEMBER);
        member.updateRole(MemberRole.HOST);
        room.updateOwnerId(member.getUser().getId());
        return RoomDetailResponseDTO.from(room, room.getMembers(),s3Service);
    }

    @Transactional
    public RoomDetailResponseDTO updateRoomName(Long roomId, Long userId, String name) {
        // 멤버 존재 여부 확인
        Room room = roomRepository.findById(roomId)
                .orElseThrow(()->new IllegalArgumentException("존재하지 않는 방"));
        boolean isMember = memberRepository.existsByUserIdAndRoomIdAndStatus(userId, roomId,MemberStatus.ACTIVE);
        if (!isMember){
            throw new IllegalArgumentException("존재하지 않는 멤버 or 이 방의 멤버가 아님");
        }

        // 업데이트
        room.updateRoomName(name);
        return RoomDetailResponseDTO.from(room, room.getMembers(),s3Service);
    }

    @Transactional
    public void deleteRoom(Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("방이 존재하지 않습니다."));
        if (room.getMembersCount()!=0) {throw new IllegalArgumentException("멤버를 다 내보낸 후 방을 삭제해주세요."); }
        userBookService.markAllRoomBookSuspended(roomId);
        roomRepository.delete(room);
    }
}
