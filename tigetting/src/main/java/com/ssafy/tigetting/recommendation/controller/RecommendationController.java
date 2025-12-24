package com.ssafy.tigetting.recommendation.controller;

import com.ssafy.tigetting.global.security.JwtUtil;
import com.ssafy.tigetting.mapper.UserMapper;
import com.ssafy.tigetting.performance.dto.PerformanceDto;
import com.ssafy.tigetting.recommendation.service.RecommendationService;
import com.ssafy.tigetting.user.entity.UserEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AI 추천 API 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final JwtUtil jwtUtil;
    private final UserMapper userMapper;

    /**
     * 페이지 렌더링용 데이터 조회 (전체 공연 + AI 추천)
     * 
     * @param pageType   페이지 타입 (0=home, 1=concert, 2=musical, 3=theater, 4=classic)
     * @param authHeader Authorization 헤더 (선택사항)
     */
    @GetMapping("/page")
    public ResponseEntity<com.ssafy.tigetting.recommendation.dto.PagePerformanceResponse> getPagePerformances(
            @RequestParam Integer pageType,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        log.info("📥 페이지 데이터 조회 요청 - pageType: {}", pageType);

        Integer userId = extractUserId(authHeader);

        com.ssafy.tigetting.recommendation.dto.PagePerformanceResponse response = recommendationService
                .getPagePerformances(pageType, userId);

        log.info("페이지 데이터 조회 완료 - 전체: {}, 추천: {}, 타입: {}",
                response.getAllPerformances().size(),
                response.getRecommendations().size(),
                response.getRecommendationType());

        return ResponseEntity.ok(response);
    }

    /**
     * 추천 공연만 조회 (기존 API - 하위 호환성 유지)
     * 
     * @param pageType   페이지 타입 (0=home, 1=concert, 2=musical, 3=theater, 4=classic)
     * @param authHeader Authorization 헤더 (선택사항)
     */
    @GetMapping
    public ResponseEntity<List<PerformanceDto>> getRecommendations(
            @RequestParam Integer pageType,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        log.info("추천 조회 요청 - pageType: {}", pageType);

        Integer userId = extractUserId(authHeader);

        List<PerformanceDto> recommendations = recommendationService.getRecommendations(pageType, userId);

        log.info("추천 조회 완료 - {} 개 반환", recommendations.size());
        return ResponseEntity.ok(recommendations);
    }

    /**
     * Authorization 헤더에서 userId 추출
     */
    private Integer extractUserId(String authHeader) {
        Integer userId = null;

        // 로그인 사용자인 경우 userId 추출
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.replace("Bearer ", "");
                String email = jwtUtil.extractUsername(token);
                UserEntity user = userMapper.findByEmail(email).orElse(null);
                if (user != null) {
                    userId = user.getUserId();
                    log.info("👤 로그인 사용자 - userId: {}", userId);
                }
            } catch (Exception e) {
                log.warn("토큰 파싱 실패, 비로그인으로 처리", e);
            }
        }

        return userId;
    }

    /**
     * 배치 작업 수동 실행 (관리자용)
     */
    @PostMapping("/batch")
    public ResponseEntity<String> runBatchManually() {
        log.info("🔧 배치 작업 수동 실행 요청");

        try {
            recommendationService.generateAllBaseRecommendations();
            return ResponseEntity.ok("배치 작업이 성공적으로 완료되었습니다.");
        } catch (Exception e) {
            log.error("배치 작업 실패", e);
            return ResponseEntity.internalServerError()
                    .body("배치 작업 실패: " + e.getMessage());
        }
    }
}
