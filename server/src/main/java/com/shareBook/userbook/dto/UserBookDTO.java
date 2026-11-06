package com.shareBook.userbook.dto;


import com.shareBook.book.entity.BookStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class UserBookDTO {
    private Long bookId;
    private String title;
    private String author;
    private BookStatus status;
    private String coverImageUrl;
    private Long roomId;
    private String roomName;
    private long memberCount;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime lastReadAt;

    @Builder
    public UserBookDTO(Long bookId, String title, String author,BookStatus status, String coverImageUrl,Long roomId,String roomName,long memberCount,LocalDateTime startDate,LocalDateTime endDate,LocalDateTime lastReadAt) {
        this.bookId= bookId;
        this.title=title;
        this.author=author;
        this.status=status;
        this.coverImageUrl=coverImageUrl;
        this.roomId= roomId;
        this.roomName=roomName;
        this.memberCount=memberCount;
        this.startDate = startDate;
        this.endDate = endDate;
        this.lastReadAt=lastReadAt;
    }

}
