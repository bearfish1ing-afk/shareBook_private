package com.shareBook.memo.repository;

import com.shareBook.memo.entity.Memo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MemoRepository extends JpaRepository<Memo, Long> {

    // 1. 특정 RoomBook에 달린 모든 메모를 작성일 순(과거순)으로 정렬해서 가져오기
    // (roomBookId -> id 로 변경)
    List<Memo> findByRoomBook_IdOrderByCreatedAtAsc(Long roomBookId);

    // 2. 특정 문자(cfi)에 달린 메모들만 가져오기
    // (roomBookId -> id 로 변경)
    List<Memo> findByRoomBook_IdAndCfi(Long roomBookId, String cfi);


    // 3. Member를 페치 조인으로 한 번에 묶어서 가져오기
    // (m.roomBook.Id -> m.roomBook.id 로 소문자 변경)
    @Query("select m from Memo m join fetch m.member where m.roomBook.id = :id order by m.createdAt asc")
    List<Memo> findAllWithMember(@Param("id") Long id);


    // Memo -> Member -> User까지 한 번에 Graph를 묶어서 조회합니다.
    @Query("select m from Memo m " +
            "join fetch m.member mb " +
            "join fetch mb.user u " +
            "where m.memoId = :memoId")
    Optional<Memo> findByIdWithMemberAndUser(@Param("memoId") Long memoId);


}