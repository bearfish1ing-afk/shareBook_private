package com.shareBook.user.controller;

import com.shareBook.config.JwtTokenProvider;
import com.shareBook.user.entity.RefreshToken;
import com.shareBook.user.entity.User;
import com.shareBook.user.repostiory.RefreshTokenRepository;
import com.shareBook.user.repostiory.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request, HttpServletResponse response) {

        // 1. 프론트가 쿠키로 보낸 리프레시 토큰 꺼내기
        String refreshToken = null;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("refreshToken".equals(cookie.getName())) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }

        if (refreshToken == null || !jwtTokenProvider.validateToken(refreshToken)) {
            return ResponseEntity.status(401).body("Invalid refresh token");
        }

        // userId 추출
        String userId = jwtTokenProvider.getUserId(refreshToken);

        // DB에 저장된 리프레시 토큰 검증
        RefreshToken token = refreshTokenRepository
                .findByUserId(Long.parseLong(userId))
                .orElseThrow(() -> new RuntimeException("RefreshToken not found"));

        if (!token.getRefreshToken().equals(refreshToken)) {
            return ResponseEntity.status(401).body("RefreshToken mismatch");
        }

        userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. 새로운 Refresh Token 생성 및 DB 업데이트
        String newRefreshToken = jwtTokenProvider.createRefreshToken(Long.parseLong(userId));
        token.setRefreshToken(newRefreshToken);
        refreshTokenRepository.save(token);

        // 3. 새로운 Refresh Token을 쿠키에 다시 갱신해서 구워주기
        Cookie cookie = new Cookie("refreshToken", newRefreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(true); // HTTPS 환경이라면 true
        cookie.setPath("/");
        cookie.setMaxAge(7 * 24 * 60 * 60); // 7일 유지
        response.addCookie(cookie);

        // 4. 새로운 Access Token 생성 및  프론트엔드가 요구하는 헤더에 심어주기
        String newAccessToken = jwtTokenProvider.createAccessToken(Long.parseLong(userId), "");
        response.setHeader("Authorization", "Bearer " + newAccessToken);

        log.info("컨트롤러를 통한 토큰 재발급 완료 (User ID: {})", userId);

        return ResponseEntity.ok().build();
    }
}