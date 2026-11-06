package com.shareBook.book.repository;

import com.shareBook.book.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookRepository extends JpaRepository<Book,Long> {
    boolean existsByIsbn(String isbn);

    Optional<Book> findByIsbn(String isbn);
    Optional<Book> findById(Long bookId);


    List<Book> findByTitleContaining(String title);//제목으로 책 찾기

    List<Book> findByAuthorContaining(String author);//작가이름으로 책 찾기
    
}
