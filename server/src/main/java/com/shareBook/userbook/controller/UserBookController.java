package com.shareBook.userbook.controller;


import com.shareBook.book.entity.Book;
import com.shareBook.book.entity.BookStatus;
import com.shareBook.book.repository.BookRepository;
import com.shareBook.config.JwtTokenProvider; // 추가
import com.shareBook.room.entity.Room;
import com.shareBook.room.repository.RoomRepository;
import com.shareBook.user.repostiory.UserRepository; // 추가
import com.shareBook.userbook.dto.UserBookDTO;
import com.shareBook.userbook.entity.UserBook;
import com.shareBook.userbook.service.UserBookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/userbooks")
@RequiredArgsConstructor
public class UserBookController {
    private final UserBookService userBookService;
    private final RoomRepository roomRepository;
    private final BookRepository bookRepository;

    /*
    //책 추가
    @PostMapping("/add")
    public UserBookDTO addBook(@RequestParam Long userId,
                               @RequestParam Long bookId,
                               @RequestParam(required=false) Long roomId) {
        Room room= null;
        if (roomId != null) {
            room = roomRepository.findById(roomId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 방입니다."));
        }

        //bookid 받기
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 책입니다."));

        return userBookService.addBookToUser(userId, book, room);
    }
    */

    //읽고 있는 책/ 완독 책 조회
//    @GetMapping
//    public List<UserBookDTO> getUserBooks(@RequestParam Long userId, @RequestParam BookStatus status) {
//        return userBookService.getUserBooks(userId, status);
//    }

//    @GetMapping
//    public List<UserBookDTO> getUserBooks(
//            @AuthenticationPrincipal org.springframework.security.oauth2.core.user.OAuth2User oauth2User,
//            @RequestParam BookStatus status
//    ) {
//        String email = oauth2User.getAttribute("email");
//        User user = userRepository.findByEmail(email)
//                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
//        return userBookService.getUserBooks(user.getId(), status);
//    }


    @GetMapping
    public ResponseEntity<?> getUserBooks(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam BookStatus status
    ) {

        if (userDetails == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "인증 정보가 없습니다. 로그인이 필요합니다."));
        }

        String userIdStr= userDetails.getUsername();
        Long userId= Long.valueOf(userIdStr);

        List<UserBookDTO> books= userBookService.getUserBooks(userId, status);
        return ResponseEntity.ok(books);
    }

    @PostMapping("/{bookId}/last-read")
    public ResponseEntity<Void> updateLastRead(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long bookId
    ) {

        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long userId = Long.valueOf(userDetails.getUsername());

        userBookService.updateLastRead(userId, bookId);

        return ResponseEntity.ok().build();
    }

    @GetMapping("/recent")
    public ResponseEntity<?> getRecentBook(
            @AuthenticationPrincipal UserDetails userDetails
    ) {

        if (userDetails == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "인증 정보가 없습니다. 로그인이 필요합니다."));
        }

        Long userId = Long.valueOf(userDetails.getUsername());

        UserBookDTO recentBook = userBookService.getRecentBook(userId);

        return ResponseEntity.ok(recentBook);
    }


//    @PostMapping("/{userBookId}/complete")
//    public void markCompleted(@PathVariable Long userBookId) {
//        userBookService.markBookCompleted(userBookId);
//    }


}
