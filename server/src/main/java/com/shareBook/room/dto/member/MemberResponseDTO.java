package com.shareBook.room.dto.member;

import com.shareBook.room.entity.Member;
import com.shareBook.room.entity.MemberRole;
import com.shareBook.room.entity.MemberStatus;
import com.shareBook.user.entity.User;

public record MemberResponseDTO (
        Long memberId,
        Long userId,
        String penColor,
        MemberRole role,
        String profileImage,
        MemberStatus status

) {

    public static MemberResponseDTO from(Member entity) {
        User user=entity.getUser();
        return new MemberResponseDTO(
                entity.getId(),
                entity.getUser().getId(),
                entity.getPenColor(),
                entity.getRole(),
                user.getProfileImage(),
                entity.getStatus()
        );
    }
}
