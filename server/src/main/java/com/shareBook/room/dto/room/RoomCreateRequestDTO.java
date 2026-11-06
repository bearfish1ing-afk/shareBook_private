package com.shareBook.room.dto.room;

import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class RoomCreateRequestDTO {
    private String name;
    @Pattern(regexp = "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
            message = "올바른 색상 코드 형식이 아닙니다. (예: #FF0000)")
    private String penColor; // 방장 펜컬러
}
