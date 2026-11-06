package com.shareBook.room.dto.roombook;

import com.shareBook.book.entity.BookStatus;
import lombok.Builder;

import java.util.List;

@Builder
public record RoomBookDetailResponseDTO (
        Long roomBookId,
        Long bookId,
        String title,
        String author,
        String epubUrl,
        BookStatus status,
        Boolean Deleted
){

}