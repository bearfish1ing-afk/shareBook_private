package com.shareBook.comment.dto;

import lombok.*;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter // 💡 @ModelAttribute 바인딩을 위해 필요 (Memo와 동일)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentCreateRequestDto {
    private Long memoId;
    private String content;
    private MultipartFile picture; // 첨부 이미지 (필수 X)
}