package com.shareBook.user.dto;

import com.shareBook.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@AllArgsConstructor

public class UserNameProfileResponse {
    private String name;
    private String profileImage;

    public static UserNameProfileResponse from(User user) {
        return new UserNameProfileResponse(
                user.getName(),
                user.getProfileImage()
        );
    }
}
