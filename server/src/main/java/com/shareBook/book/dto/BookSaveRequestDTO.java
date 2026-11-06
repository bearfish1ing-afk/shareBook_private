package com.shareBook.book.dto;

import jakarta.persistence.Column;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class BookSaveRequestDTO {
    private String isbn;
    private String title;
    private String author;
    private MultipartFile coverImageUrl;
    private String publisher;

    private MultipartFile epubFile;
}
