package com.shareBook.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ProfileResponse {
    private String name;       // user에서
    private String profileImage;   // user에서
    private long readingCount;     // book에서
    private long completedCount;   // book에서
    private long scrapCount;       // highlight에서
    //private List<RecentBook> recentBooks;
}
