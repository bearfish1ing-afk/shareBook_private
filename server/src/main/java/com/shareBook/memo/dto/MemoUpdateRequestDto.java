package com.shareBook.memo.dto;

import lombok.*;
import org.springframework.web.multipart.MultipartFile;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemoUpdateRequestDto {
    private String content;  // 수정할 메모 내용
    private MultipartFile picture;  // 수정할 첨부 이미지 (기존 이미지 유지/변경/삭제 대응)
    private boolean deleteOldPicture;
}