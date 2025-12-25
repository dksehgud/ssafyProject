<template>
  <div class="min-h-screen bg-black flex">
    <!-- 사이드바 -->
    <aside
      class="fixed left-0 top-0 h-full w-[240px] bg-gradient-to-b from-gray-900 to-black border-r border-gray-800 z-50 transition-transform duration-300"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- 로고 -->
      <div class="p-4 border-b border-gray-800">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl text-red-600 mb-0.5">ADMIN</h1>
            <p class="text-xs text-gray-400">관리자 페이지</p>
          </div>
        </div>
      </div>

      <!-- 메뉴 -->
      <nav class="p-3 space-y-1.5">
        <button
          v-for="item in menuItems"
          :key="item.id"
          @click.stop="handleMenuClick(item.id)"
          class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-sm"
          :class="activeTab === item.id
            ? 'bg-red-600 text-white'
            : 'text-gray-400 hover:bg-gray-800 hover:text-white'"
        >
          <component :is="item.icon" class="w-4 h-4" />
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <!-- 하단 액션 -->
      <div class="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-800 space-y-1.5">
        <!-- 회원 모드로 전환 -->
        <button
          @click.stop="router.push('/')"
          class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all text-sm"
        >
          <User class="w-4 h-4" />
          <span>회원 모드</span>
        </button>

        <!-- 로그아웃 -->
        <button
          @click.stop="handleLogout"
          class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all text-sm"
        >
          <LogOut class="w-4 h-4" />
          <span>로그아웃</span>
        </button>
      </div>
    </aside>

    <!-- 메인 컨텐츠 -->
    <div class="flex-1 w-full">
      <div
        class="transition-all duration-300 min-h-screen"
        :class="sidebarOpen ? 'lg:ml-[240px]' : 'ml-0'"
      >
      <!-- 헤더 -->
      <header class="bg-gradient-to-r from-gray-900 to-black border-b border-gray-800 sticky top-0 z-30">
        <div class="flex items-center justify-between p-4">
          <div class="flex items-center gap-3">
            <button
              @click="sidebarOpen = !sidebarOpen"
              class="w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
            >
              <Menu class="w-5 h-5 text-white" />
            </button>
            <h2 class="text-xl text-white">
              {{ currentTabLabel }}
            </h2>
          </div>

          <div class="flex items-center gap-3">
            <div class="text-right">
              <p class="text-sm text-white">{{ userInfo?.name || 'Admin User' }}</p>
              <p class="text-xs text-gray-400">{{ userInfo?.email || 'admin@example.com' }}</p>
            </div>
            <div class="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center">
              <span class="text-sm text-white">{{ userInitial }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- 컨텐츠 -->
      <main class="p-4">
        <AdminDashboard v-if="activeTab === 'dashboard'" />
        <AdminPerformances v-if="activeTab === 'performances'" />
        <AdminVenues v-if="activeTab === 'venues'" />
        <AdminUsers v-if="activeTab === 'users'" />
      </main>
      </div>
    </div>

    <!-- 오버레이 (사이드바 열렸을 때) -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      @click="handleCloseSidebar"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner'

import {
  LayoutDashboard,
  Ticket,
  Building2,
  Users,
  Menu,
  LogOut,
  User,
} from 'lucide-vue-next'

import AdminDashboard from '../components/admin/AdminDashboard.vue'
import AdminPerformances from '../components/admin/AdminPerformances.vue'
import AdminVenues from '../components/admin/AdminVenues.vue'
import AdminUsers from '../components/admin/AdminUsers.vue'

type AdminTab = 'dashboard' | 'performances' | 'venues' | 'users'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref<AdminTab>('dashboard')
// 화면 크기에 따라 초기 상태 설정 (데스크톱: 열림, 모바일: 닫힘)
const sidebarOpen = ref(window.innerWidth >= 1024)

// 사용자 정보
const userInfo = computed(() => authStore.userInfo)

// 사용자 이름의 첫 글자 (아바타용)
const userInitial = computed(() => {
  const name = userInfo.value?.name
  if (name) {
    return name.charAt(0).toUpperCase()
  }
  return 'A'
})

const menuItems = [
  { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { id: 'performances', label: '공연 관리', icon: Ticket },
  { id: 'venues', label: '공연장 관리', icon: Building2 },
  { id: 'users', label: '유저 관리', icon: Users },
] as const

const currentTabLabel = computed(() =>
  menuItems.find(item => item.id === activeTab.value)?.label
)

// 메뉴 클릭 핸들러
const handleMenuClick = (tabId: AdminTab) => {
  activeTab.value = tabId
  // 모바일에서는 메뉴 클릭 시 사이드바 닫기
  if (window.innerWidth < 1024) {
    sidebarOpen.value = false
  }
}

// 사이드바 닫기 핸들러
const handleCloseSidebar = () => {
  console.log('사이드바 닫기 버튼 클릭됨')
  sidebarOpen.value = false
}

// 화면 크기 변경 감지
const handleResize = () => {
  if (window.innerWidth >= 1024) {
    sidebarOpen.value = true
  } else {
    sidebarOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const handleLogout = async () => {
  try {
    await authStore.userLogout()
    toast.success('로그아웃되었습니다')
    router.push('/')
  } catch (error) {
    console.error('로그아웃 에러:', error)
    toast.error('로그아웃에 실패했습니다')
  }
}
</script>

