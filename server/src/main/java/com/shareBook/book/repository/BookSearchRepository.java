package com.shareBook.book.repository;

import com.shareBook.book.entity.BookDocument;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import java.util.List;

public interface BookSearchRepository extends ElasticsearchRepository<BookDocument, String> {
    List<BookDocument> findByTitleContainingOrAuthorContaining(String title, String author);
}
