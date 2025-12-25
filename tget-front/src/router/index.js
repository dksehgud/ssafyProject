/**
 * Vue Router 설정
 * @description 애플리케이션 라우팅 및 인증 가드 설정
 * @author Ticketing Website Team
 */

import { storeToRefs } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

// 페이지 컴포넌트 import
import HomePage from '@/pages/HomePage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import MyPage from '@/pages/MyPage.vue'
import PerformanceEditPage from '@/pages/PerformanceEditPage.vue'
import PerformanceManagementPage from '@/pages/PerformanceManagementPage.vue'
import PerformanceRegistrationPage from '@/pages/PerformanceRegistrationPage.vue'
import SignupPage from '@/pages/SignupPage.vue'
import TicketDetailPage from '@/pages/TicketDetailPage.vue'
import AdminPage from '@/pages/AdminPage.vue'

// Auth Store import
import { useAuthStore } from '@/stores/auth'

// ============================================
// Route Guard: 인증 필요 페이지 접근 제어
// ============================================

/**
 * 인증된 사용자만 접근 가능한 페이지를 위한 가드
 * @description
 * - localStorage에 저장된 Access Token을 확인
 * - 토큰이 있으면 사용자 정보를 재조회하여 유효성 검증
 * - 토큰이 만료되었으면 자동으로 Refresh Token으로 재발급 시도
 * - 토큰이 유효하지 않거나 없으면 로그인 페이지로 리다이렉트
 * 
 * @param {Route} to - 이동하려는 라우트
 * @param {Route} from - 현재 라우트
 * @param {Function} next - 다음 가드로 이동하는 함수
 * 
 * @example
 * {
 *   path: '/ticket/:id',
 *   name: 'ticket-detail',
 *   component: TicketDetailPage,
 *   beforeEnter: onlyAuthUser,  // 인증 필요
 * }
 */
const onlyAuthUser = async (to, from, next) => {
    const authStore = useAuthStore()
    const { userInfo, isValidToken } = storeToRefs(authStore)
    const { getUserInfo } = authStore

    // localStorage에서 Access Token 가져오기
    // Note: SessionStorage 사용 시 localStorage → sessionStorage로 변경
    let token = localStorage.getItem("accessToken")

    // 토큰과 사용자 정보가 있으면 유효성 재확인
    if (userInfo.value != null && token) {
        console.log("🔍 토큰 유효성 검증 중...")
        await getUserInfo(token)
    }

    // 토큰이 유효하지 않거나 사용자 정보가 없으면 로그인 페이지로
    if (!isValidToken.value || userInfo.value === null) {
        console.log("⛔ 인증 필요: 로그인 페이지로 이동")
        next({ name: "login" })
    } else {
        console.log("✅ 인증 확인: 페이지 접근 허용")
        next()
    }
}

// ============================================
// Router 생성
// ============================================

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomePage
        },
        {
            path: '/login',
            name: 'login',
            component: LoginPage,
            meta: { guestOnly: true }  // 로그인한 사용자는 접근 불가
        },
        {
            path: '/signup',
            name: 'signup',
            component: SignupPage,
            meta: { guestOnly: true }  // 로그인한 사용자는 접근 불가
        },
        {
            path: '/ticket/:id',
            name: 'ticket-detail',
            component: TicketDetailPage,
            // beforeEnter: onlyAuthUser,  // 인증이 필요한 경우 주석 해제
        },
        {
            path: '/mypage',
            name: 'mypage',
            component: MyPage,
            meta: { requiresAuth: true }  // 로그인한 사용자만 접근 가능
        },
        {
            path: '/performance-management',
            name: 'performance-management',
            component: PerformanceManagementPage,
            meta: { requiresAuth: true, requiresBusiness: true }  // 기업회원만 접근 가능
        },
        {
            path: '/performance-registration',
            name: 'performance-registration',
            component: PerformanceRegistrationPage,
            meta: { requiresAuth: true, requiresBusiness: true }  // 기업회원만 접근 가능
        },
        {
            path: '/performance/edit/:id',
            name: 'performance-edit',
            component: PerformanceEditPage,
            meta: { requiresAuth: true, requiresBusiness: true }  // 기업회원만 접근 가능
        },
        {
            path: '/admin',
            name: 'admin',
            component: AdminPage,
            meta: { requiresAuth: true, requiresAdmin: true }  // 관리자만 접근 가능
        },
    ]
})

// ============================================
// Global Navigation Guard
// ============================================

/**
 * 전역 네비게이션 가드
 * @description 모든 라우트 이동 시 실행되는 가드
 * 
 * 1. requiresAuth: 인증 필요 페이지 → 미인증 시 로그인 페이지로
 * 2. guestOnly: 게스트 전용 페이지 → 로그인 상태면 홈으로
 */
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    const isAuthenticated = authStore.isAuthenticated
    const roleType = authStore.userInfo?.roleType

    // 인증이 필요한 페이지인데 미인증 상태
    if (to.meta.requiresAuth && !isAuthenticated) {
        console.log("⛔ 인증 필요: " + to.path)
        next('/login')
    }
    // 관리자 권한이 필요한 페이지
    else if (to.meta.requiresAdmin && roleType !== 'ADMIN') {
        console.log("⛔ 관리자 권한 필요: " + to.path)
        next('/')
    }
    // 기업회원 권한이 필요한 페이지
    else if (to.meta.requiresBusiness && roleType !== 'BUSINESS') {
        console.log("⛔ 기업회원 권한 필요: " + to.path)
        next('/')
    }
    // 게스트 전용 페이지인데 로그인 상태
    else if (to.meta.guestOnly && isAuthenticated) {
        console.log("⏩ 이미 로그인됨: 홈으로 이동")
        next('/')
    }
    // 정상 진행
    else {
        next()
    }
})

export default router

