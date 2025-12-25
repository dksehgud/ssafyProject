<template>
  <!-- 로딩 상태 -->
  <div v-if="isLoading" class="flex items-center justify-center py-20">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
  </div>

  <!-- 데이터 표시 -->
  <div v-else class="space-y-4">
    <!-- 통계 카드 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="(stat, index) in statCards"
        :key="stat.title"
        class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-6 hover:border-red-600 transition-colors animate-fade-in"
        :style="{ animationDelay: `${index * 100}ms` }"
      >
        <div class="flex items-start justify-between mb-4">
          <div
            class="w-12 h-12 rounded-lg flex items-center justify-center"
            :class="stat.color"
          >
            <component :is="stat.icon" class="w-6 h-6 text-white" />
          </div>
        </div>
        <h3 class="text-gray-400 text-sm mb-1">{{ stat.title }}</h3>
        <p class="text-white text-3xl">{{ stat.value }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 카테고리별 공연 -->
      <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-6 animate-fade-in" style="animation-delay: 400ms">
        <h3 class="text-white text-xl mb-6 flex items-center gap-2">
          <Ticket class="w-5 h-5 text-red-500" />
          카테고리별 공연
        </h3>

        <div class="space-y-4">
          <div
            v-for="category in categoryEntries"
            :key="category.genreId"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-gray-300">{{ category.genreName }}</span>
              <span class="text-white">{{ category.count }}개</span>
            </div>

            <div class="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-red-600 to-red-400 animate-progress"
                :style="{ width: `${category.percentage}%` }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 지역별 공연 -->
      <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-6 animate-fade-in" style="animation-delay: 500ms">
        <h3 class="text-white text-xl mb-6 flex items-center gap-2">
          <Building2 class="w-5 h-5 text-blue-500" />
          지역별 공연
        </h3>

        <div class="space-y-4">
          <div
            v-for="region in regionEntries"
            :key="region.area"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-gray-300">{{ region.area }}</span>
              <span class="text-white">{{ region.count }}개</span>
            </div>

            <div class="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-blue-600 to-blue-400 animate-progress"
                :style="{ width: `${region.percentage}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 공연 목록 -->
    <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-6 animate-fade-in" style="animation-delay: 600ms">
      <h3 class="text-white text-xl mb-6 flex items-center gap-2">
        <Calendar class="w-5 h-5 text-green-500" />
        공연 목록
      </h3>

      <div class="overflow-x-auto max-h-96 overflow-y-auto" @scroll="handleScroll">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-700">
              <th class="text-left text-gray-400 pb-3 pr-4">포스터</th>
              <th class="text-left text-gray-400 pb-3 pr-4">공연명</th>
              <th class="text-left text-gray-400 pb-3 pr-4">카테고리</th>
              <th class="text-left text-gray-400 pb-3 pr-4">공연장</th>
              <th class="text-left text-gray-400 pb-3 pr-4">기간</th>
              <th class="text-left text-gray-400 pb-3">상태</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="performance in recentPerformances"
              :key="performance.mt20id"
              class="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
            >
              <td class="py-2 pr-3">
                <img
                  :src="performance.poster || '/placeholder-poster.jpg'"
                  :alt="performance.prfnm"
                  class="w-10 h-14 object-cover rounded"
                />
              </td>
              <td class="py-2 pr-3">
                <p class="text-white text-sm line-clamp-1">
                  {{ performance.prfnm }}
                </p>
              </td>
              <td class="py-2 pr-3">
                <span class="px-2 py-0.5 bg-red-600/20 text-red-400 rounded-full text-xs">
                  {{ performance.genreName || '미분류' }}
                </span>
              </td>
              <td class="py-2 pr-3 text-gray-300 text-sm">
                {{ performance.fcltynm }}
              </td>
              <td class="py-2 pr-3 text-gray-400 text-xs">
                {{ performance.prfpdfrom }} ~ {{ performance.prfpdto }}
              </td>
              <td class="py-2 text-white text-sm">
                {{ performance.prfstate || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- 로딩 인디케이터 -->
        <div v-if="isLoadingMore" class="flex justify-center py-4">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
        </div>
        
        <!-- 더 이상 데이터 없음 -->
        <div v-if="!hasMorePerformances && recentPerformances.length > 0" class="text-center py-4 text-gray-400 text-sm">
          모든 공연을 불러왔습니다
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Ticket,
  Building2,
  Users,
  Calendar,
} from 'lucide-vue-next'
import { adminService } from '@/api/adminService'
import { toast } from 'vue-sonner'

// 통계 데이터
const stats = ref({
  totalPerformances: 0,
  totalVenues: 0,
  totalUsers: 0,
  categoryStats: [] as Array<{ genreId: number; genreName: string; count: number }>,
  regionStats: [] as Array<{ area: string; count: number }>,
})

// 최근 공연 데이터
const recentPerformances = ref<any[]>([])
const performancePage = ref(0)
const hasMorePerformances = ref(true)
const isLoadingMore = ref(false)

// 로딩 상태
const isLoading = ref(true)

// 통계 데이터 로드
const loadStats = async () => {
  try {
    isLoading.value = true

    // 전체 통계 조회
    const statsData = await adminService.getAdminStats()
    stats.value.totalPerformances = statsData.data.totalPerformances || 0
    stats.value.totalVenues = statsData.data.totalVenues || 0
    stats.value.totalUsers = statsData.data.totalUsers || 0

    // 카테고리별 통계 (API는 배열로 반환)
    const categoryData = await adminService.getCategoryStats()
    stats.value.categoryStats = categoryData.data || []

    // 지역별 통계 (API는 배열로 반환)
    const regionData = await adminService.getRegionStats()
    stats.value.regionStats = regionData.data || []

    // 예정된 공연 (초기 50개 로드)
    await loadPerformances(true)

  } catch (error) {
    console.error('통계 데이터 로드 실패:', error)
    toast.error('통계 데이터를 불러오는데 실패했습니다')

    // 폴백: 로컬 데이터 사용
    loadFallbackData()
  } finally {
    isLoading.value = false
  }
}

// 폴백 데이터 (API 실패 시)
const loadFallbackData = () => {
  // ticketData를 사용한 로컬 통계
  const { ticketData } = require('@/data/ticketData')

  stats.value.totalPerformances = ticketData.length
  stats.value.totalVenues = new Set(ticketData.map((t: any) => t.facilityName)).size
  stats.value.totalUsers = 1247 // Mock 데이터

  const categoryCount: Record<string, number> = {}
  const regionCount: Record<string, number> = {}

  ticketData.forEach((ticket: any) => {
    categoryCount[ticket.category] = (categoryCount[ticket.category] || 0) + 1
    const region = ticket.area.split(' ')[0]
    regionCount[region] = (regionCount[region] || 0) + 1
  })

  // 배열 형식으로 변환
  stats.value.categoryStats = Object.entries(categoryCount).map(([name, count], index) => ({
    genreId: index + 1,
    genreName: name,
    count: count as number
  }))
  
  stats.value.regionStats = Object.entries(regionCount).map(([area, count]) => ({
    area,
    count: count as number
  }))
  
  recentPerformances.value = ticketData.slice(0, 5)
}

// 공연 목록 로드 (무한 스크롤)
const loadPerformances = async (reset = false) => {
  if (isLoadingMore.value || (!hasMorePerformances.value && !reset)) return
  
  try {
    isLoadingMore.value = true
    
    if (reset) {
      performancePage.value = 0
      recentPerformances.value = []
      hasMorePerformances.value = true
    }
    
    const response = await adminService.getAdminPerformances({
      page: performancePage.value,
      size: 50
    })
    
    if (response.data && response.data.performances) {
      if (reset) {
        recentPerformances.value = response.data.performances
      } else {
        recentPerformances.value.push(...response.data.performances)
      }
      
      // 페이지 증가
      performancePage.value++
      
      // 더 이상 데이터가 없으면 중단 (50개 미만이면 마지막 페이지)
      if (response.data.performances.length < 50) {
        hasMorePerformances.value = false
      }
    }
  } catch (error) {
    console.error('공연 목록 로드 실패:', error)
  } finally {
    isLoadingMore.value = false
  }
}

// 스크롤 이벤트 핸들러
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight
  
  // 80% 스크롤 시 다음 페이지 로드
  if (scrollPercentage > 0.8 && hasMorePerformances.value && !isLoadingMore.value) {
    loadPerformances()
  }
}

// 컴포넌트 마운트 시 데이터 로드
onMounted(() => {
  loadStats()
})

/* 카드 */
const statCards = computed(() => [
  {
    title: '총 공연 수',
    value: stats.value.totalPerformances,
    icon: Ticket,
    color: 'bg-red-600',
  },
  {
    title: '공연장 수',
    value: stats.value.totalVenues,
    icon: Building2,
    color: 'bg-blue-600',
  },
  {
    title: '전체 유저',
    value: stats.value.totalUsers.toLocaleString(),
    icon: Users,
    color: 'bg-green-600',
  },
])

/* 파생 데이터 */
// 카테고리별 통계 - 최대값 기준으로 게이지 바 계산
const categoryEntries = computed(() => {
  const categories = stats.value.categoryStats
  if (!categories || categories.length === 0) return []
  
  const maxCount = Math.max(...categories.map(c => c.count))
  return categories.map(cat => ({
    ...cat,
    percentage: maxCount > 0 ? (cat.count / maxCount) * 100 : 0
  }))
})

// 지역별 통계 - 최대값 기준으로 게이지 바 계산, 내림차순 정렬
const regionEntries = computed(() => {
  const regions = stats.value.regionStats
  if (!regions || regions.length === 0) return []
  
  const sorted = [...regions].sort((a, b) => b.count - a.count).slice(0, 6)
  const maxCount = Math.max(...sorted.map(r => r.count))
  
  return sorted.map(reg => ({
    ...reg,
    percentage: maxCount > 0 ? (reg.count / maxCount) * 100 : 0
  }))
})
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes progress {
  from {
    width: 0;
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
}

.animate-progress {
  animation: progress 0.8s ease-out forwards;
}
</style>
