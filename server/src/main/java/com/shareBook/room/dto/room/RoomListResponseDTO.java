package com.shareBook.room.dto.room;

import com.shareBook.room.entity.Member;
import com.shareBook.room.entity.Room;
import lombok.Builder;

@Builder
public record RoomListResponseDTO(
        Long roomId,
        String name,
        Boolean isHost,
        Integer memberCount,
        String penColor,
        Integer bookCount
) {
    public static RoomListResponseDTO from(Room room, Long userId) {
        return RoomListResponseDTO.builder()
                .roomId(room.getId())
                .name(room.getName())
                .isHost(room.getOwnerId().equals(userId))
                .memberCount(room.getMembersCount())
                .penColor(room.getMembers().stream()
                        .filter(m->m.getUser().getId().equals(userId))
                        .findFirst()
                        .map(Member::getPenColor)
                        .orElse("#000000"))
                .bookCount(room.getRoomBooks().size())
                .build();
    }


}
