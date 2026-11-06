package com.shareBook.memo.service;

import com.shareBook.book.service.S3Service;
import com.shareBook.memo.dto.MemoCreateRequestDto;
import com.shareBook.memo.dto.MemoResponseDto;
import com.shareBook.memo.dto.MemoUpdateRequestDto;
import com.shareBook.memo.entity.Memo;
import com.shareBook.memo.repository.MemoRepository;
import com.shareBook.room.entity.Member;
import com.shareBook.room.entity.RoomBook;
import com.shareBook.room.repository.MemberRepository;
import com.shareBook.room.repository.RoomBookRepository;
import com.shareBook.user.dto.UserNameProfileResponse;
import com.shareBook.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemoServiceImpl implements MemoService {

    private final MemoRepository memoRepository;
    private final MemberRepository memberRepository;
    private final RoomBookRepository roomBookRepository;
    private final S3Service s3Service;

    // 📸 실제 파일 업로드를 수행할 컴포넌트를 주입받습니다. (예: S3Service 혹은 로컬 업로더)
    // private final FileStorageService fileStorageService;

    /**
     * 1. 메모 작성 (Create) - 이미지 업로드 연동
     */
    @Override
    @Transactional
    public MemoResponseDto createMemo(Long userId, MemoCreateRequestDto requestDto) {
        // 1. RoomBook, Book 로딩
        RoomBook roomBook = roomBookRepository.findById(requestDto.getRoomBookId())
                .orElseThrow(() -> new RuntimeException("해당 방의 도서 정보를 찾을 수 없습니다."));

        // 2. RoomBook 엔티티 내에 선언된 Room 객체의 ID 추출
        Long roomId = roomBook.getRoom().getId();

        // 3. 인증 검증: 토큰의 userId와 추출한 roomId로 방 멤버(Member) 정보 확보
        Member member = memberRepository.findByUserIdAndRoomId(userId, roomId)
                .orElseThrow(() -> new RuntimeException("해당 독서 방의 참여 멤버가 아닙니다. 접근 권한이 없습니다."));

        // 이미지 파일 업로드 처리
        String uploadedImageUrl = null;
        MultipartFile imageFile = requestDto.getPicture();
        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                uploadedImageUrl= s3Service.uploadMemoImage(imageFile);
            }catch(IOException e){
                throw new RuntimeException(e);
            }
//            String extension= originalFilename.substring(originalFilename.lastIndexOf("."));
//
//            String savedFilename= UUID.randomUUID().toString()+extension;
//
//            uploadedImageUrl = "https://x.com/LightBobe/status/1269537968814866433/photo/1";
//            // uploadedImageUrl = fileStorageService.upload(imageFile); // 👈 물리 저장 후 S3/서버 URL 리턴받기
//            //uploadedImageUrl = "https://your-s3-bucket.s3.amazonaws.com/memos/" + savedFilename; // 테스트용 임시 mock 데이터
        }

        // 4. 엔티티 생성 및 저장 (가공된 String URL 주입)
        Memo memo = Memo.builder()
                .roomBook(roomBook)
                .member(member)
                .cfi(requestDto.getCfi())
                .content(requestDto.getContent())
                .picture(uploadedImageUrl) // 파일 경로 스트링 저장
                .build();

        Memo savedMemo = memoRepository.save(memo);

        // 5. 프론트엔드로 전달할 DTO 치환
        return MemoResponseDto.from(savedMemo,s3Service);
    }

    /**
     * 2. 특정 책에 달린 메모 전체 조회 (Read)
     */
    @Override
    public List<MemoResponseDto> getMemosByRoomBook(Long roomBookId) {
        List<Memo> memos = memoRepository.findAllWithMember(roomBookId);

        return memos.stream()
                .map(memo -> MemoResponseDto.from(memo,s3Service))
                .collect(Collectors.toList());
    }

    /**
     * 3. 메모 및 이미지 수정 (Update) - 완벽한 분기 처리 및 N+1 최적화
     */
    @Override
    @Transactional
    public MemoResponseDto updateMemo(Long userId, Long memoId, MemoUpdateRequestDto requestDto) {
        // 💡 findById 대신 페치 조인 메서드 호출 (쿼리 1번만 수행)
        Memo memo = memoRepository.findByIdWithMemberAndUser(memoId)
                .orElseThrow(() -> new RuntimeException("해당 메모를 찾을 수 없습니다."));

        // 권한 검증 (이미 페치조인 완료되어 쿼리 안튐)
        if (!memo.getMember().getUser().getId().equals(userId)) {
            throw new RuntimeException("해당 메모를 수정할 권한이 없습니다.");
        }

        // 기존에 등록되어 있던 이미지 파일 경로 유지용 변수
        String finalImageUrl = memo.getPicture();

        // 📸 이미지 수정 분기 로직 생성
        MultipartFile newImageFile = requestDto.getPicture();

        // 상황 [A]: 사용자가 새로운 이미지 파일을 업로드한 경우
        if (newImageFile != null && !newImageFile.isEmpty()) {
            // 1. 기존 이미지가 존재했다면 스토리지에서 옛날 파일 삭제 처리
            if (memo.getPicture() != null) {
                s3Service.deleteFile(memo.getPicture());
            }

            try{
                finalImageUrl= s3Service.uploadMemoImage(newImageFile);
            }catch (IOException e){
                throw new RuntimeException("이미지 업로드 실패",e);
            }
        }
        // 상황 [B]: 새 이미지는 안 올렸는데, 프론트 미리보기에서 '✕'를 눌러 기존 이미지를 지운 경우
        else if (requestDto.isDeleteOldPicture()) {
            if (memo.getPicture() != null) {
                s3Service.deleteFile(memo.getPicture());
            }
            finalImageUrl = null; // DB 컬럼 비우기
        }
        // 상황 [C]: 새 이미지도 없고, 지우기 플래그도 false라면 기존의 finalImageUrl(memo.getPicture())을 그대로 유지

        // 엔티티 변경 (더티 체킹에 의해 자동으로 갱신 쿼리 발생)
        memo.update(requestDto.getContent(), finalImageUrl);

        return MemoResponseDto.from(memo,s3Service);
    }

    /**
     * 4. 메모 삭제 (Delete) - 스토리지의 이미지 파일 청소 로직 추가
     */
    @Override
    @Transactional
    public void deleteMemo(Long userId, Long memoId) {
        Memo memo = memoRepository.findByIdWithMemberAndUser(memoId)
                .orElseThrow(() -> new RuntimeException("해당 메모를 찾을 수 없습니다."));

        if (!memo.getMember().getUser().getId().equals(userId)) {
            throw new RuntimeException("해당 메모를 삭제할 권한이 없습니다.");
        }

        // 메모가 DB에서 삭제되기 전에, 첨부되어 있던 이미지 파일이 있다면 스토리지에서 영구 제거
        if (memo.getPicture() != null) {
            s3Service.deleteFile(memo.getPicture());
        }

        memoRepository.delete(memo);
    }
}