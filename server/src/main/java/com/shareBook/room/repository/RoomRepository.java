package com.shareBook.room.repository;

import com.shareBook.room.entity.MemberStatus;
import com.shareBook.room.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByJoinCode(String joinCode);
    List<Room> findAllByOwnerId(Long ownerId);
    boolean existsByJoinCode(String code);
    List<Room> findAllByMembersUserId(Long userId);

    Optional<Room> findByOwnerIdAndId(Long ownerId, Long Id);

    @Query("SELECT r FROM Room r " +
            "LEFT JOIN FETCH r.roomBooks rb " + // 책 리스트 미리 가져오기
            "LEFT JOIN FETCH rb.book " +        // 책 정보 미리 가져오기
            "LEFT JOIN FETCH rb.addedBy m " +   // 등록자 정보 미리 가져오기
            "LEFT JOIN FETCH m.user " +         // 유저 이름 미리 가져오기
            "WHERE r.id = :roomId")
    Optional<Room> findDetailById(@Param("roomId") Long roomId);

    @Query("SELECT r FROM Room r " +
            "LEFT JOIN FETCH r.roomBooks rb " +  // 책 목록 조인
            "LEFT JOIN FETCH rb.book " +         // 책 정보 조인
            "LEFT JOIN FETCH rb.addedBy m " +    // 등록 멤버 조인
            "LEFT JOIN FETCH m.user " +          // 등록 유저 이름 조인
            "WHERE r.joinCode = :joinCode")
    Optional<Room> findByJoinCodeWithDetails(@Param("joinCode") String joinCode);

    List<Room> findAllByMembersUserIdAndMembersStatus(
            Long userId,
            MemberStatus status
    );
}
