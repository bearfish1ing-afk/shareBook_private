package com.shareBook.highlight.dto;

import com.shareBook.highlight.entity.Highlight;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

public class HighlightResponseDTO {

    // [EPUB 뷰어용]
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ForEpub {
        private Long highlightId;
        private String cfi;
        private String content;
        private Long memberId;
        private String penColor;

        public static ForEpub from(Highlight highlight) {
            return ForEpub.builder()
                    .highlightId(highlight.getHighlightId())
                    .cfi(highlight.getCfi())
                    .content(highlight.getContent())
                    .memberId(highlight.getMember().getId())
                    .penColor(highlight.getMember().getPenColor())
                    .build();
        }
    }

    //  [마이페이지용]
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ForUserScrap {
        private Long highlightId;
        private String content;
        private String bookTitle;
        private String author;
        private LocalDateTime createdAt;

        public static ForUserScrap from(Highlight highlight) {
            return ForUserScrap.builder()
                    .highlightId(highlight.getHighlightId())
                    .content(highlight.getContent())
                    .bookTitle(highlight.getRoomBook().getBook().getTitle()) // 연관 엔티티 슥 긁어오기
                    .author(highlight.getRoomBook().getBook().getAuthor())
                    .createdAt(highlight.getCreatedAt())
                    .build();
        }
    }

    // [룸 디테일 홈화면용]
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ForRoomMain {
        private String content;
        private String bookTitle;
        private String nickname;
        private String penColor;     // 해당 유저의 펜 고유 색상
        private Long roomBookId;
        private LocalDateTime createdAt;

        public static ForRoomMain from(Highlight highlight) {
            return ForRoomMain.builder()
                    .content(highlight.getContent())
                    .bookTitle(highlight.getRoomBook().getBook().getTitle())
                    .nickname(highlight.getMember().getUser().getName()) // 지희 씨 기존 맵핑 유지 ㅡㅡ b
                    .penColor(highlight.getMember().getPenColor())
                    .roomBookId(highlight.getRoomBook().getId())
                    .createdAt(highlight.getCreatedAt())
                    .build();
        }
    }
}
