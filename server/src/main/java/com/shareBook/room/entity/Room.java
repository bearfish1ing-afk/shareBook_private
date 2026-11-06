package com.shareBook.room.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SQLDelete(sql = "UPDATE room SET deleted = true WHERE room_id = ?")
@SQLRestriction("deleted=false")
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    private Long id;

    @Column
    private String name;

    @Column(unique = true, nullable = false, length=6)
    private String joinCode;

    @Column(nullable = false)
    private Integer maxParticipants=6;

    @Column(nullable = false)
    private Long ownerId;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Member> members = new ArrayList<>();

    //삭제 여부 기록 필드
    private boolean deleted = false;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoomBook> roomBooks = new ArrayList<>();

    public int getMembersCount(){
        return (int) members.stream()
                .filter(member -> member.getStatus() == MemberStatus.ACTIVE)
                .count();
    }
    public void addMember(Member member) {
        if (this.getMembersCount() >= 6) {
            throw new IllegalArgumentException("방이 이미 꽉 찼습니다.");
        }
        this.members.add(member);
        member.setRoom(this); // Member 객체에도 방 정보를 넣어줌
    }

    @Builder
    public Room(String name, String joinCode, Long ownerId) {
        this.name = name;
        this.joinCode = joinCode;
        this.maxParticipants = 6;
        this.ownerId = ownerId;
    }

    public void updateRoomName(String name){
        this.name = name;
    }

    public void updateOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }
}
