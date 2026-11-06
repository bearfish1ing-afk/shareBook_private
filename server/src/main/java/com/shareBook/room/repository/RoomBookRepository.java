package com.shareBook.room.repository;


import com.shareBook.book.entity.BookStatus;
import com.shareBook.room.dto.roombook.RoomBookResponseDTO;
import com.shareBook.room.entity.RoomBook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
/*
    private Long roomBookId;
    private String title;
    private String author;
    private String coverImage;

    private String addedByName;
    private LocalDateTime addedAt;

    private BookStatus status;
*/

public interface RoomBookRepository extends JpaRepository<RoomBook, Long> {
    List<RoomBook> findByRoomId(Long roomId);

    List<RoomBook> findAllByRoomId(Long roomId);
    @Query("select rb from RoomBook rb " +
            "join fetch rb.book b " +
            "join fetch rb.room r "+
            "where rb.id = :roomBookId")
    Optional<RoomBook> findById(@Param("roomBookId") Long id);

    @Query("select rb from RoomBook rb " +
            "join fetch rb.addedBy m " +
            "join fetch m.user u " +
            "join fetch rb.book "+
            "where rb.room.id = :roomId") // fetch join : roombook 가져올 때 연결된 멤버랑 그 유저 정보까지 한번에 다 붙여서 가져옴
    List<RoomBook> findAllByRoomWithMember(@Param("roomId") Long roomId);

    @Query("select rb from RoomBook rb " +
            "join fetch rb.room r " +
            "join fetch rb.book b " +
            "where r.id = :roomId and b.id = :bookId and rb.deleted=false")
    Optional<RoomBook> findByRoomIdAndBookId( Long roomId, Long bookId);

    @Query("select rb from RoomBook rb " +
            "join fetch rb.addedBy m " +
            "join fetch m.user u " +
            "join fetch rb.book "+
            "where rb.room.id = :roomId and rb.status = :status")
    List<RoomBook> findByRoomIdAndStatus(@Param("roomId") Long roomId, @Param("status") BookStatus status);

    @Query("select rb from RoomBook rb " +
            "join fetch rb.addedBy m " +
            "join fetch m.user u " +
            "join fetch rb.book "+
            "where rb.room.id = :roomId and rb.deleted = false")
    List<RoomBook> findByRoomIdAndDeleted(@Param("roomId") Long roomId);

    boolean existsByRoomIdAndBookIdAndDeletedFalse(Long roomId, Long bookId);
}
