package com.shareBook.comment.dto;

import lombok.*;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentUpdateRequestDto {
    private String content;
    private MultipartFile picture;       // 새 이미지 (선택)
    private boolean deleteOldPicture;    // 기존 이미지 삭제 플래그
}