package com.shareBook.comment.service;

import com.shareBook.comment.dto.CommentCreateRequestDto;
import com.shareBook.comment.dto.CommentResponseDto;
import com.shareBook.comment.dto.CommentUpdateRequestDto;
import com.shareBook.comment.entity.Comment;
import com.shareBook.comment.repository.CommentRepository;
import com.shareBook.memo.entity.Memo;
import com.shareBook.memo.repository.MemoRepository;
import com.shareBook.room.entity.Member;
import com.shareBook.room.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final MemoRepository memoRepository;
    private final MemberRepository memberRepository;

    // private final FileStorageService fileStorageService; // Memo와 동일하게 추후 연동

    /**
     * 코멘트 작성 (Create) - 이미지 업로드 연동
     */
    @Override
    @Transactional
    public CommentResponseDto createComment(Long userId, CommentCreateRequestDto requestDto) {
        Memo memo = memoRepository.findById(requestDto.getMemoId())
                .orElseThrow(() -> new RuntimeException("해당 메모를 찾을 수 없습니다."));

        Long roomId = memo.getRoomBook().getRoom().getId();

        Member member = memberRepository.findByUserIdAndRoomId(userId, roomId)
                .orElseThrow(() -> new RuntimeException("해당 독서 방의 멤버가 아닙니다. 댓글 작성 권한이 없습니다."));

        // 이미지 파일 업로드 처리 (Memo와 동일한 패턴)
        String uploadedImageUrl = null;
        MultipartFile imageFile = requestDto.getPicture();
        if (imageFile != null && !imageFile.isEmpty()) {
            String originalFilename = imageFile.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String savedFilename = UUID.randomUUID().toString() + extension;

            // uploadedImageUrl = fileStorageService.upload(imageFile); // 👈 실제 연동 시 교체
            uploadedImageUrl = "https://your-s3-bucket.s3.amazonaws.com/comments/" + savedFilename; // 임시 mock
        }

        Comment comment = Comment.builder()
                .memo(memo)
                .member(member)
                .content(requestDto.getContent())
                .picture(uploadedImageUrl)
                .build();

        Comment savedComment = commentRepository.save(comment);

        return CommentResponseDto.from(savedComment);
    }

    @Override
    public List<CommentResponseDto> getCommentsByMemo(Long memoId) {
        List<Comment> comments = commentRepository.findByMemo_MemoIdOrderByCreatedAtAsc(memoId);

        return comments.stream()
                .map(CommentResponseDto::from)
                .collect(Collectors.toList());
    }

    /**
     * 코멘트 수정 (Update) - 이미지 분기 처리
     */
    @Override
    @Transactional
    public CommentResponseDto updateComment(Long userId, Long commentId, CommentUpdateRequestDto requestDto) {
        Comment comment = commentRepository.findByIdWithMemberAndUser(commentId)
                .orElseThrow(() -> new RuntimeException("해당 댓글을 찾을 수 없습니다."));

        if (!comment.getMember().getUser().getId().equals(userId)) {
            throw new RuntimeException("해당 댓글을 수정할 권한이 없습니다.");
        }

        String finalImageUrl = comment.getPicture();
        MultipartFile newImageFile = requestDto.getPicture();

        // [A] 새 이미지를 업로드한 경우
        if (newImageFile != null && !newImageFile.isEmpty()) {
            if (comment.getPicture() != null) {
                // fileStorageService.delete(comment.getPicture());
            }
            // finalImageUrl = fileStorageService.upload(newImageFile);
            finalImageUrl = "https://your-s3-bucket.s3.amazonaws.com/comments/updated_" + newImageFile.getOriginalFilename(); // 임시 mock
        }
        // [B] 기존 이미지를 삭제만 하는 경우
        else if (requestDto.isDeleteOldPicture()) {
            if (comment.getPicture() != null) {
                // fileStorageService.delete(comment.getPicture());
            }
            finalImageUrl = null;
        }
        // [C] 변경 없음 -> finalImageUrl 그대로 유지

        comment.update(requestDto.getContent(), finalImageUrl);

        return CommentResponseDto.from(comment);
    }

    /**
     * 코멘트 삭제 (Delete) - 스토리지 이미지 청소 추가
     */
    @Override
    @Transactional
    public void deleteComment(Long userId, Long commentId) {
        Comment comment = commentRepository.findByIdWithMemberAndUser(commentId)
                .orElseThrow(() -> new RuntimeException("해당 댓글을 찾을 수 없습니다."));

        if (!comment.getMember().getUser().getId().equals(userId)) {
            throw new RuntimeException("해당 댓글을 삭제할 권한이 없습니다.");
        }

        if (comment.getPicture() != null) {
            // fileStorageService.delete(comment.getPicture());
        }

        commentRepository.delete(comment);
    }

}