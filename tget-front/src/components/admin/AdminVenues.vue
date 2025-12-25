<template>
  <div class="space-y-4">
    <!-- 헤더 -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl text-white mb-2">공연장 관리</h2>
        <p class="text-gray-400">
          총 {{ totalCount }}개의 공연장
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
          placeholder="공연장명 검색..."
          class="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-600"
        />
      </div>

      <div class="flex gap-2 overflow-x-auto">
        <button
          @click="handleRegionFilter(null)"
          class="px-4 py-3 rounded-lg whitespace-nowrap transition-colors"
          :class="
            selectedRegion === null
              ? 'bg-red-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          "
        >
          전체 권역
        </button>
        <button
          v-for="region in regions"
          :key="region"
          @click="handleRegionFilter(region)"
          class="px-4 py-3 rounded-lg whitespace-nowrap transition-colors"
          :class="
            selectedRegion === region
              ? 'bg-red-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          "
        >
          {{ region }}
        </button>
      </div>
    </div>

    <!-- 공연장 목록 -->
    <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>

      <div v-else class="overflow-x-auto max-h-[600px] overflow-y-auto" @scroll="handleScroll">
        <table class="w-full">
          <thead class="bg-gray-800 sticky top-0 z-10">
            <tr class="border-b border-gray-700">
              <th class="text-left text-gray-400 p-4 bg-gray-800">공연장명</th>
              <th class="text-left text-gray-400 p-4 bg-gray-800">권역</th>
              <th class="text-left text-gray-400 p-4 bg-gray-800">시설특성</th>
              <th class="text-left text-gray-400 p-4 bg-gray-800">관리</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="venue in venues"
              :key="venue.mt10id"
              class="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
            >
              <td class="p-4">
                <p class="text-white">
                  {{ venue.fcltynm }}
                </p>
              </td>

              <td class="p-4 text-gray-300">
                <div class="font-medium">{{ getRegionFromArea(venue.sidonm + ' ' + venue.gugunnm) }}</div>
                <div class="text-sm text-gray-400">{{ venue.sidonm }} {{ venue.gugunnm }}</div>
              </td>

              <td class="p-4">
                <span class="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm">
                  {{ venue.fcltychartr || '일반' }}
                </span>
              </td>

              <td class="p-4">
                <div class="flex gap-2">
                  <button
                    @click="handleEdit(venue)"
                    class="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    title="수정"
                  >
                    <Edit class="w-4 h-4 text-white" />
                  </button>
                  <button
                    @click="handleDelete(venue.mt10id)"
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
        <div v-if="!hasMore && venues.length > 0" class="text-center py-4 text-gray-400 text-sm">
          모든 공연장을 불러왔습니다
        </div>
      </div>
    </div>

    <!-- 수정 모달 -->
    <VenueEditModal
      :is-open="isEditModalOpen"
      :venue="selectedVenue"
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
import VenueEditModal from './VenueEditModal.vue'

/* 상태 */
const venues = ref<any[]>([])
const regions = ref<string[]>([])
const searchTerm = ref('')
const selectedRegion = ref<string | null>(null)
const isLoading = ref(true)
const isLoadingMore = ref(false)
const hasMore = ref(true)
const currentPage = ref(0)
const totalCount = ref(0)

/* 모달 상태 */
const isEditModalOpen = ref(false)
const selectedVenue = ref<any>(null)

let searchTimeout: NodeJS.Timeout | null = null

/* 핸들러 */
const handleEdit = (venue: any) => {
  selectedVenue.value = venue
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
  selectedVenue.value = null
}

const handleSave = async (data: any) => {
  try {
    await adminService.updateVenue(data.mt10id, {
      fcltynm: data.fcltynm,
      fcltychartr: data.fcltychartr,
      sidonm: data.sidonm,
      gugunnm: data.gugunnm
    })
    toast.success('공연장 정보가 수정되었습니다')
    closeEditModal()
    // 목록 새로고침
    await loadVenues(true)
  } catch (error) {
    console.error('수정 실패:', error)
    toast.error('수정에 실패했습니다')
  }
}

const handleDelete = async (mt10id: string) => {
  if (confirm('정말 이 공연장을 삭제하시겠습니까?')) {
    try {
      await adminService.deleteVenue(mt10id)
      toast.success('공연장이 삭제되었습니다')
      // 목록 새로고침
      await loadVenues(true)
    } catch (error) {
      console.error('삭제 실패:', error)
      toast.error('삭제에 실패했습니다')
    }
  }
}

/* 권역 목록 로드 */
const loadRegions = async () => {
  try {
    const response = await adminService.getRegionStats()
    if (response.data) {
      // 권역별로 그룹화
      const regionMap = new Map<string, number>()

      response.data.forEach((item: any) => {
        const area = item.area as string
        const region = getRegionFromArea(area)
        const count = regionMap.get(region) || 0
        regionMap.set(region, count + (item.count || 1))
      })

      // 권역 목록 추출 (데이터가 있는 권역만)
      regions.value = Array.from(regionMap.keys()).sort()
      console.log('Loaded regions:', regions.value)
    }
  } catch (error) {
    console.error('권역 목록 로드 실패:', error)
    // 폴백: 기본 권역 목록 사용
    regions.value = ['서울', '경기/인천', '충청/강원', '대구/경북', '부산/경남', '광주/전라', '제주']
  }
}

/* 지역을 권역으로 변환하는 함수 */
const getRegionFromArea = (area: string): string => {
  if (!area) return '기타'

  if (area.includes('서울')) return '서울'
  if (area.includes('경기') || area.includes('인천')) return '경기/인천'
  if (area.includes('충청') || area.includes('충남') || area.includes('충북') ||
      area.includes('강원') || area.includes('대전') || area.includes('세종')) return '충청/강원'
  if (area.includes('대구') || area.includes('경북') || area.includes('경상북도')) return '대구/경북'
  if (area.includes('부산') || area.includes('경남') || area.includes('경상남도') || area.includes('울산')) return '부산/경남'
  if (area.includes('광주') || area.includes('전라') || area.includes('전남') || area.includes('전북')) return '광주/전라'
  if (area.includes('제주')) return '제주'

  return '기타'
}

/* 데이터 로드 */
const loadVenues = async (reset = false) => {
  if (isLoadingMore.value || (!hasMore.value && !reset)) return
  
  try {
    if (reset) {
      isLoading.value = true
      currentPage.value = 0
      venues.value = []
      hasMore.value = true
    } else {
      isLoadingMore.value = true
    }
    
    const response = await adminService.getAdminVenues({
      page: currentPage.value,
      size: 50,
      search: searchTerm.value || undefined,
      region: selectedRegion.value || undefined
    })
    
    if (response.data) {
      const newVenues = response.data.venues || []
      
      if (reset) {
        venues.value = newVenues
      } else {
        venues.value.push(...newVenues)
      }
      
      // 페이지 증가
      currentPage.value++
      
      // 총 개수 업데이트
      if (response.data.pagination) {
        totalCount.value = response.data.pagination.totalItems
      }
      
      // 더 이상 데이터가 없으면 중단
      if (newVenues.length < 50) {
        hasMore.value = false
      }
    }
  } catch (error) {
    console.error('공연장 목록 로드 실패:', error)
    toast.error('공연장 목록을 불러오는데 실패했습니다')
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

/* 검색 핸들러 */
const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(() => {
    loadVenues(true)
  }, 500)
}

/* 지역 필터 핸들러 */
const handleRegionFilter = (region: string | null) => {
  selectedRegion.value = region
  loadVenues(true)
}

/* 스크롤 이벤트 핸들러 */
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight
  
  // 80% 스크롤 시 다음 페이지 로드
  if (scrollPercentage > 0.8 && hasMore.value && !isLoadingMore.value) {
    loadVenues()
  }
}

/* 초기 로드 */
onMounted(() => {
  loadRegions()
  loadVenues(true)
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
