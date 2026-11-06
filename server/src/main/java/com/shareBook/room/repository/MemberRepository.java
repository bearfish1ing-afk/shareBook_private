package com.shareBook.room.repository;

import com.shareBook.room.entity.Member;
import com.shareBook.room.entity.MemberRole;
import com.shareBook.room.entity.MemberStatus;
import com.shareBook.room.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {
    boolean existsByUserIdAndRoomId(Long userId, Long roomId); // 방 안의 사용자 존재 여부 확인
    boolean existsByRoomIdAndPenColor(Long roomId, String penColor); // 색이 사용중인지 확인
    List<Member> findByRoomId(Long roomId);//방 아이디로 방을 찾은 후 그 안에 있는 member나열용
    long countByRoomId(Long roomId);

    // 특정 유저가 이 방의 멤버인지 확인
    @Query("select m from Member m " +
            "join fetch m.room " +
            "where m.user.id = :userId and m.room.id = :roomId")
    Optional<Member> findByUserIdAndRoomId(@Param("userId") Long userId, @Param("roomId") Long roomId);


    // 방에 속한 멤버 조회
    @Query("select m from Member m " +
            "join fetch m.user " +
            "where m.room.id = :roomId")
    List<Member> findAllByRoomIdWithUser(@Param("roomId") Long roomId);

    boolean existsByRoomIdAndUserIdAndRole(Long roomId, Long userId, MemberRole role);

    @Query("SELECT m.user.id FROM Member m "+
            "WHERE m.room.id = :roomId")
    List<Long> findUserIdsByRoomId(@Param("roomId") Long roomId);

    // 특정 유저에 연관되어있는 모든 멤버 엔티티 찾기
    @Query("SELECT m from Member m "+
            "join fetch m.user u "+
            "WHERE u.id = :userId")
    List<Member> findAllByUserId(@Param("userId") Long userId);

    //방에 있는 모든 사람 소프트삭제
    @Modifying
    @Query("UPDATE Member m SET m.status = 'ENDED' " +
            "WHERE m.room.id = :roomId ")
    void endMemberRoom(@Param("roomId") Long roomId);

    //방에 있는 사람을 방장이 소프트삭제//자기 스스로 소프트 삭제
    @Modifying
    @Query("UPDATE Member m SET m.status = 'ENDED' "+
            "WHERE m.user.id = :userId AND m.room.id = :roomId")
    void endPersonMemberRoom(@Param("userId") Long userId,@Param("roomId") Long roomId);

    @Modifying
    @Query("UPDATE Member m SET m.status = 'ACTIVE' " +
            "WHERE m.room.id = :roomId AND m.status='ENDED'")
    void returnMemberRoom(@Param("roomId") Long roomId);

    // Member 엔티티에서 userId로 memberId들을 뽑기
    @Modifying
    @Query("select m.id from Member m where m.user.id = :userId")
    List<Long> findMemberIdsByUserId(@Param("userId") Long userId);

    List<Member> findByRoomIdAndStatus(Long roomId, MemberStatus status);

    boolean existsByRoomIdAndPenColorAndStatus(Long roomId, String penColor, MemberStatus status);

    long countByRoomIdAndStatus(Long roomId, MemberStatus status);

    @Query("select m from Member m join fetch m.user where m.room.id = :roomId and m.status = :status")
    List<Member> findAllByRoomIdAndStatusWithUser(@Param("roomId") Long roomId, @Param("status") MemberStatus status);

    Optional<Member> findByUserIdAndRoomIdAndStatus(Long userId, Long roomId, MemberStatus status);

    boolean existsByUserIdAndRoomIdAndStatus(Long userId, Long roomId, MemberStatus memberStatus);
}
