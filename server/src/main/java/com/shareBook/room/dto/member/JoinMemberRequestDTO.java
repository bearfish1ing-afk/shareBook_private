package com.shareBook.room.dto.member;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JoinMemberRequestDTO {
    Long roomId;
    String joinCode;
    String penColor;
}
