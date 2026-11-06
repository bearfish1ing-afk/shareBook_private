package com.shareBook.highlight.entity;

import com.shareBook.BaseTimeEntity;
import com.shareBook.room.entity.Member;
import com.shareBook.room.entity.RoomBook;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="highlight")
@Getter
@NoArgsConstructor(access= AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Highlight extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    @Column(name="highlight_id")
    private Long highlightId;

    //RoomBook 엔티티와 매핑
    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="room_book_id", nullable=false)
    private RoomBook roomBook;

    //epub 내 문장 식별
    @Column(name="cfi", nullable = false, length=500)
    private String cfi;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;
}
