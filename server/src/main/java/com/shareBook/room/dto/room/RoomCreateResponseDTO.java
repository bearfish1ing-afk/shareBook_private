package com.shareBook.room.dto.room;

import lombok.Builder;

@Builder
public record RoomCreateResponseDTO(
        Long roomId,
        String name,
        String joinCode,
        String inviteUrl
) {
//    public static RoomCreateResponseDTO from(Room room) {
//        return new RoomCreateResponseDTO(
//                room.getId(),
//                room.getName(),
//                room.getJoinCode()
//        );
//    }
}
