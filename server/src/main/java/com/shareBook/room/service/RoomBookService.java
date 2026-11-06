package com.shareBook.room.service;

import com.shareBook.book.entity.Book;
import com.shareBook.book.entity.BookStatus;
import com.shareBook.book.repository.BookRepository;
import com.shareBook.book.service.S3Service;
import com.shareBook.room.dto.member.MemberResponseDTO;
import com.shareBook.room.dto.roombook.RoomBookAddRequestDTO;
import com.shareBook.room.dto.roombook.RoomBookDetailResponseDTO;
import com.shareBook.room.dto.roombook.RoomBookResponseDTO;
import com.shareBook.room.entity.Member;
import com.shareBook.room.entity.MemberRole;
import com.shareBook.room.entity.Room;
import com.shareBook.room.entity.RoomBook;
import com.shareBook.room.repository.MemberRepository;
import com.shareBook.room.repository.RoomBookRepository;
import com.shareBook.room.repository.RoomRepository;
import com.shareBook.user.entity.User;
import com.shareBook.user.repostiory.UserRepository;
import com.shareBook.userbook.entity.UserBook;
import com.shareBook.userbook.repository.UserBookRepository;
import com.shareBook.userbook.service.UserBookService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataIntegrityViolationException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomBookService {
    private final RoomBookRepository repository;
    private final MemberRepository memberRepository;
    private final BookRepository bookRepository;
    private final UserBookService userBookService;
    private final UserRepository userRepository;
    private final S3Service s3Service;

    // 방 안 전체 도서 조회
    public List<RoomBookResponseDTO> findAll(Long roomId){
        List<RoomBook> roomBooks = repository.findAllByRoomWithMember(roomId);
        return roomBooks.stream()
                .map(this::from)
                .collect(Collectors.toList());
    }

    // 방 안 개별 도서 조회
    public RoomBookResponseDTO findBookByRoomIdAndBookId(Long roomId, Long bookId){
        RoomBook roomBook = repository.findByRoomIdAndBookId(roomId, bookId).orElseThrow(()-> new IllegalArgumentException("존재하지 않는 bookId"));
        return from(roomBook);
    }

    // 룸북으로 방 조회
    public RoomBookDetailResponseDTO findRoomBookById(Long roomBookId, Long roomId, Long userId){
        boolean isMember = memberRepository.existsByUserIdAndRoomId(userId, roomId);
        if (!isMember){
            throw new IllegalArgumentException("멤버가 아님");
        }
        RoomBook roomBook = repository.findById(roomBookId).orElseThrow(()->new IllegalArgumentException("존재하지 않는 RoomBookId"));
        return fromDetail(roomBook);
    }

    // 상태에 따라 도서 조회
    public List<RoomBookResponseDTO> findByRoomIdAndStatus(Long roomId, String status){
        try{
            BookStatus bookStatus = BookStatus.valueOf(status.toUpperCase());
            List<RoomBook> roomBooks = repository.findByRoomIdAndStatus(roomId, bookStatus);
            return roomBooks.stream()
                    .map(this::from)
                    .collect(Collectors.toList());

        } catch (IllegalArgumentException | NullPointerException e){
            throw new IllegalArgumentException("상태 값은 WISH, READING, COMPLETED 여야 함.");
        }
    }

    public List<RoomBookResponseDTO> findByRoomIdAndDeleted(Long roomId){
        try{
            List<RoomBook> roomBooks = repository.findByRoomIdAndDeleted(roomId);
            return roomBooks.stream()
                    .map(roomBook -> {
                        Book book=roomBook.getBook();
                        return RoomBookResponseDTO.builder()
                                .roomBookId(roomBook.getId())
                                .title(book.getTitle())
                                .author(book.getAuthor())
                                .coverImage(
                                        s3Service.getPresignedUrl(
                                                book.getCoverImageUrl()
                                        )
                                )
                                .addedByName(roomBook.getAddedBy().getUser().getName())
                                .addedAt(roomBook.getCreatedAt())
                                .status(roomBook.getStatus())
                                .build();

                    })
                    .collect(Collectors.toList());

        } catch (IllegalArgumentException | NullPointerException e){
            throw new IllegalArgumentException("상태 값은 WISH, READING, COMPLETED 여야 함.");
        }
    }



    // TODO: 진행률에 따라 도서 조회

    // 완독 처리
//    @Transactional
//    public RoomBookResponseDTO completeBook(Long userId, Long roomId, Long bookId){
//        RoomBook roomBook = repository.findByRoomIdAndBookId(roomId, bookId)
//                .orElseThrow(()-> new IllegalArgumentException("존재하지 않는 bookId"));
//        boolean isHost = memberRepository.existsByRoomIdAndUserIdAndRole(roomId, userId, MemberRole.HOST);
//        if (!isHost) {
//            throw new IllegalArgumentException("방장만 완독처리 가능");
//        }
//        roomBook.markAsCompleted();
//        repository.save(roomBook);
//        return from(roomBook);
//    }

    // 완독 처리
    @Transactional
    public RoomBookResponseDTO completeBook(Long roomId, Long bookId, Long userId){
        RoomBook roomBook = repository.findByRoomIdAndBookId(roomId, bookId)
                .orElseThrow(()-> new IllegalArgumentException("존재하지 않는 bookId"));
        boolean isHost = memberRepository.existsByRoomIdAndUserIdAndRole(roomId, userId, MemberRole.HOST);
        if (!isHost) {
            throw new IllegalArgumentException("방장만 완독처리 가능");
        }
        roomBook.markAsCompleted();
        List<Long> memberUserIds = memberRepository.findUserIdsByRoomId(roomId);
        userBookService.markBookCompleted(memberUserIds, bookId, roomId);
        return from(roomBook);
    }

    // 방 안에 북 추가
    @Transactional
    public RoomBookResponseDTO addBook(Long userId, Long roomId, Long bookId) {
        // 이 유저가 이 방의 멤버가 맞는가?
        Member member = memberRepository.findByUserIdAndRoomId(userId, roomId)
                .orElseThrow(()->new IllegalArgumentException("이 방의 멤버가 아닙니다."));

        if (repository.existsByRoomIdAndBookIdAndDeletedFalse(roomId, bookId)) {
            throw new IllegalArgumentException("이미 추가된 책입니다.");
        }

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new EntityNotFoundException("책 정보를 찾을 수 없습니다."));

        // 4. RoomBook 생성
        RoomBook roomBook = RoomBook.builder()
                .room(member.getRoom()) // member에서 이미 가져온 room 재사용!
                .book(book)
                .addedBy(member)        // Long ID가 아니라 Member 객체를 쏙!
                .status(BookStatus.READING)
                .build();
        userBookService.addBooksToAllMembers(roomId, book, member.getRoom());

        try{
            RoomBook saved=repository.save(roomBook);
            return from(saved);
        }catch (DataIntegrityViolationException e){
            throw new IllegalArgumentException("이미 추가된 책입니다.");
        }
    }

    @Transactional
    public void deleteRoomBook(Long userId, Long roomId, Long roomBookId) {
        RoomBook roomBook = repository.findById(roomBookId)
                .orElseThrow(() -> new IllegalArgumentException("방에 이 책이 존재하지 않습니다."));
        boolean isMember = memberRepository.existsByUserIdAndRoomId(userId, roomId);
        if (!isMember){
            throw new IllegalArgumentException("멤버가 아님");
        }
        userBookService.markBookSuspended(roomId, roomBook.getBook().getId());
        repository.delete(roomBook);
    }


    // 헬퍼메서드 ..
    public RoomBookResponseDTO from(RoomBook roomBook){
        return RoomBookResponseDTO.builder()
                .roomBookId(roomBook.getId())
                .title(roomBook.getBook().getTitle())
                .author(roomBook.getBook().getAuthor())
                .coverImage(roomBook.getBook().getCoverImageUrl())
                .addedByName(roomBook.getAddedBy().getUser().getName())
                .addedAt(roomBook.getCreatedAt())
                .status(roomBook.getStatus())
                .build();
    }

    public RoomBookDetailResponseDTO fromDetail(RoomBook roomBook) {
        String epubUrl = null;

        // S3에 EPUB 파일이 있는 경우에만 Presigned URL 생성
        if (roomBook.getBook().getEpubKey() != null) {
            epubUrl = s3Service.getPresignedUrl(
                    roomBook.getBook().getEpubKey()
            );
        }

        return RoomBookDetailResponseDTO.builder()
                .roomBookId(roomBook.getId())
                .bookId(roomBook.getBook().getId())
                .title(roomBook.getBook().getTitle())
                .author(roomBook.getBook().getAuthor())
                .epubUrl(epubUrl)
                .status(roomBook.getStatus())
                .build();
    }

}