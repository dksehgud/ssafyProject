<template>
  <div class="space-y-6">
    <!-- 헤더 -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl text-white mb-2">공연 관리</h2>
        <p class="text-gray-400">
          총 {{ filteredPerformances.length }}개의 공연
        </p>
      </div>
      <button
        @click="handleAdd"
        class="bg-red-600 hover:bg-red-700 flex items-center gap-2 px-4 py-3 rounded-lg text-white"
      >
        <Plus class="w-5 h-5" />
        공연 추가
      </button>
    </div>

    <!-- 검색 및 필터 -->
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="flex-1 relative">
        <Search
          class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
        />
        <input
          v-model="searchTerm"
          type="text"
          placeholder="공연명 또는 공연장 검색..."
          class="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-600"
        />
      </div>

      <div class="flex gap-2">
        <button
          v-for="category in categories"
          :key="category"
          @click="selectedCategory = category"
          class="px-4 py-3 rounded-lg whitespace-nowrap transition-colors"
          :class="
            selectedCategory === category
              ? 'bg-red-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          "
        >
          {{ category === 'all' ? '전체' : category }}
        </button>
      </div>
    </div>

    <!-- 공연 목록 -->
    <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-800/50">
            <tr class="border-b border-gray-700">
              <th class="text-left text-gray-400 p-4">포스터</th>
              <th class="text-left text-gray-400 p-4">공연명</th>
              <th class="text-left text-gray-400 p-4">카테고리</th>
              <th class="text-left text-gray-400 p-4">공연장</th>
              <th class="text-left text-gray-400 p-4">공연기간</th>
              <th class="text-left text-gray-400 p-4">가격</th>
              <th class="text-left text-gray-400 p-4">관리</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(performance, index) in filteredPerformances"
              :key="performance.performanceId"
              class="border-b border-gray-800 hover:bg-gray-800/50 transition-colors animate-fade-in"
              :style="{ animationDelay: `${index * 20}ms` }"
            >
              <td class="p-4">
                <img
                  :src="performance.poster"
                  :alt="performance.title"
                  class="w-12 h-16 object-cover rounded"
                />
              </td>

              <td class="p-4">
                <p class="text-white line-clamp-2 max-w-xs">
                  {{ performance.title }}
                </p>
              </td>

              <td class="p-4">
                <span class="px-3 py-1 bg-red-600/20 text-red-400 rounded-full text-sm">
                  {{ performance.category }}
                </span>
              </td>

              <td class="p-4 text-gray-300">
                {{ performance.facilityName }}
              </td>

              <td class="p-4 text-gray-400 text-sm">
                <div>{{ performance.dateStart }}</div>
                <div>~ {{ performance.dateEnd }}</div>
              </td>

              <td class="p-4 text-white">
                {{ performance.ticketPrice }}
              </td>

              <td class="p-4">
                <div class="flex gap-2">
                  <button
                    @click="handleEdit(performance)"
                    class="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <Edit class="w-4 h-4 text-white" />
                  </button>
                  <button
                    @click="handleDelete(performance.performanceId)"
                    class="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    <Trash2 class="w-4 h-4 text-white" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Plus,
  Search,
  Edit,
  Trash2,
} from 'lucide-vue-next'
import { ticketData, type TicketData } from '@/data/ticketData'
import { toast } from 'vue-sonner'

/* 상태 */
const performances = ref<TicketData[]>([...ticketData])
const searchTerm = ref('')
const selectedCategory = ref('all')
const isModalOpen = ref(false)
const editingPerformance = ref<TicketData | null>(null)

const categories = ['all', '콘서트', '클래식', '뮤지컬', '페스티벌']

/* 필터링 */
const filteredPerformances = computed(() =>
  performances.value.filter(perf => {
    const matchesSearch =
      perf.title.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      perf.facilityName.toLowerCase().includes(searchTerm.value.toLowerCase())

    const matchesCategory =
      selectedCategory.value === 'all' ||
      perf.category === selectedCategory.value

    return matchesSearch && matchesCategory
  }),
)

/* 핸들러 */
const handleAdd = () => {
  editingPerformance.value = null
  isModalOpen.value = true
}

const handleEdit = (performance: TicketData) => {
  editingPerformance.value = { ...performance }
  isModalOpen.value = true
}

const handleDelete = (id: string) => {
  if (confirm('이 공연을 삭제하시겠습니까?')) {
    performances.value = performances.value.filter(
      p => p.performanceId !== id,
    )
    // toast.success('공연이 삭제되었습니다.')
  }
}

const handleSave = (performance: TicketData) => {
  if (editingPerformance.value) {
    performances.value = performances.value.map(p =>
      p.performanceId === performance.performanceId ? performance : p,
    )
    // toast.success('공연이 수정되었습니다.')
  } else {
    performances.value.push({
      ...performance,
      performanceId: `perf-${Date.now()}`,
    })
    // toast.success('공연이 추가되었습니다.')
  }
  isModalOpen.value = false
}
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

.animate-fade-in {
  animation: fade-in 0.3s ease-out forwards;
}
</style>
