package com.shareBook.highlight.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HighlightCreateRequestDTO {
    private Long roomBookId; // 어떤 방의 어떤 책인가
    private String cfi;     // epub 내 문장 식별자
    private String content;
}