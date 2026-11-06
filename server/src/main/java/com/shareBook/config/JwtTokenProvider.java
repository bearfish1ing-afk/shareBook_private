package com.shareBook.config;


import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.ArrayList;
import java.util.Date;

@Component
public class JwtTokenProvider {
    @Value("${jwt.secret}")
    private String secretKey;

    private final long accessTokenExpire = 1000 * 60 * 60 *5; // 5시간
    private final long refreshTokenExpire = 1000L * 60 * 60 * 24 * 14; // 14일

    //Key 객체 생성
    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    //Access Token 생성
    public String createAccessToken(Long userId, String email) {
        Date now = new Date();
        String safeEmail = (email != null) ? email : "NO_EMAIL"; // 방어 코드

        return Jwts.builder()
                .claim("userId", userId)
                .claim("email", safeEmail)
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + accessTokenExpire))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // Refresh Token 생성
    public String createRefreshToken(Long userId) {
        Date now = new Date();

        return Jwts.builder()
                .claim("userId", userId)
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + refreshTokenExpire))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // 토큰 검증
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);

            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // 인증 객체 생성
    public Authentication getAuthentication(String token) {
        String userId = getUserId(token);

        UserDetails userDetails =
                new User(userId, "", new ArrayList<>());

        return new UsernamePasswordAuthenticationToken(
                userDetails, "", userDetails.getAuthorities()
        );
    }

    // userId 추출
    // getUserId(accessToken)으로 코드를 쓰면 만료된 토큰 에러 발생할 수 있음.
    public String getUserId(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            return String.valueOf(claims.get("userId"));
        } catch (ExpiredJwtException e) {
            // 토큰이 만료되었을 때 나오는 예외 객체에서 Claims를 강제로 꺼냅니다.
            return String.valueOf(e.getClaims().get("userId"));
        }
    }
}