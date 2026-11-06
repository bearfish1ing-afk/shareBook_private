package com.shareBook.memo.dto;

import lombok.*;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemoCreateRequestDto {
    private Long roomBookId; // 어떤 방의 어떤 책인가
    private String cfi;      // epub 내 문장 식별자
    private String content;  // 메모 내용
    private MultipartFile picture;  // 첨부 이미지 (필수 X)
}