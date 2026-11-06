package com.shareBook.highlight.repository;

import com.shareBook.highlight.entity.Highlight;
import com.shareBook.memo.entity.Memo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HighlightRepository extends JpaRepository<Highlight, Long> {
    @Query("select h from Highlight h " +
            "join fetch h.member " +
            "join fetch h.roomBook rb "+
            "where rb.id = :id " +
            "order by h.createdAt asc")
    List<Highlight> findAllByRoomBookId(@Param("id") Long id);


    @Query("select h from Highlight h " +
            "join fetch h.member mb " +
            "join fetch h.roomBook rb "+
            "where rb.id = :id and mb.id = :memberId")
    List<Highlight> findAllByRoomBookIdAndMemberId(@Param("id") Long id, @Param("memberId") Long memberId);

    @Query("select h from Highlight h " +
            "join fetch h.member mb " +
            "join fetch h.roomBook "+
            "where mb.id = :memberId")
    List<Highlight> findAllByMemberId(@Param("memberId") Long memberId);

    @Query("select h from Highlight h " +
            "join fetch h.member mb " +
            "join fetch h.roomBook " +
            "where mb.id in :memberIds")
    List<Highlight> findAllByMemberIdIn(List<Long> memberIds);

//    @Query("select h from Highlight h " +
//            "join fetch h.member mb " +
//            "join fetch h.roomBook " +
//            "where mb.id in :memberIds")
//    Highlight findByMemberIdAndId(@Param("memberId") Long memberId, @Param("id") Long id);

    boolean existsByHighlightIdAndMemberIdIn(Long highlightId, List<Long> memberIds);

    @Query("SELECT h FROM Highlight h " +
            "JOIN h.roomBook rb " +
            "WHERE rb.room.id = :roomId AND rb.deleted = false " +
            "ORDER BY h.createdAt DESC")
    Optional<Highlight> findLatestValidHighlight(@Param("roomId") Long roomId);

    long countByMemberIdIn(List<Long> memberIds);
}
