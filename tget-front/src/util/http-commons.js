/**
 * Axios 인스턴스 생성 유틸리티
 * @description 백엔드 API 통신을 위한 Axios 인스턴스를 생성하고 기본 설정을 적용
 * @author Ticketing Website Team
 */

import axios from "axios"

// 환경 변수에서 API Base URL 가져오기
const { VITE_API_BASE_URL } = import.meta.env

/**
 * 로컬 백엔드 API용 Axios 인스턴스 생성
 * @description JWT 인증을 사용하는 백엔드 API 통신용 Axios 인스턴스
 * @returns {AxiosInstance} 설정된 Axios 인스턴스
 * 
 * @example
 * import { localAxios } from "@/util/http-commons"
 * const api = localAxios()
 * await api.get('/auth/user')
 */
export function localAxios() {
    // Axios 인스턴스 생성
    const instance = axios.create({
        baseURL: VITE_API_BASE_URL,  // 예: http://localhost:81/api
        // withCredentials: true,     // 쿠키를 사용하는 경우 활성화
    })

    // ============================================
    // 기본 헤더 설정
    // ============================================

    /**
     * Authorization 헤더 초기화
     * - API 호출 시 동적으로 토큰을 설정하므로 초기값은 빈 문자열
     * - 각 API 함수에서 localStorage에서 토큰을 가져와 설정
     */
    instance.defaults.headers.common["Authorization"] = ""

    /**
     * Content-Type 헤더 설정
     * - POST, PUT 요청 시 JSON 형식으로 데이터 전송
     */
    instance.defaults.headers.post["Content-Type"] = "application/json"
    instance.defaults.headers.put["Content-Type"] = "application/json"

    // ============================================
    // Request 인터셉터 (선택적)
    // ============================================
    // 필요한 경우 아래 주석을 해제하여 사용
    //
    // instance.interceptors.request.use(
    //   (config) => {
    //     // 모든 요청 전에 실행할 로직
    //     // 예: 로딩 스피너 표시, 토큰 자동 추가 등
    //     return config
    //   },
    //   (error) => {
    //     return Promise.reject(error)
    //   }
    // )

    // ============================================
    // Response 인터셉터 (선택적)
    // ============================================
    // Access Token 만료 시 자동 재발급 로직 구현 가능
    //
    // let isTokenRefreshing = false  // 토큰 재발급 중인지 체크
    //
    // instance.interceptors.response.use(
    //   (response) => {
    //     // 성공 응답 처리
    //     return response
    //   },
    //   async (error) => {
    //     const { config, response: { status } } = error
    //
    //     // 401 Unauthorized: Access Token 만료
    //     if (status === 401) {
    //       const originalRequest = config
    //
    //       // 토큰 재발급이 진행 중이 아닐 때만 재발급 시도
    //       if (!isTokenRefreshing) {
    //         isTokenRefreshing = true
    //
    //         try {
    //           // Refresh Token으로 새로운 Access Token 발급
    //           const refreshToken = localStorage.getItem("refreshToken")
    //           const response = await instance.post("/auth/refresh", { refreshToken })
    //
    //           const newAccessToken = response.data["access-token"]
    //           localStorage.setItem("accessToken", newAccessToken)
    //
    //           // 원래 요청 재시도
    //           originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
    //           return instance(originalRequest)
    //         } catch (refreshError) {
    //           // Refresh Token도 만료 → 로그아웃 처리
    //           localStorage.removeItem("accessToken")
    //           localStorage.removeItem("refreshToken")
    //           window.location.href = "/login"
    //           return Promise.reject(refreshError)
    //         } finally {
    //           isTokenRefreshing = false
    //         }
    //       }
    //     }
    //
    //     return Promise.reject(error)
    //   }
    // )

    return instance
}
