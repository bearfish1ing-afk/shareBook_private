package com.shareBook.book.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@NoArgsConstructor
@Getter
//RoomBook 엔티티 구현을 위해 간단 히 (아무생각없이) 구현
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String isbn; // 책을 식별하는 고유 키

    @Column(nullable = false)
    private String title;

    private String author;

    private String coverImageUrl;

    private String publisher;

    private String epubKey;

    @Builder
    public Book(String isbn,
                String title,
                String author,
                String publisher,
                String coverImageUrl,
                String epubKey) {
        this.isbn = isbn;
        this.title = title;
        this.author = author;
        this.publisher = publisher;
        this.coverImageUrl = coverImageUrl;
        this.epubKey = epubKey;
    }
}
