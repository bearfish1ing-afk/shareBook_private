package com.shareBook.user.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class RefreshToken {
    @Id
    @GeneratedValue
    private Long id;
    private Long userId;
    private String refreshToken;
}
