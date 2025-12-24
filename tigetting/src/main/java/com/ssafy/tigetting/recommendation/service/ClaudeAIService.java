package com.ssafy.tigetting.recommendation.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.tigetting.recommendation.dto.AIRecommendationRequest;
import com.ssafy.tigetting.recommendation.dto.AIRecommendationResponse;
import com.ssafy.tigetting.recommendation.dto.PerformanceForAI;
import com.ssafy.tigetting.recommendation.dto.UserBookingHistory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.*;

/**
 * Claude AI API 호출 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClaudeAIService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${claude.api.url}")
    private String apiUrl;

    @Value("${claude.api.key}")
    private String apiKey;

    @Value("${claude.api.model}")
    private String model;

    @Value("${claude.api.max-tokens}")
    private int maxTokens;

    /**
     * 배치용 기본 추천 생성
     */
    public List<String> generateBaseRecommendations(
            List<PerformanceForAI> performances,
            Integer genreId,
            int count) {

        log.info("🤖 AI 기본 추천 생성 시작 - genreId: {}, count: {}, 공연 수: {}",
                genreId, count, performances.size());

        try {
            String prompt = buildBatchPrompt(performances, genreId, count);
            String response = callClaudeAPI(prompt);
            List<String> recommendations = parseRecommendations(response);

            log.info("✅ AI 기본 추천 생성 완료 - {} 개 추천", recommendations.size());
            return recommendations.subList(0, Math.min(count, recommendations.size()));

        } catch (Exception e) {
            log.error("❌ AI 기본 추천 생성 실패", e);
            // 폴백: 최신순으로 반환
            return performances.stream()
                    .limit(count)
                    .map(PerformanceForAI::getMt20id)
                    .toList();
        }
    }

    /**
     * 개인화 추천 생성
     */
    public List<String> personalizeRecommendations(
            List<String> baseRecommendationIds,
            List<UserBookingHistory> userHistory,
            int count) {

        log.info("🎯 AI 개인화 추천 시작 - 기본 추천: {}, 사용자 이력: {}, 목표: {}",
                baseRecommendationIds.size(), userHistory.size(), count);

        try {
            String prompt = buildPersonalizationPrompt(baseRecommendationIds, userHistory, count);
            String response = callClaudeAPI(prompt);
            List<String> recommendations = parseRecommendations(response);

            log.info("✅ AI 개인화 추천 완료 - {} 개 추천", recommendations.size());
            return recommendations.subList(0, Math.min(count, recommendations.size()));

        } catch (Exception e) {
            log.error("❌ AI 개인화 추천 실패", e);
            // 폴백: 기본 추천에서 상위 N개 반환
            return baseRecommendationIds.subList(0, Math.min(count, baseRecommendationIds.size()));
        }
    }

    /**
     * 배치용 프롬프트 생성
     */
    private String buildBatchPrompt(List<PerformanceForAI> performances, Integer genreId, int count) {
        String genreDescription = getGenreDescription(genreId);
        String criteria = getRecommendationCriteria(genreId);

        StringBuilder performancesJson = new StringBuilder();
        for (PerformanceForAI perf : performances) {
            performancesJson.append(String.format(
                    "{\"mt20id\":\"%s\",\"prfnm\":\"%s\",\"genreid\":%d,\"prfstate\":\"%s\",\"area\":\"%s\",\"fcltynm\":\"%s\",\"prfcast\":\"%s\"},",
                    perf.getMt20id(),
                    perf.getPrfnm(),
                    perf.getGenreid(),
                    perf.getPrfstate(),
                    perf.getArea(),
                    perf.getFcltynm(),
                    perf.getPrfcast() != null ? perf.getPrfcast() : ""));
        }

        return String.format("""
                다음 공연 목록에서 %s에 적합한 추천 공연 %d개를 선정해주세요.

                추천 기준:
                %s

                공연 목록:
                [%s]

                응답은 반드시 다음 JSON 형식으로만 작성해주세요. 다른 설명은 포함하지 마세요:
                {"recommendations": ["mt20id1", "mt20id2", "mt20id3", ...]}
                """,
                genreDescription,
                count,
                criteria,
                performancesJson.toString());
    }

    /**
     * 개인화 프롬프트 생성
     */
    private String buildPersonalizationPrompt(
            List<String> baseIds,
            List<UserBookingHistory> userHistory,
            int count) {

        StringBuilder historyText = new StringBuilder();
        Map<Integer, Long> genreCount = new HashMap<>();

        for (UserBookingHistory history : userHistory) {
            historyText.append(String.format("- %s (%s, 장르ID: %d)\\n",
                    history.getPrfnm(),
                    history.getArea(),
                    history.getGenreid()));
            genreCount.put(history.getGenreid(),
                    genreCount.getOrDefault(history.getGenreid(), 0L) + 1);
        }

        String preferredGenres = genreCount.entrySet().stream()
                .sorted(Map.Entry.<Integer, Long>comparingByValue().reversed())
                .limit(2)
                .map(e -> "장르ID " + e.getKey())
                .reduce((a, b) -> a + ", " + b)
                .orElse("없음");

        return String.format("""
                다음 추천 후보 목록에서 사용자의 예매 이력을 고려하여 %d개를 선정해주세요.

                사용자 예매 이력:
                %s

                선호 장르: %s

                추천 후보 ID 목록:
                %s

                응답은 반드시 다음 JSON 형식으로만 작성해주세요:
                {"recommendations": ["mt20id1", "mt20id2", ...]}
                """,
                count,
                historyText.toString(),
                preferredGenres,
                baseIds);
    }

    /**
     * Claude API 호출
     */
    private String callClaudeAPI(String prompt) throws JsonProcessingException {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);
        headers.set("anthropic-version", "2023-06-01");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("max_tokens", maxTokens);
        requestBody.put("messages", List.of(
                Map.of("role", "user", "content", prompt)));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        log.debug("📤 Claude API 요청 전송");
        ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, entity, String.class);
        log.debug("📥 Claude API 응답 수신");

        return response.getBody();
    }

    /**
     * AI 응답에서 추천 목록 파싱
     */
    private List<String> parseRecommendations(String responseBody) throws JsonProcessingException {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode content = root.path("content").get(0).path("text");
        String text = content.asText();

        // JSON 부분만 추출
        int startIdx = text.indexOf("{");
        int endIdx = text.lastIndexOf("}") + 1;
        String jsonPart = text.substring(startIdx, endIdx);

        JsonNode recommendations = objectMapper.readTree(jsonPart).path("recommendations");
        List<String> result = new ArrayList<>();
        recommendations.forEach(node -> result.add(node.asText()));

        return result;
    }

    /**
     * 장르 설명
     */
    private String getGenreDescription(Integer genreId) {
        if (genreId == null || genreId == 0) {
            return "홈페이지 (전체 장르)";
        }
        return switch (genreId) {
            case 1 -> "클래식 페이지";
            case 2 -> "콘서트 페이지";
            case 3 -> "뮤지컬 페이지";
            case 4 -> "연극 페이지";
            default -> "알 수 없는 장르";
        };
    }

    /**
     * 장르별 추천 기준
     */
    private String getRecommendationCriteria(Integer genreId) {
        if (genreId == null || genreId == 0) {
            return """
                    1. 공연 상태가 '공연중' 또는 '공연예정'인 것
                    2. 다양한 장르를 균형있게 포함
                    3. 최신 공연 우선
                    4. 유명 출연진이 있는 공연 우선
                    """;
        }
        return switch (genreId) {
            case 1 -> """
                    1. genreid가 1인 클래식/오페라 공연만 선택
                    2. 유명 오케스트라/연주자의 공연
                    3. 클래식 명곡 프로그램
                    4. 특별 기획 공연
                    """;
            case 2 -> """
                    1. genreid가 2인 콘서트 공연만 선택
                    2. 인기 아티스트의 공연
                    3. 공연 기간이 현재 진행중이거나 임박한 것
                    4. 다양한 지역 분포
                    """;
            case 3 -> """
                    1. genreid가 3인 뮤지컬 공연만 선택
                    2. 유명 작품 또는 화제성 있는 신작
                    3. 출연진이 우수한 공연
                    4. 장기 공연 중인 검증된 작품
                    """;
            case 4 -> """
                    1. genreid가 4인 연극 공연만 선택
                    2. 평단의 호평을 받은 작품
                    3. 실험적이거나 화제성 있는 작품
                    4. 유명 연출가/배우 참여 작품
                    """;
            default -> "일반적인 추천 기준";
        };
    }
}
