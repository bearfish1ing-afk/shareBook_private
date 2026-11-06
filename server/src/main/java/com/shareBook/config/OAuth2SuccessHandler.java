package com.shareBook.config;

import com.shareBook.user.entity.CustomOAuth2User;
import com.shareBook.user.entity.RefreshToken;
import com.shareBook.user.repostiory.RefreshTokenRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException {
        CustomOAuth2User user=
                (CustomOAuth2User) authentication.getPrincipal();

        String accessToken=
                jwtTokenProvider.createAccessToken(user.getId(), user.getEmail());

        String refreshToken=
                jwtTokenProvider.createRefreshToken(user.getId());

        // 기존에 해당 유저의 토큰이 있으면 업데이트, 없으면 새로 생성
        RefreshToken tokenEntity = refreshTokenRepository.findByUserId(user.getId())
                .orElse(new RefreshToken());

        tokenEntity.setUserId(user.getId());
        tokenEntity.setRefreshToken(refreshToken);
        refreshTokenRepository.save(tokenEntity);


        // HttpOnly cookie로 refreshToken 전달
        Cookie refreshCookie = new Cookie("refreshToken", refreshToken);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(false); // 나중에 배포할 때 https 환경이면 true로 변경
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(14 * 24 * 60 * 60); // 14일
        response.addCookie(refreshCookie);

        // 임시 HTML 화면 출력
        /*
        response.setContentType("text/html;charset=UTF-8");
        response.getWriter().write("<h2>로그인 성공!</h2>");
        response.getWriter().write("<p>Access Token: " + accessToken + "</p>");
        response.getWriter().write("<p>Refresh Token: " + refreshToken + "</p>");
        response.getWriter().write("<p>이 토큰을 복사해서 Postman이나 다른 곳에서 테스트하세요.</p>");
        */


        String redirectUrl = "http://localhost:3000/oauth-success"
                + "?accessToken=" + accessToken;

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}