package com.shareBook.room.entity;

import com.shareBook.book.entity.Book;
import com.shareBook.book.entity.BookStatus;
import com.shareBook.BaseTimeEntity;
import com.shareBook.book.entity.Book;
import com.shareBook.book.entity.BookStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.springframework.cglib.core.Local;

import java.time.LocalDateTime;
import java.util.List;

// 방에서 읽고있는 책을 담는 엔티티 ,..(Room 과 Book 의 중간 엔티티)
// 추가된 날짜나 읽기 시작한 날짜 / 완독 목표 일자 추가할지 정할것

//따닥으로 인한 중복 막기 위해
@Table(
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"room_id", "book_id"})
        }
)
@Entity
@Getter
@SQLDelete(sql = "UPDATE room_book SET deleted = true WHERE id = ?")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RoomBook extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id")
    private Book book;

    @Enumerated(EnumType.STRING)
    private BookStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member addedBy; //추가한 멤버 아이디

    private LocalDateTime startDate;
    private LocalDateTime endDate;

    private boolean deleted = false;

    public void markAsCompleted() {
        this.status = BookStatus.COMPLETED;
        this.endDate = LocalDateTime.now();

    }
    @Builder
    public RoomBook(Room room, Book book, BookStatus status, Member addedBy) {
        this.room =room;
        this.book = book;
        this.status = status != null ? status : BookStatus.READING;
        this.addedBy = addedBy;
        this.startDate = LocalDateTime.now();
    }

}