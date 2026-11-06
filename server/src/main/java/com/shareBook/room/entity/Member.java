package com.shareBook.room.entity;

import com.shareBook.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="member_entity")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Member {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    private String penColor;//색깔 고를 수 있게

    @Enumerated(EnumType.STRING)
    private MemberRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default//시작값
    private MemberStatus status = MemberStatus.ACTIVE;


    @Builder
    public Member(User user, Room room, String penColor, MemberRole role) {
        this.user = user;
        this.room = room;
        this.penColor = penColor;
        this.role = role;
    }

    public void reactivate(String penColor) {
        this.status = MemberStatus.ACTIVE;
        this.penColor = penColor;
        this.role = MemberRole.MEMBER;
    }

    public void updateRole(MemberRole memberRole) {
        this.role = memberRole;
    }

    public void updateColor(String penColor){
        this.penColor=penColor;
    }

}