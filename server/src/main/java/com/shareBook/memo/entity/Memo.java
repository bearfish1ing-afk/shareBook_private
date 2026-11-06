package com.shareBook.memo.entity;

import com.shareBook.BaseTimeEntity;
import com.shareBook.comment.entity.Comment;
import com.shareBook.room.entity.Member;
import com.shareBook.room.entity.RoomBook;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name="memos")
@Getter
@NoArgsConstructor(access= AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Memo extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    @Column(name="memo_id")
    private Long memoId;

    //RoomBook 엔티티와 매핑
    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="room_book_id", nullable=false)
    private RoomBook roomBook;

    //epub 내 문장 식별
    @Column(name="cfi", nullable = false, length=500)
    private String cfi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    //메모 내용
    @Column(name="content", nullable = false, columnDefinition = "TEXT")
    private String content;

    //이미지(선택)
    @Column(name="picture", length=1000)
    private String picture;

    @Builder.Default
    @OneToMany(mappedBy = "memo", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();

    public void update(String content, String picture) {
        this.content=content;
        this.picture=picture;
    }


}
