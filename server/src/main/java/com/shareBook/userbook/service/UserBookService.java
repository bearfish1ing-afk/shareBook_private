package com.shareBook.userbook.service;


import com.shareBook.book.entity.Book;
import com.shareBook.book.entity.BookStatus;
import com.shareBook.book.service.S3Service;
import com.shareBook.room.entity.Member;
import com.shareBook.room.entity.MemberStatus;
import com.shareBook.room.entity.Room;
import com.shareBook.room.entity.RoomBook;
import com.shareBook.room.repository.MemberRepository;
import com.shareBook.room.repository.RoomBookRepository;
import com.shareBook.room.repository.RoomRepository;
import com.shareBook.user.entity.User;
import com.shareBook.user.repostiory.UserRepository;
import com.shareBook.userbook.dto.UserBookDTO;
import com.shareBook.userbook.entity.UserBook;
import com.shareBook.userbook.repository.UserBookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly=true)
public class UserBookService {

    private final UserBookRepository userBookRepository;
    private final UserRepository userRepository;
    private final MemberRepository memberRepository;
    private final RoomRepository roomRepository;
    private final RoomBookRepository roomBookRepository;
    private final S3Service s3Service;

    @Transactional
    public UserBookDTO addBookToUser(Long userId, Book book, Room room) {
        User user= userRepository.findById(userId)
                .orElseThrow(()-> new IllegalArgumentException("존재하지 않는 유저입니다."));

        UserBook userBook= UserBook.builder()
                .user(user)
                .book(book)
                .status(BookStatus.READING)
                .room(room)
                .build();

        UserBook saved= userBookRepository.save(userBook);

        return UserBookDTO.builder()
                .bookId(saved.getBook().getId())
                .title(saved.getBook().getTitle())
                .author(saved.getBook().getAuthor())
                .status(saved.getStatus())
                .roomId(saved.getRoom() != null ? saved.getRoom().getId() : null)
                .build();
    }

    //새로들어온 유저에게 방의 기존 책 넣어주기
    @Transactional
    public void addRoomBooksToUser(User user, Room room){
        List<RoomBook> roomBooks=roomBookRepository.findAllByRoomId(room.getId());
        if (roomBooks.isEmpty()) return;

        List<UserBook> userBooks=roomBooks.stream()
                .map(rb->UserBook.builder()
                        .user(user)
                        .book(rb.getBook())
                        .room(room)
                        .status(rb.getStatus())
                        .build()
                ).toList();

        userBookRepository.saveAll(userBooks);
    }


    public List<UserBookDTO> getUserBooks(Long userId, BookStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        return userBookRepository.findAllByUserAndStatus(user, status)
                .stream()
                .map(ub -> {

                    String coverImageUrl = null;

                    if (ub.getBook() != null && ub.getBook().getCoverImageUrl() != null) {
                        coverImageUrl = s3Service.getPresignedUrl(
                                ub.getBook().getCoverImageUrl()
                        );
                    }

                    return UserBookDTO.builder()
                            .bookId(ub.getBook() != null ? ub.getBook().getId() : null)
                            .title(ub.getBook() != null ? ub.getBook().getTitle() : null)
                            .author(ub.getBook() != null ? ub.getBook().getAuthor() : "작가 미상")
                            .status(ub.getStatus())
                            .coverImageUrl(coverImageUrl)
                            .roomId(ub.getRoom() != null ? ub.getRoom().getId() : null)
                            .roomName(ub.getRoom() != null ? ub.getRoom().getName() : null)
                            .memberCount(
                                    ub.getRoom() != null
                                            ? memberRepository.countByRoomIdAndStatus(
                                            ub.getRoom().getId(),
                                            MemberStatus.ACTIVE
                                    )
                                            : 0
                            )
                            .startDate(ub.getStartDate())
                            .endDate(ub.getEndDate())
                            .lastReadAt(ub.getLastReadAt())
                            .build();
                })
                .collect(Collectors.toList());
    }


    @Transactional
    public void markBookCompleted(List<Long> userIds, Long bookId, Long roomId) {
        if (userIds == null || userIds.isEmpty()) return;
        List<UserBook> userBooks = userBookRepository.findByUserIdInAndBookIdAndRoomId(userIds, bookId, roomId);

        for (UserBook userBook : userBooks) {
            userBook.markAsCompleted();
        }
    }

    @Transactional
    public void addBooksToAllMembers(Long roomId, Book book, Room room){
        List<Member> members = memberRepository.findByRoomId(roomId);
        List<UserBook> userBooks = members.stream()
                .map(member -> UserBook.builder()
                        .user(member.getUser())
                        .book(book)
                        .room(room)
                        .status(BookStatus.READING)
                        .build())
                .toList();
        userBookRepository.saveAll(userBooks);

    }

    @Transactional
    public void markAllRoomBookSuspended(Long roomId){
        userBookRepository.suspendAllBooksInRoom(roomId);
    }

    @Transactional
    public void markBookSuspended(Long roomId, Long bookId){
        userBookRepository.suspendSingleBookInRoom(roomId, bookId);
    }

    @Transactional
    public void updateLastRead(Long userId, Long bookId) {
        List<UserBook> userBooks = userBookRepository.findAllByUserIdAndBookId(userId, bookId);
        if (userBooks.isEmpty()) {
            throw new IllegalArgumentException("책이 없습니다.");
        }
        userBooks.forEach(UserBook::setLastReadAt);
    }

    public UserBookDTO getRecentBook(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저가 없습니다."));

        UserBook recent = userBookRepository
                .findTopByUserAndLastReadAtIsNotNullOrderByLastReadAtDesc(user)
                .orElseThrow(() -> new IllegalArgumentException("최근 읽은 책이 없습니다."));

        String coverImageUrl = null;

        if (recent.getBook() != null && recent.getBook().getCoverImageUrl() != null) {
            coverImageUrl = s3Service.getPresignedUrl(
                    recent.getBook().getCoverImageUrl()
            );
        }

        return UserBookDTO.builder()
                .bookId(recent.getBook() != null ? recent.getBook().getId() : null)
                .title(recent.getBook() != null ? recent.getBook().getTitle() : null)
                .author(recent.getBook() != null ? recent.getBook().getAuthor() : "작가 미상")
                .status(recent.getStatus())
                .coverImageUrl(coverImageUrl)
                .roomId(recent.getRoom() != null ? recent.getRoom().getId() : null)
                .roomName(recent.getRoom() != null ? recent.getRoom().getName() : null)
                .memberCount(
                        recent.getRoom() != null
                                ? memberRepository.countByRoomIdAndStatus(
                                recent.getRoom().getId(),
                                MemberStatus.ACTIVE
                        )
                                : 0
                )
                .startDate(recent.getStartDate())
                .endDate(recent.getEndDate())
                .lastReadAt(recent.getLastReadAt())
                .build();
    }

}
