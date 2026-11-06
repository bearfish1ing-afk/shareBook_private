package com.shareBook.userbook.entity;

import com.shareBook.book.entity.Book;
import com.shareBook.book.entity.BookStatus;
import com.shareBook.room.entity.Room;
import com.shareBook.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access= AccessLevel.PROTECTED)
public class UserBook {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    //유저 연관
    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="user_id", nullable=false)
    private User user;

    //책 연관
    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="book_id", nullable=false)
    private Book book;

    @Enumerated(EnumType.STRING)
    private BookStatus status;

    //선택적: 공유 독서 방
    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="room_id")
    private Room room;

    private LocalDateTime startDate;
    private LocalDateTime endDate;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastReadAt;

    @Builder
    public UserBook(User user, Book book, BookStatus status, Room room) {
        this.user= user;
        this.book=book;
        this.status= status != null ? status: BookStatus.READING;
        this.room= room;
        this.startDate= LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        createdAt= LocalDateTime.now();
        updatedAt= LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt= LocalDateTime.now();
    }

    //status를 completed로 바꾸는 메서드
    public void markAsCompleted() {
        this.status= BookStatus.COMPLETED;
        this.endDate= LocalDateTime.now();
    }

    public void markReading() {
        this.status=BookStatus.READING;
        this.endDate=null;
    }

    public void setLastReadAt(){
        this.lastReadAt=LocalDateTime.now();
    }

}