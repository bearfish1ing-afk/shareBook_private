package com.shareBook.config;

import com.shareBook.user.entity.CustomOAuth2User;
import com.shareBook.user.entity.Role;
import com.shareBook.user.entity.User;
import com.shareBook.user.repostiory.RefreshTokenRepository;
import com.shareBook.user.repostiory.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

@RequiredArgsConstructor
@Service
public class CustomOauth2UserService extends DefaultOAuth2UserService {
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;


    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // 소셜 플랫폼이 발급한 따끈따끈한 엑세스 토큰!
        //String socialAccessToken = userRequest.getAccessToken().getTokenValue();

        String registrationId= userRequest
                .getClientRegistration()
                .getRegistrationId();

        String email = null;
        String name = null;
        String providerId = null;
        String profileImage=null;

        if ("naver".equals(registrationId)) {

            Map<String, Object> response =
                    (Map<String, Object>) oAuth2User.getAttribute("response");

            email = (String) response.get("email");
            name = (String) response.get("name");
            providerId = (String) response.get("id");

        } else if ("kakao".equals(registrationId)) {

            providerId = String.valueOf(
                    ((Number) oAuth2User.getAttributes().get("id")).longValue()
            );

            Map<String, Object> kakaoAccount =
                    (Map<String, Object>) oAuth2User.getAttributes().get("kakao_account");

            if (kakaoAccount != null) {
                email = (String) kakaoAccount.get("email");

                Map<String, Object> profile =
                        (Map<String, Object>) kakaoAccount.get("profile");

                if (profile != null) {
                    name = (String) profile.get("nickname");
                }
            }

        } else {
            // google
            providerId = (String) oAuth2User.getAttribute("sub");
            email = (String) oAuth2User.getAttribute("email");
            name = (String) oAuth2User.getAttribute("name");
        }

        User user = saveOrUpdate(email, name, registrationId, providerId,profileImage);



        return new CustomOAuth2User(
                oAuth2User, user
        );
    }


    //신규 회원일때 db에 어떻게 저장되는가
    private User saveOrUpdate(String email, String name, String provider, String providerId,String profileImage){

        String image=profileImage==null? "#":profileImage;
        return userRepository.findByProviderAndProviderId(provider, providerId)
                .map(entity -> entity.update(name,image)) //이미 있으면 업데이트
                .orElseGet(() -> userRepository.save(    // 없으면 신규 저장

                        User.builder()
                                .email(email)
                                .name(name)
                                .provider(provider)
                                .providerId(providerId)
                                .registrationId(provider)
                                .role(Role.USER)
                                .profileImage(image)
                                .build()
                ));
    }
}
