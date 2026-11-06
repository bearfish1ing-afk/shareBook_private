package com.shareBook.book.service;

import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.QueryBuilders;
import com.shareBook.book.dto.BookResponseDTO;
import com.shareBook.book.dto.BookSaveRequestDTO;
import com.shareBook.book.entity.Book;
import com.shareBook.book.entity.BookDocument;
import com.shareBook.book.repository.BookRepository;
import com.shareBook.book.repository.BookSearchRepository;
import com.shareBook.room.dto.member.MemberResponseDTO;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookService {
    private final BookRepository bookRepository;
    private final BookSearchRepository bookSearchRepository;
    private final ElasticsearchOperations elasticsearchOperations;
    private final S3Service s3Service;

    //책 추가(관리자)
    @Transactional
    public Long addBook(BookSaveRequestDTO dto) throws IOException {
        if(bookRepository.existsByIsbn(dto.getIsbn())){
            throw new IllegalStateException("이미 등록된 ISBN입니다.");
        }

        String epubKey = null;

        if(dto.getEpubFile()!=null && !dto.getEpubFile().isEmpty()){
            epubKey= s3Service.upload(dto.getEpubFile());
        }

        String coverKey=null;
        if(dto.getCoverImageUrl()!=null && !dto.getCoverImageUrl().isEmpty()){
            coverKey=s3Service.uploadCoverImage(dto.getCoverImageUrl());
        }

        Book book = Book.builder()
                .isbn(dto.getIsbn())
                .title(dto.getTitle())
                .author(dto.getAuthor())
                .coverImageUrl(coverKey)
                .publisher(dto.getPublisher())
                .epubKey(epubKey)
                .build();

        Book saveBook=bookRepository.save(book);

        bookSearchRepository.save(BookDocument.from(saveBook));
        return saveBook.getId();
    }

    //책 전체 리스트(관리자)
    @Transactional
    public List<BookResponseDTO> getBook(){
        return bookRepository.findAll().stream()
                .map(book -> {
                    BookResponseDTO dto=BookResponseDTO.from(book);

                    String url=s3Service.getPresignedUrl(book.getCoverImageUrl());
                    return dto.withCoverImageUrl(url);
                })
                .toList();
    }

    //책 리스트(작가)(사용자)
    @Transactional
    public List<BookResponseDTO> getBookByAuthor(String author){
        return bookRepository.findByAuthorContaining(author).stream()
                .map(book -> {
                    BookResponseDTO dto=BookResponseDTO.from(book);

                    String url=s3Service.getPresignedUrl(book.getCoverImageUrl());
                    return dto.withCoverImageUrl(url);
                })
                .toList();
    }

    //책 리스트(제목)(사용자)
    @Transactional
    public List<BookResponseDTO> getBookByTitle(String title){
        return bookRepository.findByTitleContaining(title).stream()
                .map(book -> {
                    BookResponseDTO dto=BookResponseDTO.from(book);

                    String url=s3Service.getPresignedUrl(book.getCoverImageUrl());
                    return dto.withCoverImageUrl(url);
                })
                .toList();
    }

    //책 검색//고칠 수 잇음
    public List<BookDocument> search(String keyword){
        Query query= QueryBuilders.multiMatch(m->m
                .fields("title","author")
                .query(keyword)
                .fuzziness("AUTO")
        );

        NativeQuery nativeQuery=NativeQuery.builder()
                .withQuery(query).build();

        //검색 실행
        SearchHits<BookDocument> searchHits= elasticsearchOperations.search(nativeQuery, BookDocument.class);

        return searchHits.stream()
                .map(hit->{
                    BookDocument doc=hit.getContent();

                    doc.withCoverImageUrl(
                            s3Service.getPresignedUrl(
                                    doc.getCoverImageUrl()
                            )
                    );
                    return doc;
                })
                .toList();
    }

}
