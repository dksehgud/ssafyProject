<script setup>
import { performanceService } from '@/api/performanceService'
import { useAuthStore } from '@/stores/auth'
import { Edit, Plus, Trash2 } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

const router = useRouter()
const authStore = useAuthStore()

// 카테고리 목록
const categories = [
  { id: 'all', name: '전체', genre: null },
  { id: 'classical', name: '클래식', genre: '클래식' },
  { id: 'concert', name: '콘서트', genre: '콘서트' },
  { id: 'musical', name: '뮤지컬', genre: '뮤지컬' },
  { id: 'theater', name: '연극', genre: '연극' }
]

const selectedCategory = ref('all')
const performances = ref([])
const selectedPerformances = ref(new Set())
const isLoading = ref(false)

// 카테고리별 필터링된 공연 목록
const filteredPerformances = computed(() => {
  if (selectedCategory.value === 'all') {
    return performances.value
  }
  const category = categories.find(c => c.id === selectedCategory.value)
  return performances.value.filter(p => p.genre === category.genre)
})

// 공연 목록 조회
const fetchPerformances = async () => {
  isLoading.value = true
  try {
    const data = await performanceService.getMyPerformances()
    console.log('📋 백엔드 응답 데이터:', data)
    
    if (!data || data.length === 0) {
      console.log('등록된 공연이 없습니다')
      performances.value = []
      return
    }
    
    performances.value = data.map(item => {
      console.log('🎭 공연 데이터:', {
        id: item.mt20id,
        poster: item.poster,
        posterUrl: item.poster || `http://localhost:81/performances/poster/${item.mt20id}`
      })
      
      return {
        id: item.mt20id,
        title: item.prfnm,
        genre: item.genreName,  // 한글 장르명으로 저장
        genreName: item.genreName,
        poster: item.poster || `http://localhost:81/performances/poster/${item.mt20id}`,  // poster가 없으면 업로드된 이미지 사용
        dateStart: item.prfpdfrom,
        dateEnd: item.prfpdto,
        facilityName: item.fcltynm,
        state: item.prfstate
      }
    })
  } catch (error) {
    console.error('공연 목록 조회 실패:', error)
    console.error('에러 상세:', error.response?.data)
    toast.error('공연 목록을 불러오는데 실패했습니다')
  } finally {
    isLoading.value = false
  }
}

// 장르명 변환
const getGenreName = (genreid) => {
  const genreMap = {
    1: '클래식',
    2: '콘서트',
    3: '뮤지컬',
    4: '연극'
  }
  return genreMap[genreid] || '기타'
}

// 체크박스 토글
const toggleSelect = (id) => {
  if (selectedPerformances.value.has(id)) {
    selectedPerformances.value.delete(id)
  } else {
    selectedPerformances.value.add(id)
  }
}

// 전체 선택/해제
const toggleSelectAll = () => {
  if (selectedPerformances.value.size === filteredPerformances.value.length) {
    selectedPerformances.value.clear()
  } else {
    filteredPerformances.value.forEach(p => selectedPerformances.value.add(p.id))
  }
}

// 선택된 공연 삭제
const deleteSelected = async () => {
  if (selectedPerformances.value.size === 0) {
    toast.warning('삭제할 공연을 선택해주세요')
    return
  }

  const count = selectedPerformances.value.size
  if (!confirm(`선택한 ${count}개의 공연을 삭제하시겠습니까?\n삭제된 공연은 복구할 수 없습니다.`)) {
    return
  }

  isLoading.value = true
  const selectedIds = Array.from(selectedPerformances.value)
  let successCount = 0
  let failCount = 0

  try {
    // 선택된 모든 공연 삭제 (순차 처리)
    for (const id of selectedIds) {
      try {
        await performanceService.deletePerformance(id)
        successCount++
        // 성공한 공연은 목록에서 제거
        performances.value = performances.value.filter(p => p.id !== id)
        selectedPerformances.value.delete(id)
      } catch (error) {
        console.error(`공연 삭제 실패 (ID: ${id}):`, error)
        failCount++
      }
    }

    // 결과 메시지
    if (successCount > 0 && failCount === 0) {
      toast.success(`${successCount}개의 공연이 삭제되었습니다`)
    } else if (successCount > 0 && failCount > 0) {
      toast.warning(`${successCount}개 삭제 성공, ${failCount}개 삭제 실패`)
    } else {
      toast.error('공연 삭제에 실패했습니다')
    }

  } catch (error) {
    console.error('공연 삭제 실패:', error)
    toast.error('공연 삭제 중 오류가 발생했습니다')
  } finally {
    isLoading.value = false
  }
}

// 공연 상세/수정 페이지로 이동
const goToDetail = (id) => {
  router.push(`/performance/edit/${id}`)
}

// 개별 공연 삭제
const deleteSinglePerformance = async (id, title) => {
  if (!confirm(`"${title}" 공연을 삭제하시겠습니까?\n삭제된 공연은 복구할 수 없습니다.`)) {
    return
  }

  isLoading.value = true
  try {
    await performanceService.deletePerformance(id)
    
    // 목록에서 제거
    performances.value = performances.value.filter(p => p.id !== id)
    
    // 선택 목록에서도 제거
    selectedPerformances.value.delete(id)
    
    toast.success('공연이 삭제되었습니다')
  } catch (error) {
    console.error('공연 삭제 실패:', error)
    if (error.response?.status === 403) {
      toast.error('본인이 등록한 공연만 삭제할 수 있습니다')
    } else {
      toast.error('공연 삭제에 실패했습니다')
    }
  } finally {
    isLoading.value = false
  }
}

// 공연 등록 페이지로 이동
const goToCreate = () => {
  router.push('/performance/create')
}

onMounted(() => {
  fetchPerformances()
})
</script>

<template>
  <div class="min-h-screen bg-black pt-20">
    <!-- 페이지 타이틀 -->
    <div class="bg-gradient-to-b from-red-950/20 to-transparent">
      <div class="container mx-auto px-4 py-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl sm:text-4xl font-bold text-white mb-2">공연 관리</h1>
            <p class="text-gray-400">등록한 공연을 관리하고 수정할 수 있습니다</p>
          </div>
          <button
            @click="router.push('/performance-registration')"
            class="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
          >
            <Plus class="w-5 h-5" />
            공연 등록
          </button>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Sidebar -->
        <aside class="lg:w-64 flex-shrink-0">
          <div class="bg-zinc-900 rounded-lg p-6 sticky top-4">
            <h2 class="text-xl font-bold text-white mb-4">공연</h2>
            <nav class="space-y-2">
              <button
                v-for="category in categories"
                :key="category.id"
                @click="selectedCategory = category.id"
                :class="[
                  'w-full text-left px-4 py-3 rounded-lg transition-colors',
                  selectedCategory === category.id
                    ? 'bg-red-600 text-white'
                    : 'text-gray-400 hover:bg-zinc-800 hover:text-white'
                ]"
              >
                {{ category.name }}
              </button>
            </nav>

            <!-- 공연 등록 버튼 -->
            <button
              @click="goToCreate"
              class="w-full mt-6 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Plus class="w-5 h-5" />
              공연 등록
            </button>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1">
          <!-- 액션 바 -->
          <div class="bg-zinc-900 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2 text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  :checked="selectedPerformances.size === filteredPerformances.length && filteredPerformances.length > 0"
                  @change="toggleSelectAll"
                  class="w-4 h-4 rounded border-gray-600 text-red-600 focus:ring-red-500 bg-zinc-800"
                />
                <span>전체 선택</span>
              </label>
              <span class="text-gray-400">
                {{ selectedPerformances.size }} / {{ filteredPerformances.length }} 선택됨
              </span>
            </div>
            <button
              @click="deleteSelected"
              :disabled="selectedPerformances.size === 0"
              :class="[
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                selectedPerformances.size === 0
                  ? 'bg-zinc-800 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              ]"
            >
              <Trash2 class="w-4 h-4" />
              삭제
            </button>
          </div>

          <!-- 로딩 상태 -->
          <div v-if="isLoading" class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            <p class="text-gray-400 mt-4">공연 목록을 불러오는 중...</p>
          </div>

          <!-- 공연 목록 -->
          <div v-else-if="filteredPerformances.length > 0" class="space-y-4">
            <div
              v-for="performance in filteredPerformances"
              :key="performance.id"
              class="bg-zinc-900 rounded-lg overflow-hidden hover:bg-zinc-800 transition-colors"
            >
              <div class="flex items-center p-4 gap-4">
                <!-- 체크박스 -->
                <input
                  type="checkbox"
                  :checked="selectedPerformances.has(performance.id)"
                  @change="toggleSelect(performance.id)"
                  @click.stop
                  class="w-5 h-5 rounded border-gray-600 text-red-600 focus:ring-red-500 bg-zinc-800 flex-shrink-0"
                />

                <!-- 포스터 -->
                <div
                  class="w-24 h-32 flex-shrink-0 rounded overflow-hidden cursor-pointer"
                  @click="goToDetail(performance.id)"
                >
                  <img
                    :src="performance.poster"
                    :alt="performance.title"
                    class="w-full h-full object-cover"
                  />
                </div>

                <!-- 공연 정보 -->
                <div
                  class="flex-1 min-w-0 cursor-pointer"
                  @click="goToDetail(performance.id)"
                >
                  <div class="flex items-center gap-2 mb-2">
                    <span class="px-2 py-1 bg-red-600 text-white text-xs rounded">
                      {{ performance.genreName }}
                    </span>
                    <span
                      :class="[
                        'px-2 py-1 text-xs rounded',
                        performance.state === '공연중'
                          ? 'bg-green-600 text-white'
                          : 'bg-blue-600 text-white'
                      ]"
                    >
                      {{ performance.state }}
                    </span>
                  </div>
                  <h3 class="text-white font-bold text-lg mb-2 truncate">
                    {{ performance.title }}
                  </h3>
                  <div class="text-gray-400 text-sm space-y-1">
                    <p>📅 {{ performance.dateStart }} ~ {{ performance.dateEnd }}</p>
                    <p>📍 {{ performance.facilityName }}</p>
                  </div>
                </div>

                <!-- 수정 버튼 -->
                <button
                  @click.stop="goToDetail(performance.id)"
                  class="flex-shrink-0 p-3 bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white rounded-lg transition-colors"
                  title="수정"
                >
                  <Edit class="w-5 h-5" />
                </button>

                <!-- 삭제 버튼 -->
                <button
                  @click.stop="deleteSinglePerformance(performance.id, performance.title)"
                  class="flex-shrink-0 p-3 bg-zinc-800 hover:bg-red-600 text-gray-300 hover:text-white rounded-lg transition-colors"
                  title="삭제"
                >
                  <Trash2 class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <!-- 빈 상태 -->
          <div v-else class="text-center py-12">
            <p class="text-gray-400 text-lg mb-4">등록된 공연이 없습니다</p>
            <button
              @click="goToCreate"
              class="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Plus class="w-5 h-5" />
              첫 공연 등록하기
            </button>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 커스텀 체크박스 스타일 */
input[type='checkbox'] {
  cursor: pointer;
}

input[type='checkbox']:checked {
  background-color: #dc2626;
  border-color: #dc2626;
}
</style>
