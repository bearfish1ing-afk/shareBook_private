package com.shareBook.user.repostiory;

import com.shareBook.user.entity.User;
import io.micrometer.observation.ObservationFilter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.OptionalLong;

public interface UserRepository extends JpaRepository<User, Long> {
    //이메일 + registrationId로 유저 조희 (중복 방지)
    Optional<User> findByEmailAndRegistrationId(String email, String registrationId);

    Optional<User> findByProviderAndProviderId(String provider, String providerId);

    //밑에도 삭제해도 ㄱㅊ음.
    Optional<User> findByEmail(String email);
}
