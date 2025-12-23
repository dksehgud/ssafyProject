/**
 * 헤더 컴포넌트
 * @description JWT 인증 상태에 따라 로그인/로그아웃 버튼 표시
 */

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { ChevronDown, LogOut, User } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import Button from './ui/Button.vue'

const props = defineProps<{
  selectedCategory?: string | null
}>()

const emit = defineEmits<{
  (e: 'categorySelect', category: string | null): void
}>()

const route = useRoute()
const router = useRouter()

// JWT 인증 상태 가져오기
const authStore = useAuthStore()

const isHomePage = computed(() => route.path === '/')
const isMyPage = computed(() => route.path === '/mypage')
const showNavigation = computed(() => isHomePage.value || isMyPage.value)
const isDropdownOpen = ref(false)
const isMobileMenuOpen = ref(false)

/**
 * 인증 여부 확인
 * @description JWT 토큰이 유효하고 사용자 정보가 있으면 true
 */
const isAuthenticated = computed(() => authStore.isAuthenticated)

/**
 * 사용자 정보
 * @description 로그인된 사용자의 정보
 */
const userInfo = computed(() => authStore.userInfo)

/**
 * 관리자 권한 확인
 * @description roleType이 'ADMIN'인지 확인
 */
const isAdmin = computed(() => {
  console.log("🔍 userInfo:", userInfo.value)
  console.log("🔍 roleType:", userInfo.value?.roleType)
  console.log("🔍 isAdmin:", userInfo.value?.roleType === 'ADMIN')
  return userInfo.value?.roleType === 'ADMIN'
})

/**
 * 기업 권한 확인
 * @description roleType이 'BUSINESS'인지 확인
 */
const isBusiness = computed(() => {
  console.log("🔍 userInfo:", userInfo.value)
  console.log("🔍 roleType:", userInfo.value?.roleType)
  console.log("🔍 isBusiness:", userInfo.value?.roleType === 'BUSINESS')
  return userInfo.value?.roleType === 'BUSINESS'
})


/**
 * 카테고리 선택 핸들러
 */
const handleCategoryClick = (category: string) => {
  emit('categorySelect', category)
}

/**
 * 로고 클릭 핸들러 (홈으로 이동 + 카테고리 초기화)
 */
const handleLogoClick = () => {
  emit('categorySelect', null)
}

/**
 * 드롭다운 토글
 */
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

/**
 * 마이페이지 이동
 */
const goToBookingPage = () => {
  isDropdownOpen.value = false
  router.push('/booking')
  //toast.info('예약페이지로 이동합니다')
}

/**
 * 회원정보 이동
 */
const goToMyPage = () => {
  isDropdownOpen.value = false
  router.push('/mypage')
  //toast.info('마이페이지로 이동합니다')
}

/**
 * 대시보드 이동 (관리자 전용)
 */
const goToDashboard = () => {
  isDropdownOpen.value = false
  router.push('/dashboard')
  //toast.info('관리자 대시보드로 이동합니다')
}

/**
 * 대시보드 이동 (기업 전용)
 */
const goToBusiness = () => {
  isDropdownOpen.value = false
  router.push('/performance-management')
  //toast.info('공연 관리 대시보드로 이동합니다')
}

/**
 * 로그아웃 핸들러
 * @description JWT 토큰 삭제 및 사용자 정보 초기화
 */
const handleLogout = async () => {
  try {
    isDropdownOpen.value = false
    // authStore의 userLogout 호출
    await authStore.userLogout()
    
    // 로그아웃 성공 알림
    toast.success('로그아웃되었습니다')
    
    // 홈페이지로 이동
    router.push('/')
  } catch (error) {
    console.error("로그아웃 에러:", error)
    toast.error('로그아웃 실패')
  }
}
</script>

<template>
  <header class="fixed top-0 w-full bg-black/90 backdrop-blur-md border-b border-gray-800 z-50">
    <div class="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
      <div class="flex items-center gap-4 sm:gap-8">
        <RouterLink to="/" class="flex items-center gap-2" @click="handleLogoClick">
          <span class="text-xl sm:text-2xl font-bold text-red-600">TGet</span>
        </RouterLink>

        <!-- Desktop Navigation -->
        <nav v-if="showNavigation" class="hidden lg:flex items-center gap-4 xl:gap-6">
          <button
            v-for="category in ['콘서트', '뮤지컬', '연극', '클래식']"
            :key="category"
            @click="handleCategoryClick(category)"
            class="transition-colors text-sm xl:text-base"
            :class="selectedCategory === category ? 'text-red-600' : 'text-gray-300 hover:text-red-600'"
          >
            {{ category }}
          </button>
        </nav>

        <!-- Mobile Menu Button -->
        <button 
          v-if="showNavigation"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
          class="lg:hidden text-gray-300 hover:text-white p-2"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>

      <!-- User Menu -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- 로그인 상태: 사용자 드롭다운 메뉴 -->
        <template v-if="isAuthenticated">
          <div class="relative">
            <!-- 사용자 이름 버튼 -->
            <button 
              @click="toggleDropdown"
              class="flex items-center gap-1 sm:gap-2 text-gray-300 hover:text-white transition-colors px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-800"
            >
              <User class="h-4 w-4 sm:h-5 sm:w-5" />
              <span class="hidden sm:inline text-sm">{{ userInfo?.name ? userInfo.name + '님' : userInfo?.email }}</span>
              <ChevronDown class="h-3 w-3 sm:h-4 sm:w-4 transition-transform" :class="{ 'rotate-180': isDropdownOpen }" />
            </button>

            <!-- 드롭다운 메뉴 -->
            <Transition name="dropdown">
              <div 
                v-if="isDropdownOpen"
                class="absolute right-0 mt-2 w-44 sm:w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl overflow-hidden"
              >
                <!-- 관리자 전용 메뉴 -->
                <template v-if="isAdmin">
                  <div class="border-t border-gray-800"></div>
                  <button
                    @click="goToDashboard"
                    class="w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-800 hover:text-blue-500 transition-colors flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="7" height="7"></rect>
                      <rect x="14" y="3" width="7" height="7"></rect>
                      <rect x="14" y="14" width="7" height="7"></rect>
                      <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                    관리자 대시보드
                  </button>
                </template>

                <!-- 기업회원 전용 메뉴 -->
                <template v-if="isBusiness">
                  <div class="border-t border-gray-800"></div>
                  <button
                    @click="goToBusiness"
                    class="w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-800 hover:text-blue-500 transition-colors flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="7" height="7"></rect>
                      <rect x="14" y="3" width="7" height="7"></rect>
                      <rect x="14" y="14" width="7" height="7"></rect>
                      <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                    공연관리 대시보드
                  </button>
                </template>

                <button
                  @click="goToMyPage"
                  class="w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2"
                >
                  <User class="h-4 w-4" />
                  마이페이지
                </button>

                <div class="border-t border-gray-800"></div>
                <button
                  @click="handleLogout"
                  class="w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-800 hover:text-red-500 transition-colors flex items-center gap-2"
                >
                  <LogOut class="h-4 w-4" />
                  로그아웃
                </button>
              </div>
            </Transition>
          </div>
        </template>

        <!-- 비로그인 상태: 로그인 + 회원가입 -->
        <template v-else>
          <Button 
            variant="ghost" 
            class="text-white hover:text-red-600 text-sm px-3 sm:px-4"
            @click="router.push('/login')"
          >
            로그인
          </Button>
          <Button 
            class="bg-red-600 hover:bg-red-700 text-white text-sm px-3 sm:px-4"
            @click="router.push('/signup')"
          >
            회원가입
          </Button>
        </template>
      </div>
    </div>

    <!-- Mobile Navigation Menu -->
    <Transition name="dropdown">
      <div v-if="isMobileMenuOpen && showNavigation" class="lg:hidden bg-gray-900 border-t border-gray-800">
        <nav class="container mx-auto px-4 py-4 flex flex-col gap-2">
          <button 
            v-for="category in ['콘서트', '뮤지컬', '연극', '클래식']"
            :key="category"
            @click="handleCategoryClick(category); isMobileMenuOpen = false"
            class="text-left px-4 py-3 rounded-lg transition-colors"
            :class="selectedCategory === category ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-800'"
          >
            {{ category }}
          </button>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
