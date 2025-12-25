<template>
  <div class="space-y-4">
    <!-- 헤더 -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl text-white mb-2">공연 관리</h2>
        <p class="text-gray-400">
          총 {{ totalCount }}개의 공연
        </p>
      </div>
    </div>

    <!-- 검색 및 필터 -->
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="flex-1 relative">
        <Search
          class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
        />
        <input
          v-model="searchTerm"
          @input="handleSearch"
          type="text"
          placeholder="공연명 검색..."
          class="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-600"
        />
      </div>

      <div class="flex gap-2 overflow-x-auto">
        <button
          @click="handleCategoryFilter(null)"
          class="px-4 py-3 rounded-lg whitespace-nowrap transition-colors"
          :class="
            selectedGenreId === null
              ? 'bg-red-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          "
        >
          전체
        </button>
        <button
          v-for="category in categories"
          :key="category.genreId"
          @click="handleCategoryFilter(category.genreId)"
          class="px-4 py-3 rounded-lg whitespace-nowrap transition-colors"
          :class="
            selectedGenreId === category.genreId
              ? 'bg-red-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          "
        >
          {{ category.genreName }}
        </button>
      </div>
    </div>

    <!-- 공연 목록 -->
    <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>

      <div v-else class="overflow-x-auto max-h-[600px] overflow-y-auto" @scroll="handleScroll">
        <table class="w-full">
          <thead class="bg-gray-800 sticky top-0 z-10">
            <tr class="border-b border-gray-700">
              <th class="text-left text-gray-400 p-4 bg-gray-800">포스터</th>
              <th class="text-left text-gray-400 p-4 bg-gray-800">공연명</th>
              <th class="text-left text-gray-400 p-4 bg-gray-800">카테고리</th>
              <th class="text-left text-gray-400 p-4 bg-gray-800">공연장</th>
              <th class="text-left text-gray-400 p-4 bg-gray-800">공연기간</th>
              <th class="text-left text-gray-400 p-4 bg-gray-800">상태</th>
              <th class="text-left text-gray-400 p-4 bg-gray-800">관리</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="performance in performances"
              :key="performance.mt20id"
              class="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
            >
              <td class="p-4">
                <img
                  :src="performance.poster || '/placeholder-poster.jpg'"
                  :alt="performance.prfnm"
                  class="w-12 h-16 object-cover rounded"
                />
              </td>

              <td class="p-4">
                <p class="text-white line-clamp-2 max-w-xs">
                  {{ performance.prfnm }}
                </p>
              </td>

              <td class="p-4">
                <span class="px-3 py-1 bg-red-600/20 text-red-400 rounded-full text-sm">
                  {{ performance.genreName || '미분류' }}
                </span>
              </td>

              <td class="p-4 text-gray-300">
                {{ performance.fcltynm }}
              </td>

              <td class="p-4 text-gray-400 text-sm">
                <div>{{ performance.prfpdfrom }}</div>
                <div>~ {{ performance.prfpdto }}</div>
              </td>

              <td class="p-4 text-white">
                {{ performance.prfstate || '-' }}
              </td>

              <td class="p-4">
                <div class="flex gap-2">
                  <button
                    @click="handleEdit(performance)"
                    class="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    title="수정"
                  >
                    <Edit class="w-4 h-4 text-white" />
                  </button>
                  <button
                    @click="handleDelete(performance.mt20id)"
                    class="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    title="삭제"
                  >
                    <Trash2 class="w-4 h-4 text-white" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- 로딩 인디케이터 -->
        <div v-if="isLoadingMore" class="flex justify-center py-4">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
        </div>
        
        <!-- 더 이상 데이터 없음 -->
        <div v-if="!hasMore && performances.length > 0" class="text-center py-4 text-gray-400 text-sm">
          모든 공연을 불러왔습니다
        </div>
      </div>
    </div>

    <!-- 수정 모달 -->
    <PerformanceEditModal
      :is-open="isEditModalOpen"
      :performance="selectedPerformance"
      @close="closeEditModal"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Search, Edit, Trash2 } from 'lucide-vue-next'
import { adminService } from '@/api/adminService'
import { toast } from 'vue-sonner'
import PerformanceEditModal from './PerformanceEditModal.vue'

/* 상태 */
const performances = ref<any[]>([])
const categories = ref<any[]>([])
const searchTerm = ref('')
const selectedGenreId = ref<number | null>(null)
const isLoading = ref(true)
const isLoadingMore = ref(false)
const hasMore = ref(true)
const currentPage = ref(0)
const totalCount = ref(0)

/* 모달 상태 */
const isEditModalOpen = ref(false)
const selectedPerformance = ref<any>(null)

let searchTimeout: NodeJS.Timeout | null = null

/* 핸들러 */
const handleEdit = (performance: any) => {
  selectedPerformance.value = performance
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
  selectedPerformance.value = null
}

const handleSave = async (data: any) => {
  try {
    await adminService.updatePerformance(data.mt20id, {
      prfnm: data.prfnm,
      prfpdfrom: data.prfpdfrom,
      prfpdto: data.prfpdto,
      fcltynm: data.fcltynm,
      area: data.area,
      genreid: data.genreid,
      prfstate: data.prfstate,
      mt10id: data.mt10id
    })
    toast.success('공연 정보가 수정되었습니다')
    closeEditModal()
    // 목록 새로고침
    await loadPerformances(true)
  } catch (error) {
    console.error('수정 실패:', error)
    toast.error('수정에 실패했습니다')
  }
}

const handleDelete = async (mt20id: string) => {
  if (confirm('정말 이 공연을 삭제하시겠습니까?')) {
    try {
      await adminService.deletePerformance(mt20id)
      toast.success('공연이 삭제되었습니다')
      // 목록 새로고침
      await loadPerformances(true)
    } catch (error) {
      console.error('삭제 실패:', error)
      toast.error('삭제에 실패했습니다')
    }
  }
}

/* 데이터 로드 */
const loadPerformances = async (reset = false) => {
  if (isLoadingMore.value || (!hasMore.value && !reset)) return
  
  try {
    if (reset) {
      isLoading.value = true
      currentPage.value = 0
      performances.value = []
      hasMore.value = true
    } else {
      isLoadingMore.value = true
    }
    
    const response = await adminService.getAdminPerformances({
      page: currentPage.value,
      size: 50,
      search: searchTerm.value || undefined,
      genreId: selectedGenreId.value || undefined
    })
    
    if (response.data) {
      const newPerformances = response.data.performances || []
      
      if (reset) {
        performances.value = newPerformances
      } else {
        performances.value.push(...newPerformances)
      }
      
      // 페이지 증가
      currentPage.value++
      
      // 총 개수 업데이트
      if (response.data.pagination) {
        totalCount.value = response.data.pagination.totalItems
      }
      
      // 더 이상 데이터가 없으면 중단
      if (newPerformances.length < 50) {
        hasMore.value = false
      }
    }
  } catch (error) {
    console.error('공연 목록 로드 실패:', error)
    toast.error('공연 목록을 불러오는데 실패했습니다')
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

/* 카테고리 로드 */
const loadCategories = async () => {
  try {
    const response = await adminService.getCategoryStats()
    if (response.data) {
      categories.value = response.data
    }
  } catch (error) {
    console.error('카테고리 로드 실패:', error)
  }
}

/* 검색 핸들러 */
const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(() => {
    loadPerformances(true)
  }, 500)
}

/* 카테고리 필터 핸들러 */
const handleCategoryFilter = (genreId: number | null) => {
  selectedGenreId.value = genreId
  loadPerformances(true)
}

/* 스크롤 이벤트 핸들러 */
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight
  
  // 80% 스크롤 시 다음 페이지 로드
  if (scrollPercentage > 0.8 && hasMore.value && !isLoadingMore.value) {
    loadPerformances()
  }
}

/* 초기 로드 */
onMounted(() => {
  loadCategories()
  loadPerformances(true)
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

.animate-fade-in {
  animation: fade-in 0.3s ease-out forwards;
}
</style>
