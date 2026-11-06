package com.shareBook;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.elasticsearch.ElasticsearchDataAutoConfiguration;
import org.springframework.boot.autoconfigure.data.elasticsearch.ElasticsearchRepositoriesAutoConfiguration;

import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
// 내가 참여중인 방에서 읽고 있는 책을 쭉 가져오는 api
// 내가 참여중인 방 가져올 때 내 role도 함께 가져옴

// 메인페이지

@EnableJpaAuditing
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
