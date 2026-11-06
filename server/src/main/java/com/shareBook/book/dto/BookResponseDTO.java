package com.shareBook.book.dto;

import com.shareBook.book.entity.Book;

public record BookResponseDTO(
        Long bookId,
        String isbn,
        String title,
        String author,
        String coverImageUrl,
        String publisher
) {
    public static BookResponseDTO from(Book entity){
        return new BookResponseDTO(
                entity.getId(),
                entity.getIsbn(),
                entity.getTitle(),
                entity.getAuthor(),
                entity.getCoverImageUrl(),
                entity.getPublisher()
        );
    }

    public BookResponseDTO withCoverImageUrl(String url){
        return new BookResponseDTO(
                this.bookId,
                this.isbn,
                this.title,
                this.author,
                url,
                this.publisher
        );
    }
}
