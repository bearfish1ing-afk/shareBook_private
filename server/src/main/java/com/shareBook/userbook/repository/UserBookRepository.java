package com.shareBook.userbook.repository;

import com.shareBook.book.entity.BookStatus;
import com.shareBook.room.entity.Room;
import com.shareBook.user.entity.User;
import com.shareBook.userbook.entity.UserBook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.ModelAttribute;

import java.util.List;
import java.util.Optional;

public interface UserBookRepository extends JpaRepository<UserBook, Long> {
    List<UserBook> findAllByUser(User user);

    @Query("select ub from UserBook ub join fetch ub.book where ub.user = :user and ub.status = :status")
    List<UserBook> findAllByUserAndStatus(User user, BookStatus status);

    //최근 책 조회용
    Optional<UserBook> findTopByUserAndLastReadAtIsNotNullOrderByLastReadAtDesc(User user);

    List<UserBook> findAllByUserIdAndBookId(Long userId, Long bookId);

    Optional<UserBook> findByUserIdAndBookId(Long userId, Long BookId);
    List<UserBook> findAllByRoom(Room room);

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO user_book (user_id, book_id, room_id, status, created_at) " +
            "SELECT m.user_id, :bookId, :roomId, 'READING', NOW() " +
            "FROM member_entity m " +
            "WHERE m.room_id = :roomId", nativeQuery = true)
    void batchInsertUserBooks(@Param("bookId") Long bookId, @Param("roomId") Long roomId);

    List<UserBook> findByUserIdInAndBookIdAndRoomId(List<Long> userIds, Long bookId, Long roomId);

    @Modifying
    @Query("UPDATE UserBook ub SET ub.status = 'SUSPENDED' " +
            "WHERE ub.book.id IN (SELECT rb.book.id FROM RoomBook rb WHERE rb.room.id = :roomId) " +
            "AND ub.user.id IN (SELECT m.user.id FROM Member m WHERE m.room.id = :roomId)")
    void suspendAllBooksInRoom(@Param("roomId") Long roomId);

    @Modifying
    @Query("UPDATE UserBook ub SET ub.status = 'SUSPENDED' " +
            "WHERE ub.book.id = :bookId " +
            "AND ub.user.id IN (SELECT m.user.id FROM Member m WHERE m.room.id = :roomId)")
    void suspendSingleBookInRoom(@Param("roomId") Long roomId, @Param("bookId") Long bookId);

    long countByUserIdAndStatus(Long userId, BookStatus status);
}
