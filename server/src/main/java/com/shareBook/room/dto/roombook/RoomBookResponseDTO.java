package com.shareBook.room.dto.roombook;

import com.shareBook.book.entity.BookStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor // 퍼 블 릭
@NoArgsConstructor // 기본생성자
@Builder
public class RoomBookResponseDTO {
    private Long roomBookId;
    private String title;
    private String author;
    private String coverImage;

    private String addedByName;
    private LocalDateTime addedAt;

    private BookStatus status;
    private Boolean Deleted;
}
