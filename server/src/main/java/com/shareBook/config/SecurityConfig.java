package com.shareBook.config;

import com.shareBook.user.entity.CustomOAuth2User;
import com.shareBook.user.repostiory.RefreshTokenRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.LogoutFilter;

@Slf4j
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final CustomOauth2UserService customOauth2UserService;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;


    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, OAuth2SuccessHandler oAuth2SuccessHandler) throws Exception {

        http
                .cors(cors -> cors.configurationSource(request -> {
                    var config = new org.springframework.web.cors.CorsConfiguration();
                    config.setAllowedOrigins(java.util.List.of("http://localhost:3000"));
                    config.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
                    config.setAllowedHeaders(java.util.List.of("*"));
                    config.setAllowCredentials(true);

                    config.addExposedHeader("Authorization");
                    return config;
                }))
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers.frameOptions(f -> f.disable())) // H2 콘솔 접근 허용
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/",
                                "/login/**",
                                "/oauth2/**",
                                "/error",
                                "/auth/refresh",
                                "/auth/logout",
                                "/css/**", "/images/**", "/js/**", "/h2-console/**",
                                "/api/v1/rooms/**",
                                "/api/v1/books/**",
                                "/api/userbooks/**"//5/12 수정
                        ).permitAll()

                        // 나머지는 로그인 필요
                        .anyRequest().authenticated()
                )


                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOauth2UserService)
                        )

                        .successHandler(oAuth2SuccessHandler)
                )


                .addFilterBefore(
                        new JwtAuthenticationFilter(jwtTokenProvider),
                        LogoutFilter.class
                )


                // SecurityConfig.java 수정
                .logout(logout -> logout
                        .logoutUrl("/auth/logout")
                        .addLogoutHandler((request, response, authentication) -> {
                            if (authentication != null) {
                                String userId = authentication.getName(); // JwtTokenProvider에서 userId를 넣어둠

                                // DB에서 해당 유저의 리프레시 토큰 삭제
                                refreshTokenRepository.deleteByUserId(Long.parseLong(userId));
                                log.info("로그아웃 핸들러 작동: 유저 {}의 토큰 삭제 완료", userId);
                            }
                            else {
                                log.warn("로그아웃 요청에 인증정보(authentication)가 없음");
                            }
                        })
                        .logoutSuccessHandler((request, response, authentication) -> {
                            response.setStatus(HttpServletResponse.SC_OK);
                            response.getWriter().write("Logout Success");
                        })
                        .deleteCookies("refreshToken") // 쿠키 삭제
                        .permitAll()
                );

        return http.build();
    }
}