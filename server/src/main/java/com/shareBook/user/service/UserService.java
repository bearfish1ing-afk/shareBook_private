package com.shareBook.user.service;

import com.shareBook.user.dto.UserNameProfileRequest;
import com.shareBook.user.dto.UserNameProfileResponse;
import com.shareBook.user.entity.User;
import com.shareBook.user.repostiory.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    @Transactional
    public User updateNameProfile(Long userId, String name, String profileImageKey){
        User user=userRepository.findById(userId)
                .orElseThrow(()->new RuntimeException("사용자 없음"));

        //이미지 없이 이름만 변경하는경우
        String imageSave=(profileImageKey!=null)?profileImageKey:user.getProfileImage();
        user.update(name, imageSave);

        return user;
    }

}
