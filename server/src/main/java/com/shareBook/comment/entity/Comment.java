package com.shareBook.comment.entity;

import com.shareBook.BaseTimeEntity;
import com.shareBook.memo.entity.Memo;
import com.shareBook.room.entity.Member;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "comments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Comment extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "comment_id")
    private Long commentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "memo_id", nullable = false)
    private Memo memo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    // 이미지(선택) - Memo와 동일한 패턴
    @Column(name = "picture", length = 1000)
    private String picture;

    public void update(String content, String picture) {
        this.content = content;
        this.picture = picture;
    }

}