package com.shareBook.user.controller;

import com.shareBook.user.entity.CustomOAuth2User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    /*
    //루트 페이지: 로그인 링크 제공
    @GetMapping("/")
    public String index() {
        return "구글 로그인 테스트 페이지! <a href='/oauth2/authorization/google'>Login with Google</a>\n" +
                "네이버 로그인 테스트 페이지! <a href='/oauth2/authorization/naver'>Login with Naver</a>\n" +
                "카카오 로그인 테스트 페이지! <a href='/oauth2/authorization/kakao'>Login with Kakao</a>";
    }


    //home page after login
    @GetMapping("/home")
    //로그인한 oauth2 계정 정보 자동 주입, 거기서 정보 가져와서 return 하기
    public String home(@AuthenticationPrincipal CustomOAuth2User principal) {
        if (principal == null) {
            return "로그인 안됨";
        }

        //principal에서 구글 계정 정보 가져오기
        String name = principal.getAttribute("name"); //구글 이름
        String email = principal.getAttribute("email"); //구글 이메일
        String provider = principal.getRegistrationId();

        return "Hello, "+name+"("+email+")"+provider;
    }

    */

    //추후, 유저의 프로필 정보를 요청할 수 있는 api로 바꿀 예정
    @GetMapping("/me")
    public String me(@AuthenticationPrincipal CustomOAuth2User user) {
        if(user==null) {
            return "로그인 안된다구요";
        }
        return user.getEmail();
    }
}