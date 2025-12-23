/**
 * HTTP 상태 코드 상수
 * @description API 응답 처리 시 사용하는 HTTP 상태 코드 정의
 * @author Ticketing Website Team
 */

export const httpStatusCode = {
    // 2xx: 성공
    OK: 200,           // 요청 성공
    CREATE: 201,       // 리소스 생성 성공 (로그인, 회원가입, 토큰 발급 등)
    ACCEPTED: 202,     // 요청 접수됨
    NO_CONTENT: 204,   // 성공했으나 응답 본문 없음

    // 4xx: 클라이언트 에러
    BAD_REQUEST: 400,       // 잘못된 요청
    UNAUTHORIZED: 401,      // 인증 실패 또는 토큰 만료
    FORBIDDEN: 403,         // 권한 없음
    NOT_FOUND: 404,         // 리소스를 찾을 수 없음
    CONFLICT: 409,          // 리소스 충돌 (중복 회원가입 등)

    // 5xx: 서버 에러
    INTERNAL_SERVER_ERROR: 500,  // 서버 내부 오류
    SERVICE_UNAVAILABLE: 503,    // 서비스 이용 불가
}
