package com.shareBook.room.dto.room;

import com.shareBook.book.service.S3Service;
import com.shareBook.room.dto.roombook.RoomBookResponseDTO;
import com.shareBook.room.entity.Member;
import com.shareBook.room.entity.Room;
import com.shareBook.room.entity.RoomBook;

import java.util.List;

public record RoomDetailResponseDTO(
        Long id,
        String name,
        String joinCode,
        Long ownerId,
        List<MemberInfo> memberInfo,
        List<RoomBookResponseDTO> bookInfo
) {
    public static RoomDetailResponseDTO from(Room room, List<Member> members, S3Service s3Service){
        return new RoomDetailResponseDTO(
                room.getId(),
                room.getName(),
                room.getJoinCode(),
                room.getOwnerId(),
                members.stream()
                        .map(m-> new MemberInfo(
                                m.getUser().getId(),
                                m.getUser().getName(),
                                m.getPenColor(),
                                m.getRole().name(),
                                m.getUser().getProfileImage()!=null ? s3Service.getPresignedUrl(m.getUser().getProfileImage()) : null
                        ))
                        .toList(),

                room.getRoomBooks().stream()
                        .map(rb-> new RoomBookResponseDTO(
                                rb.getId(),
                                rb.getBook().getTitle(),
                                rb.getBook().getAuthor(),
                                rb.getBook().getCoverImageUrl(),
                                rb.getAddedBy().getUser().getName(),
                                rb.getCreatedAt(),
                                rb.getStatus(),
                                rb.isDeleted()
                        ))
                        .toList()
        );


    }

    public record MemberInfo(Long userId, String nickname, String penColor, String role,String profileImage) {}
    /*
     roombookResponseDTO
        private Long roomBookId;
        private String title;
        private String author;
        private String coverImage;
        private String addedByName;
        private LocalDateTime addedAt;
        private BookStatus status;

     memberResponseDTO
        Long memberId,
        Long userId,
        String penColor,
        MemberRole role,
        String profileImage
     */
}
