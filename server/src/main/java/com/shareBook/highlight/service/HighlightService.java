package com.shareBook.highlight.service;

import com.shareBook.highlight.dto.HighlightCreateRequestDTO;
import com.shareBook.highlight.dto.HighlightResponseDTO;
import com.shareBook.highlight.entity.Highlight;
import com.shareBook.highlight.repository.HighlightRepository;
import com.shareBook.room.entity.Member;
import com.shareBook.room.entity.RoomBook;
import com.shareBook.room.repository.MemberRepository;
import com.shareBook.room.repository.RoomBookRepository;
import com.shareBook.user.repostiory.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HighlightService {
    private final RoomBookRepository roomBookRepository;
    private final MemberRepository memberRepository;
    private final UserRepository userRepository;
    private final HighlightRepository highlightRepository;

    @Transactional
    public HighlightResponseDTO.ForEpub createHighlight(Long userId, Long roomBookId, String cfi, String content){
        RoomBook roomBook = roomBookRepository.findById(roomBookId)
                .orElseThrow(() -> new RuntimeException("해당 방의 도서 정보를 찾을 수 없습니다."));

        Long roomId = roomBook.getRoom().getId();

        Member member = memberRepository.findByUserIdAndRoomId(userId, roomId)
                .orElseThrow(() -> new RuntimeException("해당 독서 방의 참여 멤버가 아닙니다. 접근 권한이 없습니다."));

        Highlight highlight = Highlight.builder()
                .roomBook(roomBook)
                .cfi(cfi)
                .content(content)
                .member(member)
                .build();
        Highlight savedHighlight = highlightRepository.save(highlight);
        return HighlightResponseDTO.ForEpub.from(savedHighlight);
    }

    // 특정 룸북의 모든 하이라이트 조회
    public List<HighlightResponseDTO.ForEpub> getHighlightByRoomBook(Long userId, Long roomBookId) {
        RoomBook roomBook = roomBookRepository.findById(roomBookId)
                .orElseThrow(()->new IllegalArgumentException("해당하는 방의 책 정보가 없습니다."));
        Long roomId = roomBook.getRoom().getId();
        boolean isMember = memberRepository.existsByUserIdAndRoomId(userId, roomId);
        if (!isMember){
            throw new IllegalArgumentException("멤버가 아님");
        }
        List<Highlight> highlights = highlightRepository.findAllByRoomBookId(roomBookId);
        return highlights.stream()
                .map(HighlightResponseDTO.ForEpub::from)
                .toList();
    }

    // 특정 룸북에서 특정 멤버가 쓴 하이라이트만 조회
    public List<HighlightResponseDTO.ForEpub> getHighlightByRoomBookIdAndMember(Long userId, Long roomBookId) {
        RoomBook roomBook = roomBookRepository.findById(roomBookId)
                .orElseThrow(()->new IllegalArgumentException("해당하는 방의 책 정보가 없습니다."));
        Long roomId = roomBook.getRoom().getId();
        Member member = memberRepository.findByUserIdAndRoomId(userId, roomId)
                .orElseThrow(()->new IllegalArgumentException("해당 방의 멤버가 아님"));
        List<Highlight> highlights = highlightRepository.findAllByRoomBookIdAndMemberId(roomBookId, member.getId());
        return highlights.stream()
                .map(HighlightResponseDTO.ForEpub::from)
                .toList();
    }

    // 특정 유저가 쓴 모든 하이라이트 조회
    public List<HighlightResponseDTO.ForUserScrap> getHighlightByMember(Long userId) {
        List<Long> memberIds = memberRepository.findAllByUserId(userId).stream()
                .map(Member::getId)
                .toList();
        if (memberIds.isEmpty()) return Collections.emptyList();

        List<Highlight> highlights = highlightRepository.findAllByMemberIdIn(memberIds);

        return highlights.stream()
                .map(HighlightResponseDTO.ForUserScrap::from)
                .toList();
    }

    public HighlightResponseDTO.ForRoomMain getLatestHighlightForRoomMain(Long userId, Long roomId) {
        // 접근 권한 체크 먼저 해주고
        boolean isMember = memberRepository.existsByUserIdAndRoomId(userId, roomId);
        if (!isMember) {
            throw new IllegalArgumentException("해당 방의 멤버가 아닙니다.");
        }

        Highlight latestHighlight = highlightRepository.findLatestValidHighlight(roomId)
                .orElse(null); // 아직 아무도 스크랩 안 했을 수 있으니 null 허용 혹은 기본 가이드 문구 처리

        if (latestHighlight == null) return null;

        return HighlightResponseDTO.ForRoomMain.from(latestHighlight);
    }

    // 하이라이트 삭제
    @Transactional
    public void deleteHighlight(Long userId, Long highlightId) {
        Highlight highlight = highlightRepository.findById(highlightId)
                .orElseThrow(()->new IllegalArgumentException("해당 하이라이트 정보가 없습니다"));
        List<Long> memberIds = memberRepository.findAllByUserId(userId).stream()
                .map(Member::getId)
                .toList();
        boolean isRightHighlight = highlightRepository.existsByHighlightIdAndMemberIdIn(highlightId, memberIds);
        if (!isRightHighlight) {throw new IllegalArgumentException("하이라이트를 쓴 사람만 삭제 가능");}
        highlightRepository.delete(highlight);

    }

    // 유저별 하이라이트 개수세기
    public long getHighlightCountByMember(Long userId) {
        // 해당 유저가 참여 중인 모든 독서방의 Member ID 리스트 추출
        List<Long> memberIds = memberRepository.findAllByUserId(userId).stream()
                .map(Member::getId)
                .toList();

        if (memberIds.isEmpty()) return 0L;
        return highlightRepository.countByMemberIdIn(memberIds);
    }
}
