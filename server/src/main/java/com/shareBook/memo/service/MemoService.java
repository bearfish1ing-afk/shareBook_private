package com.shareBook.memo.service;

import com.shareBook.memo.dto.MemoCreateRequestDto;
import com.shareBook.memo.dto.MemoResponseDto;
import com.shareBook.memo.dto.MemoUpdateRequestDto;
import java.util.List;

public interface MemoService {
    // 메모 생성 (성공 시 생성된 메모의 Response 반환 - penColor 포함되어 있어 즉시 반영 가능)
    MemoResponseDto createMemo(Long userId, MemoCreateRequestDto requestDto);

    // 특정 방-책에 누적된 모든 메모 조회 (작성자 정보 포함)
    List<MemoResponseDto> getMemosByRoomBook(Long roomBookId);

    MemoResponseDto updateMemo(Long userId, Long memoId, MemoUpdateRequestDto requestDto);
    void deleteMemo(Long userId, Long memoId);

}