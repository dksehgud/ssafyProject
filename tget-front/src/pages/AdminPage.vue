<template>
  <div class="min-h-screen bg-black flex">
    <!-- 사이드바 -->
    <aside
      class="fixed left-0 top-0 h-full w-[280px] bg-gradient-to-b from-gray-900 to-black border-r border-gray-800 z-40 transition-transform duration-300"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
    >
      <!-- 로고 -->
      <div class="p-6 border-b border-gray-800">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl text-red-600 mb-1">ADMIN</h1>
            <p class="text-sm text-gray-400">관리자 페이지</p>
          </div>
          <button
            @click="sidebarOpen = false"
            class="lg:hidden w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            <X class="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <!-- 메뉴 -->
      <nav class="p-4 space-y-2">
        <button
          v-for="item in menuItems"
          :key="item.id"
          @click="activeTab = item.id"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
          :class="activeTab === item.id
            ? 'bg-red-600 text-white'
            : 'text-gray-400 hover:bg-gray-800 hover:text-white'"
        >
          <component :is="item.icon" class="w-5 h-5" />
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <!-- 하단 액션 -->
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 space-y-2">
        <!-- 회원 모드로 전환 -->
        <button
          @click="router.push('/')"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all"
        >
          <User class="w-5 h-5" />
          <span>회원 모드</span>
        </button>

        <!-- 로그아웃 -->
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
        >
          <LogOut class="w-5 h-5" />
          <span>로그아웃</span>
        </button>
      </div>
    </aside>

    <!-- 메인 컨텐츠 -->
    <div
      class="flex-1 transition-all duration-300"
      :class="sidebarOpen ? 'ml-[280px]' : 'ml-0'"
    >
      <!-- 헤더 -->
      <header class="bg-gradient-to-r from-gray-900 to-black border-b border-gray-800 sticky top-0 z-30">
        <div class="flex items-center justify-between p-6">
          <div class="flex items-center gap-4">
            <button
              @click="sidebarOpen = !sidebarOpen"
              class="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
            >
              <Menu class="w-5 h-5 text-white" />
            </button>
            <h2 class="text-2xl text-white">
              {{ currentTabLabel }}
            </h2>
          </div>

          <div class="flex items-center gap-3">
            <div class="text-right">
              <p class="text-white">Admin User</p>
              <p class="text-sm text-gray-400">admin@example.com</p>
            </div>
            <div class="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
              <span class="text-white">A</span>
            </div>
          </div>
        </div>
      </header>

      <!-- 컨텐츠 -->
      <main class="p-6">
        <AdminDashboard v-if="activeTab === 'dashboard'" />
        <AdminPerformances v-if="activeTab === 'performances'" />
        <AdminVenues v-if="activeTab === 'venues'" />
        <AdminUsers v-if="activeTab === 'users'" />
      </main>
    </div>

    <!-- 모바일 오버레이 -->
    <div
      v-if="sidebarOpen"
      class="lg:hidden fixed inset-0 bg-black/50 z-30"
      @click="sidebarOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner'

import {
  LayoutDashboard,
  Ticket,
  Building2,
  Users,
  Menu,
  X,
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
const sidebarOpen = ref(true)

const menuItems = [
  { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { id: 'performances', label: '공연 관리', icon: Ticket },
  { id: 'venues', label: '공연장 관리', icon: Building2 },
  { id: 'users', label: '유저 관리', icon: Users },
] as const

const currentTabLabel = computed(() =>
  menuItems.find(item => item.id === activeTab.value)?.label
)

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

