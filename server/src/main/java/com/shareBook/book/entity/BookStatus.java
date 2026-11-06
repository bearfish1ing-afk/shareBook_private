package com.shareBook.book.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BookStatus {
    READING,
    COMPLETED,
    WISH,
    SUSPENDED
}
