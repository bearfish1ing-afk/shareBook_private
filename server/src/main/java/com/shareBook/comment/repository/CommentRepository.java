package com.shareBook.comment.repository;

import com.shareBook.comment.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {


    // 특정 '방 멤버(Member)'가 작성한 코멘트 모아보기 (Member의 PK인 id 기준)
    List<Comment> findByMember_Id(Long memberId);

    @Query("select c from Comment c " +
            "join fetch c.member mb " +
            "join fetch mb.user u " +
            "where c.commentId = :commentId")
    Optional<Comment> findByIdWithMemberAndUser(@Param("commentId") Long commentId);

    //특정 메모(Memo)에 달린 모든 코멘트를 과거순(등록순)으로 정렬해서 가져오기
    @Query("SELECT c FROM Comment c " +
            "JOIN FETCH c.member m " +
            "JOIN FETCH m.user u " +
            "WHERE c.memo.id = :memoId " +
            "ORDER BY c.createdAt ASC")
    List<Comment> findByMemo_MemoIdOrderByCreatedAtAsc(@Param("memoId") Long memoId);

}
