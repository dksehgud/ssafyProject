<template>
  <div class="space-y-6">
    <!-- 통계 카드 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          <div class="flex items-center gap-1 text-green-500 text-sm">
            <TrendingUp class="w-4 h-4" />
            <span>{{ stat.trend }}</span>
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
            v-for="([category, count]) in categoryEntries"
            :key="category"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-gray-300">{{ category }}</span>
              <span class="text-white">{{ count }}개</span>
            </div>

            <div class="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-red-600 to-red-400 animate-progress"
                :style="{ width: `${(count / stats.totalPerformances) * 100}%` }"
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
            v-for="([region, count]) in regionEntries"
            :key="region"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-gray-300">{{ region }}</span>
              <span class="text-white">{{ count }}개</span>
            </div>

            <div class="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-blue-600 to-blue-400 animate-progress"
                :style="{ width: `${(count / stats.totalPerformances) * 100}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 최근 등록 공연 -->
    <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-6 animate-fade-in" style="animation-delay: 600ms">
      <h3 class="text-white text-xl mb-6 flex items-center gap-2">
        <Calendar class="w-5 h-5 text-green-500" />
        최근 등록 공연
      </h3>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-700">
              <th class="text-left text-gray-400 pb-3 pr-4">포스터</th>
              <th class="text-left text-gray-400 pb-3 pr-4">공연명</th>
              <th class="text-left text-gray-400 pb-3 pr-4">카테고리</th>
              <th class="text-left text-gray-400 pb-3 pr-4">공연장</th>
              <th class="text-left text-gray-400 pb-3 pr-4">기간</th>
              <th class="text-left text-gray-400 pb-3">가격</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="performance in recentPerformances"
              :key="performance.performanceId"
              class="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
            >
              <td class="py-4 pr-4">
                <img
                  :src="performance.poster"
                  :alt="performance.title"
                  class="w-12 h-16 object-cover rounded"
                />
              </td>
              <td class="py-4 pr-4">
                <p class="text-white line-clamp-1">
                  {{ performance.title }}
                </p>
              </td>
              <td class="py-4 pr-4">
                <span class="px-3 py-1 bg-red-600/20 text-red-400 rounded-full text-sm">
                  {{ performance.category }}
                </span>
              </td>
              <td class="py-4 pr-4 text-gray-300">
                {{ performance.facilityName }}
              </td>
              <td class="py-4 pr-4 text-gray-400 text-sm">
                {{ performance.dateStart }} ~ {{ performance.dateEnd }}
              </td>
              <td class="py-4 text-white">
                {{ performance.ticketPrice }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Ticket,
  Building2,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
} from 'lucide-vue-next'
import { ticketData } from '@/data/ticketData'

/* 통계 계산 */
const stats = computed(() => {
  const totalPerformances = ticketData.length
  const uniqueVenues = new Set(ticketData.map(t => t.facilityName)).size
  const mockUsers = 1247
  const mockRevenue = ticketData.length * 85000

  const categoryCount: Record<string, number> = {}
  const regionCount: Record<string, number> = {}

  ticketData.forEach(ticket => {
    categoryCount[ticket.category] =
      (categoryCount[ticket.category] || 0) + 1

    const region = ticket.area.split(' ')[0]
    regionCount[region] = (regionCount[region] || 0) + 1
  })

  return {
    totalPerformances,
    uniqueVenues,
    mockUsers,
    mockRevenue,
    categoryCount,
    regionCount,
  }
})

/* 카드 */
const statCards = computed(() => [
  {
    title: '총 공연 수',
    value: stats.value.totalPerformances,
    icon: Ticket,
    color: 'bg-red-600',
    trend: '+12.5%',
  },
  {
    title: '공연장 수',
    value: stats.value.uniqueVenues,
    icon: Building2,
    color: 'bg-blue-600',
    trend: '+3.2%',
  },
  {
    title: '전체 유저',
    value: stats.value.mockUsers.toLocaleString(),
    icon: Users,
    color: 'bg-green-600',
    trend: '+8.1%',
  },
  {
    title: '예상 매출',
    value: `₩${(stats.value.mockRevenue / 100000000).toFixed(1)}억`,
    icon: DollarSign,
    color: 'bg-purple-600',
    trend: '+15.3%',
  },
])

/* 파생 데이터 */
const categoryEntries = computed(() =>
  Object.entries(stats.value.categoryCount),
)

const regionEntries = computed(() =>
  Object.entries(stats.value.regionCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6),
)

const recentPerformances = computed(() =>
  ticketData.slice(0, 5),
)
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
