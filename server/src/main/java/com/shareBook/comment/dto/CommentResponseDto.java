package com.shareBook.comment.dto;

import com.shareBook.comment.entity.Comment;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentResponseDto {
    private Long commentId;
    private Long memoId;
    private String content;
    private String picture;
    private LocalDateTime createdAt;

    private Long memberId;
    private Long userId; // 💡 추가 - 작성자 본인 여부 판단용
    private String nickname;
    private String profileImage;
    private String penColor;

    public static CommentResponseDto from(Comment comment) {
        return CommentResponseDto.builder()
                .commentId(comment.getCommentId())
                .memoId(comment.getMemo().getMemoId())
                .content(comment.getContent())
                .picture(comment.getPicture())
                .createdAt(comment.getCreatedAt())
                .memberId(comment.getMember().getId())
                .userId(comment.getMember().getUser().getId()) // 💡 추가
                .nickname(comment.getMember().getUser().getName())
                .profileImage(comment.getMember().getUser().getProfileImage())
                .penColor(comment.getMember().getPenColor())
                .build();
    }
}