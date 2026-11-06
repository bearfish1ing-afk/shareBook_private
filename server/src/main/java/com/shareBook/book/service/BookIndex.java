package com.shareBook.book.service;

import com.shareBook.book.entity.BookDocument;
import com.shareBook.book.repository.BookRepository;
import com.shareBook.book.repository.BookSearchRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class BookIndex {

    private final BookRepository bookRepository;
    private final BookSearchRepository bookSearchRepository;

    @PostConstruct
    public void init() {

        List<BookDocument> docs =
                bookRepository.findAll()
                        .stream()
                        .map(BookDocument::from)
                        .toList();

        bookSearchRepository.saveAll(docs);

        System.out.println("ES 동기화 완료");
    }
}