package com.shareBook.book.controller;

import com.shareBook.book.dto.BookResponseDTO;
import com.shareBook.book.dto.BookSaveRequestDTO;
import com.shareBook.book.repository.BookRepository;
import com.shareBook.book.service.BookService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.shareBook.config.JwtTokenProvider;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/books")
public class BookController {
    private final BookService bookService;
    private final BookRepository bookRepository;
    private final JwtTokenProvider jwtTokenProvider;

    // BookSearchRepository 의존성은 현재 비활성화 상태이므로 제거하거나 주석 처리합니다.
    // private final BookSearchRepository bookSearchRepository;

    @PostMapping(value = "/add",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Long> addBookApi(@ModelAttribute BookSaveRequestDTO dto) throws IOException {
        Long bookId = bookService.addBook(dto);
        return ResponseEntity.ok(bookId);
    }

    @GetMapping()
    public ResponseEntity<List<BookResponseDTO>> bookListApi(){
        return ResponseEntity.ok(bookService.getBook());
    }

    @GetMapping("/title")
    public ResponseEntity<List<BookResponseDTO>> bookListTitleApi(@RequestParam("keyword") String keyword){
        return ResponseEntity.ok(bookService.getBookByTitle(keyword));
    }

    @GetMapping("/author")
    public ResponseEntity<List<BookResponseDTO>> bookListAuthorApi(@RequestParam("keyword") String keyword){
        return ResponseEntity.ok(bookService.getBookByAuthor(keyword));
    }

    // 검색 API도 Service 계층의 결정에 맞춰 빈 리스트를 반환하도록 설정합니다.
    @GetMapping("/search")
    public ResponseEntity<?> searchBooks(@RequestParam String query){
        // bookService.search(query)가 현재 빈 리스트를 반환하므로 그대로 써도 무방합니다.
        return ResponseEntity.ok(bookService.search(query));
    }

}