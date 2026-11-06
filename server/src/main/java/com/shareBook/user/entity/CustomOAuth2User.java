package com.shareBook.user.entity;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.List;
import java.util.Map;

public class CustomOAuth2User implements OAuth2User {
    //구글에서 받은 원본 oauth2 유저 정보
    private final OAuth2User oAuth2User;

    //우리 db에 저장된 user
    private final User user;

    public CustomOAuth2User(OAuth2User oAuth2User, User user)
    {
        this.oAuth2User = oAuth2User;
        this.user= user;
    }

    /*
   OAuth2User 기본 attribute 반환

   예:
   email
   name
   picture
   sub
    */
    @Override
    public Map<String, Object> getAttributes() {
        return oAuth2User.getAttributes();
    }

    /*
    권한 정보 반환

    지금은 기본 권한만 사용
    나중에 ROLE_USER 같은 거 추가 가능
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        String role= (user.getRole() != null) ? user.getRole().getKey()
                : "ROLE_USER";
        return List.of(new SimpleGrantedAuthority(role));
    }

    /*
    spring security가 사용하는 username
     */
    @Override
    public String getName() {
        return (user.getName() != null && !user.getName().isEmpty())
                ? user.getName()
                : String.valueOf(user.getId());
    }

    /*
    나중에 편하게 쓰려고 만든 메소드들
     */

    public String getEmail() {
        return user.getEmail();
    }

    public Long getId() {
        return user.getId();
    }

    public String getProvider() {
        return user.getProvider();
    }

    public String getRegistrationId() {
        return user.getRegistrationId();
    }


}
