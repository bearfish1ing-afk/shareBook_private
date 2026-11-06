package com.shareBook.user.controller;

import com.shareBook.book.entity.BookStatus;
import com.shareBook.book.repository.BookRepository;
import com.shareBook.book.service.S3Service;
import com.shareBook.config.JwtTokenProvider;
import com.shareBook.highlight.repository.HighlightRepository;
import com.shareBook.room.dto.member.JoinMemberRequestDTO;
import com.shareBook.room.repository.MemberRepository;
import com.shareBook.room.repository.RoomBookRepository;
import com.shareBook.user.dto.ProfileResponse;
import com.shareBook.user.dto.UserNameProfileRequest;
import com.shareBook.user.dto.UserNameProfileResponse;
import com.shareBook.user.entity.User;
import com.shareBook.user.repostiory.UserRepository;
import com.shareBook.user.service.UserService;
import com.shareBook.userbook.repository.UserBookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/user")
public class UserController {
    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;
    private final UserBookRepository userBookRepository;
    private final RoomBookRepository roomBookRepository;
    private final UserRepository userRepository;
    private final MemberRepository memberRepository;
    private final HighlightRepository highlightRepository;
    private final S3Service s3Service;

    @PatchMapping(value = "/update",consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserNameProfileResponse> userUpdateApi(@RequestHeader("Authorization")String authorization, @RequestParam("name") String name, @RequestParam(value="profileImage",required = false) MultipartFile profileImage) throws IOException {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("유효하지 않은 토큰 형식입니다.");
        }

        String token = authorization.substring(7);
        Long userId=Long.valueOf(jwtTokenProvider.getUserId(token));

        String imageKey=null;
        if(profileImage!=null && !profileImage.isEmpty()){
            imageKey= s3Service.uploadProfileImage(profileImage);
        }
        User user=userService.updateNameProfile(userId, name, imageKey);
        return ResponseEntity.ok(UserNameProfileResponse.from(user));
    }

    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> getBookCounts(
            @RequestHeader("Authorization") String authorization) {

        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("유효하지 않은 토큰 형식입니다.");
        }

        String token = authorization.substring(7);
        Long userId = Long.valueOf(jwtTokenProvider.getUserId(token));

        User user = userRepository.findById(userId).orElseThrow();

        long reading   = userBookRepository.countByUserIdAndStatus(userId, BookStatus.READING);
        long completed = userBookRepository.countByUserIdAndStatus(userId, BookStatus.COMPLETED);

        List<Long> memberIds = memberRepository.findMemberIdsByUserId(userId);
        long scrapCount = memberIds.isEmpty() ? 0 : highlightRepository.countByMemberIdIn(memberIds);

        String imageUrl = null;
        if (user.getProfileImage() != null && !user.getProfileImage().isBlank()) {
            imageUrl = s3Service.getPresignedUrl(user.getProfileImage());
        }

        ProfileResponse res = ProfileResponse.builder()
                .name(user.getName())
                .profileImage(imageUrl)
                .readingCount(reading)
                .completedCount(completed)
                .scrapCount(scrapCount)
                .build();

        return ResponseEntity.ok(res);
    }

}
