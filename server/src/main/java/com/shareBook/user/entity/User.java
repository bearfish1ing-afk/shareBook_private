package com.shareBook.user.entity;

import com.shareBook.room.entity.MemberRole;
import com.shareBook.room.entity.Room;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Builder
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email; //구글 이메일
    private String name; //구글 이름

    private String provider;     // google, naver, kakao
    private String providerId;   // 각 플랫폼 고유 id

    //registrationId를 provider랑 providerId로 대체할 예정
    //디비에 저장은 안하는걸로~
    private String registrationId;
    //나중에 build.gradle 가서 google 부분 {registrationId}로 고쳐야함.
    //나중에 http://localhost:8080 부분도 {baseUrl}로 고쳐야함.

    @Builder.Default
    @Column(name = "profile_image_url")
    private String profileImage = "#";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;


    // 업데이트 편의 메서드
    public User update(String nickname,String profileImage) {
        this.name = nickname;

        if(profileImage!=null){
            this.profileImage=profileImage;
        }
        return this;
    }

}