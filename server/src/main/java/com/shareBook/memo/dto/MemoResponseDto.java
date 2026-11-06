package com.shareBook.memo.dto;

import com.shareBook.book.service.S3Service;
import com.shareBook.memo.entity.Memo;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemoResponseDto {

    private Long memoId;
    private String cfi;
    private String content;
    private String picture;
    private LocalDateTime createdAt;

    private Long memberId;
    private Long userId; // 💡 추가
    private String nickname;
    private String penColor;
    private String profileImage;


    public static MemoResponseDto from(Memo memo,S3Service s3Service) {
        String pictureUrl = null;
        if (memo.getPicture() != null) {
            pictureUrl = s3Service.getPresignedUrl(memo.getPicture());
        }
        return MemoResponseDto.builder()
                .memoId(memo.getMemoId())
                .cfi(memo.getCfi())
                .content(memo.getContent())
                .picture(pictureUrl)
                .createdAt(memo.getCreatedAt())
                .memberId(memo.getMember().getId())
                .userId(memo.getMember().getUser().getId()) // 💡 추가
                .nickname(memo.getMember().getUser().getName())
                .penColor(memo.getMember().getPenColor())
                .profileImage(
                        memo.getMember().getUser().getProfileImage() == null
                                ? null
                                : s3Service.getPresignedUrl(memo.getMember().getUser().getProfileImage())
                )
                .build();
    }
}