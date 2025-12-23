/**
 * 사용자 인증 API 서비스
 * @description JWT 기반 인증 시스템을 위한 API 함수들
 * @author Ticketing Website Team
 * 
 * @note
 * - vue-ssafy 프로젝트의 callback 패턴을 참고하여 작성
 * - 백엔드 API는 /auth 경로로 시작
 * - JWT Access Token + Refresh Token 이중 인증 사용
 * - Access Token 유효기간: 1시간
 */

import { localAxios } from "@/util/http-commons"

// Axios 인스턴스 생성
const api = localAxios()

/**
 * 로그인 API
 * @description 사용자 로그인 후 Access Token과 Refresh Token 발급
 * @param {Object} credentials - 로그인 자격 증명
 * @param {string} credentials.email - 사용자 이메일
 * @param {string} credentials.password - 비밀번호
 * @param {Function} success - 성공 콜백 함수
 * @param {Function} fail - 실패 콜백 함수
 * 
 * @example
 * userConfirm(
 *   { email: "user@example.com", password: "password123" },
 *   (response) => {
 *     const accessToken = response.data["access-token"]
 *     const refreshToken = response.data["refresh-token"]
 *   },
 *   (error) => console.error(error)
 * )
 */
export async function userConfirm(credentials, success, fail) {
    await api
        .post("/auth/login", credentials)
        .then(success)
        .catch(fail)
}

/**
 * 사용자 정보 조회 API
 * @description JWT Access Token을 사용하여 사용자 정보 조회
 * @param {string} userId - 사용자 ID
 * @param {Function} success - 성공 콜백 함수
 * @param {Function} fail - 실패 콜백 함수
 * 
 * @note
 * - localStorage에서 accessToken을 가져와 Authorization 헤더에 설정
 * - 토큰이 만료되면 401 에러 반환 → fail 콜백에서 토큰 재발급 처리
 */
export async function findById(userId, success, fail) {
    // localStorage에서 Access Token 가져오기
    // Note: SessionStorage를 사용하려면 localStorage → sessionStorage로 변경
    api.defaults.headers["Authorization"] = localStorage.getItem("accessToken")

    await api
        .get(`/auth/info/${userId}`)
        .then(success)
        .catch(fail)
}

/**
 * Access Token 재발급 API
 * @description Refresh Token을 사용하여 새로운 Access Token 발급
 * @param {Object} user - 사용자 정보 (JSON 문자열)
 * @param {Function} success - 성공 콜백 함수
 * @param {Function} fail - 실패 콜백 함수
 * 
 * @note
 * - Refresh Token은 별도 헤더(refreshToken)로 전송
 * - Refresh Token도 만료되면 401 에러 → 재로그인 필요
 */
export async function tokenRegeneration(user, success, fail) {
    // localStorage에서 Refresh Token 가져와서 헤더에 설정
    api.defaults.headers["refreshToken"] = localStorage.getItem("refreshToken")

    await api
        .post("/auth/refresh", user)
        .then(success)
        .catch(fail)
}

/**
 * 로그아웃 API
 * @description 서버에서 Refresh Token 무효화 처리
 * @param {string} userId - 사용자 ID
 * @param {Function} success - 성공 콜백 함수
 * @param {Function} fail - 실패 콜백 함수
 * 
 * @note
 * - 서버에서 해당 사용자의 Refresh Token을 DB에서 삭제
 * - 클라이언트에서는 localStorage의 토큰 제거를 별도로 처리
 */
export async function logout(userId, success, fail) {
    await api
        .get(`/auth/logout/${userId}`)
        .then(success)
        .catch(fail)
}

/**
 * 회원가입 API
 * @description 새로운 사용자 등록
 * @param {Object} userData - 회원가입 정보
 * @param {string} userData.email - 이메일
 * @param {string} userData.password - 비밀번호
 * @param {string} userData.name - 이름
 * @param {string} userData.phone - 전화번호
 * @param {Function} success - 성공 콜백 함수
 * @param {Function} fail - 실패 콜백 함수
 * 
 * @note
 * - 회원가입 성공 시 자동 로그인을 원하면 토큰을 반환하도록 백엔드 구현
 */
export async function signup(userData, success, fail) {
    await api
        .post("/auth/signup", userData)
        .then(success)
        .catch(fail)
}
