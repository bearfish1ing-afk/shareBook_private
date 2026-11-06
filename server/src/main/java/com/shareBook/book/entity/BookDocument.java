package com.shareBook.book.entity;

import jakarta.persistence.Id;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

@Getter
@Builder
@Document(indexName = "books")
public class BookDocument {
    @Id
    private String id;

    @Field(type = FieldType.Keyword)
    private String isbn;

    @Field(type = FieldType.Text, analyzer = "nori") // 한글 검색 노리 분석기 설정
    private String title;

    @Field(type = FieldType.Text)
    private String author;

    private String coverImageUrl;

    private String publisher;

    public static BookDocument from(Book entity) {
        return BookDocument.builder()
                .id(entity.getId().toString())
                .isbn(entity.getIsbn())
                .title(entity.getTitle())
                .author(entity.getAuthor())
                .coverImageUrl(entity.getCoverImageUrl())
                .publisher(entity.getPublisher())
                .build();
    }
    public BookDocument withCoverImageUrl(String url){
        return BookDocument.builder()
                .id(this.id)
                .isbn(this.isbn)
                .title(this.title)
                .author(this.author)
                .coverImageUrl(url)
                .publisher(this.publisher)
                .build();
    }
}
