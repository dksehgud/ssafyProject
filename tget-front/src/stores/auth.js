/**
 * 인증 상태 관리 스토어 (Auth Store)
 * @description JWT 기반 인증 시스템을 위한 Pinia 스토어
 * @author Ticketing Website Team
 *
 * @note
 * - vue-ssafy 프로젝트의 JWT 인증 패턴 적용
 * - Access Token (1시간) + Refresh Token (장기) 이중 인증
 * - 자동 토큰 재발급 로직 포함
 * - localStorage 사용 (탭을 닫아도 로그인 유지)
 *   → SessionStorage로 변경 시: localStorage → sessionStorage로 모두 변경
 */

import { jwtDecode } from "jwt-decode";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

// API 함수 import
import { authService } from "@/api/authService";
import { findById, logout, signup, tokenRegeneration } from "@/api/user";
import { httpStatusCode } from "@/util/http-status";

export const useAuthStore = defineStore("auth", () => {
  const router = useRouter();

  // ============================================
  // 상태 (State)
  // ============================================

  /**
   * 로그인 여부
   * @type {Ref<boolean>}
   */
  const isLogin = ref(false);

  /**
   * 로그인 에러 발생 여부
   * @type {Ref<boolean>}
   */
  const isLoginError = ref(false);

  /**
   * 사용자 정보
   * @type {Ref<Object|null>}
   * @description JWT에서 추출한 사용자 정보 또는 API에서 받은 사용자 정보
   */

  // refacor : LocalStorage에서 사용자 정보 복원 (새로고침 시 데이터 유지)
  const userInfo = ref(JSON.parse(localStorage.getItem("userInfo")) || null);

  /**
   * 토큰 유효성 상태
   * @type {Ref<boolean>}
   * @description Access Token이 유효한지 여부
   */
  const isValidToken = ref(false);

  // 새로고침 시 LocalStorage에 토큰이 있다면 로그인 상태로 복구
  if (localStorage.getItem("accessToken")) {
    isValidToken.value = true;
    isLogin.value = true;
  }

  // ============================================
  // Getters (Computed)
  // ============================================

  /**
   * 인증 여부 확인
   * @returns {boolean} 토큰이 유효하고 사용자 정보가 있으면 true
   */
  const isAuthenticated = computed(() => isValidToken.value && userInfo.value !== null);

  // ============================================
  // Actions (Functions)
  // ============================================

  /**
   * 로그인
   * @description 사용자 로그인 후 Access Token을 localStorage에 저장
   * @param {Object} loginUser - 로그인 자격 증명
   * @param {string} loginUser.email - 이메일 (백엔드: userEmail)
   * @param {string} loginUser.password - 비밀번호
   * @returns {Promise<boolean>} 로그인 성공 여부
   *
   * @note
   * - 백엔드 AuthResponse: { accessToken, roleType }
   * - 백엔드는 accessToken만 반환 (refreshToken 미지원)
   *
   * @example
   * const authStore = useAuthStore()
   * await authStore.userLogin({ email: "user@example.com", password: "password123" })
   */
  const userLogin = async (loginUser) => {
    // 백엔드가 기대하는 필드명으로 변환 (email → userEmail)
    const loginRequest = {
      userEmail: loginUser.email,
      password: loginUser.password,
    };

    try {
      // authService.login 사용 (Promise 기반)
      const response = await authService.login(loginRequest);

      // ========== 로그인 성공 ==========
      console.log("✅ 로그인 성공!", response);

      // 응답에서 토큰 추출
      let accessToken = response.accessToken;
      let roleType = response.roleType || "USER";
      let backendUserInfo = response.userInfo;

      // roleType을 userInfo에 추가
      if (backendUserInfo) {
        backendUserInfo.roleType = roleType;
      }

      // 상태 업데이트
      isLogin.value = true;
      isLoginError.value = false;
      isValidToken.value = true;
      userInfo.value = backendUserInfo;

      // localStorage에 토큰 및 사용자 정보 저장
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("userInfo", JSON.stringify(userInfo.value));

      console.log("🔑 Access Token 저장 완료");
      console.log("👤 사용자 정보:", userInfo.value);
      console.log("🔐 권한 타입:", roleType);

      return response;
    } catch (error) {
      // ========== 로그인 실패 ==========
      console.error("❌ 로그인 실패:", error);
      isLogin.value = false;
      isLoginError.value = true;
      isValidToken.value = false;
      throw error;
    }
  };

  /**
   * 사용자 정보 조회
   * @description JWT Access Token을 디코드하여 userId를 추출하고, 해당 사용자 정보를 API에서 조회
   * @param {string} token - JWT Access Token
   *
   * @note
   * - JWT 토큰에서 userId 추출 (jwt-decode 사용)
   * - 토큰이 만료되면 자동으로 tokenRegenerate() 호출
   */
  const getUserInfo = async (token) => {
    // JWT 토큰 디코드하여 payload 정보 추출
    let decodeToken = jwtDecode(token);
    console.log("🔓 JWT 디코드 결과:", decodeToken);

    // userId로 사용자 정보 조회
    await findById(
      decodeToken.userId,
      (response) => {
        // ========== 조회 성공 ==========
        if (response.status === httpStatusCode.OK) {
          userInfo.value = response.data.userInfo;
          console.log("👤 사용자 정보 조회 성공:", userInfo.value);
        } else {
          console.log("⚠️ 사용자 정보 없음");
        }
      },
      async (error) => {
        // ========== 조회 실패 (토큰 만료 등) ==========
        console.error(
          "⏰ 토큰 만료 또는 에러:",
          error.response?.status,
          error.response?.statusText
        );

        // 토큰 유효성을 false로 설정
        isValidToken.value = false;

        // Refresh Token으로 Access Token 재발급 시도
        await tokenRegenerate();
      }
    );
  };

  /**
   * Access Token 재발급
   * @description Refresh Token을 사용하여 새로운 Access Token을 발급받음
   *
   * @note
   * - Refresh Token도 만료된 경우 자동 로그아웃 후 로그인 페이지로 이동
   * - 재발급 성공 시 localStorage의 Access Token 업데이트
   */
  const tokenRegenerate = async () => {
    await tokenRegeneration(
      JSON.stringify(userInfo.value),
      (response) => {
        // ========== 재발급 성공 ==========
        if (response.status === httpStatusCode.CREATE) {
          let accessToken = response.data["access-token"];

          // localStorage에 새로운 Access Token 저장
          localStorage.setItem("accessToken", accessToken);
          isValidToken.value = true;

          console.log("🔄 Access Token 재발급 성공");
        }
      },
      async (error) => {
        // ========== 재발급 실패 (Refresh Token 만료) ==========
        // HttpStatus 401: Refresh Token 기간 만료 → 재로그인 필요
        if (error.response?.status === httpStatusCode.UNAUTHORIZED) {
          // 서버에서 Refresh Token 제거
          await logout(
            userInfo.value.userId,
            (response) => {
              if (response.status === httpStatusCode.OK) {
                console.log("✅ 서버에서 Refresh Token 제거 성공");
              } else {
                console.log("⚠️ Refresh Token 제거 실패");
              }

              // 사용자에게 알림
              alert("RefreshToken 기간 만료!! 다시 로그인해 주세요.");

              // 상태 초기화
              isLogin.value = false;
              userInfo.value = null;
              isValidToken.value = false;

              // 로그인 페이지로 이동
              router.push({ name: "login" });
            },
            (error) => {
              console.error("❌ Logout 에러:", error);
              isLogin.value = false;
              userInfo.value = null;
            }
          );
        }
      }
    );
  };

  /**
   * 회원가입
   * @description 새로운 사용자 등록
   * @param {Object} userData - 회원가입 정보
   * @param {string} userData.email - 이메일
   * @param {string} userData.password - 비밀번호
   * @param {string} userData.name - 이름
   * @param {string} userData.phone - 전화번호
   * @returns {Promise<Object>} 회원가입 결과
   *
   * @note
   * - 회원가입 성공 시 자동 로그인 옵션 (백엔드에서 토큰 반환 시)
   */
  const userSignup = async (userData) => {
    return new Promise((resolve, reject) => {
      signup(
        userData,
        (response) => {
          // ========== 회원가입 성공 ==========
          console.log("✅ 회원가입 성공!");
          let { data } = response;

          // 백엔드에서 토큰을 반환하면 자동 로그인 처리
          if (data["access-token"]) {
            let accessToken = data["access-token"];
            let refreshToken = data["refresh-token"];

            isLogin.value = true;
            isValidToken.value = true;
            userInfo.value = data.userInfo;

            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);

            // [추가된 코드] 사용자 정보도 LocalStorage에 저장
            localStorage.setItem("userInfo", JSON.stringify(userInfo.value));

            console.log("🔑 회원가입 후 자동 로그인 완료");
          }

          resolve(data);
        },
        (error) => {
          // ========== 회원가입 실패 ==========
          console.error("❌ 회원가입 실패:", error);
          reject(error);
        }
      );
    });
  };

  /**
   * 로그아웃
   * @description 서버에서 Refresh Token 삭제 및 클라이언트 토큰 제거
   *
   * @note
   * - 서버에서 Refresh Token을 DB에서 삭제
   * - localStorage에서 모든 토큰 제거
   * - 상태 초기화
   */
  const userLogout = async () => {
    console.log("🚪 로그아웃 시도: " + userInfo.value?.userId);

    // API 호출을 위해 userId 백업
    const targetUserId = userInfo.value?.userId;

    // [수정] API 호출 결과와 무관하게 클라이언트 로그아웃 즉시 수행
    isLogin.value = false;
    userInfo.value = null;
    isValidToken.value = false;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userInfo");
    console.log("✅ 클라이언트 로그아웃 완료 (상태 초기화)");

    if (targetUserId) {
      await logout(
        targetUserId,
        (response) => {
          // [기존 코드 주석 처리]
          // if (response.status === httpStatusCode.OK) {
          //     isLogin.value = false ...
          // }
          console.log("✅ 서버 로그아웃 요청 전송 완료");
        },
        (error) => {
          console.error("❌ 로그아웃 에러 (서버):", error);
        }
      );
    }
  };

  // ============================================
  // Return (Expose to components)
  // ============================================
  return {
    // State
    isLogin,
    isLoginError,
    userInfo,
    isValidToken,

    // Getters
    isAuthenticated,

    // Actions
    userLogin,
    getUserInfo,
    tokenRegenerate,
    userSignup,
    userLogout,
  };
});
