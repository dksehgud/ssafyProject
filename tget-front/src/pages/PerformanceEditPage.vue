<template>
  <div class="min-h-screen bg-black text-white pt-20">
    <!-- 페이지 헤더 -->
    <div class="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
      <div class="max-w-6xl mx-auto px-6 py-4">
        <div class="flex items-center gap-4">
          <button
            @click="router.push('/performance-management')"
            class="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 class="text-2xl font-bold">공연 수정</h1>
        </div>
      </div>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-[60vh]">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
        <p class="text-gray-400">공연 정보를 불러오는 중...</p>
      </div>
    </div>

    <!-- 수정 폼 -->
    <div v-else class="max-w-4xl mx-auto px-6 py-8">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- 공연명 -->
        <div>
          <label class="block text-sm font-medium mb-2">공연명 *</label>
          <input
            v-model="form.prfnm"
            type="text"
            required
            class="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
            placeholder="공연 제목을 입력하세요"
          />
        </div>

        <!-- 장르 -->
        <div>
          <label class="block text-sm font-medium mb-2">장르 *</label>
          <div class="grid grid-cols-4 gap-3">
            <button
              v-for="genre in genres"
              :key="genre.id"
              type="button"
              @click="form.genreName = genre.name"
              :class="[
                'px-4 py-3 rounded-lg border-2 transition-all',
                form.genreName === genre.name
                  ? 'border-red-600 bg-red-600/20 text-white'
                  : 'border-gray-800 bg-gray-900 hover:border-gray-700'
              ]"
            >
              {{ genre.name }}
            </button>
          </div>
        </div>

        <!-- 공연 기간 -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">공연 시작일 *</label>
            <input
              v-model="form.prfpdfrom"
              type="date"
              required
              class="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">공연 종료일 *</label>
            <input
              v-model="form.prfpdto"
              type="date"
              required
              class="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>
        </div>

        <!-- 지역 선택 (읽기 전용) -->
        <div>
          <label class="block text-sm font-medium mb-2">지역</label>
          <input
            v-model="form.area"
            type="text"
            readonly
            class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed"
            placeholder="지역은 수정할 수 없습니다"
          />
        </div>

        <!-- 공연장 (읽기 전용) -->
        <div>
          <label class="block text-sm font-medium mb-2">공연장</label>
          <input
            v-model="form.fcltynm"
            type="text"
            readonly
            class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed"
            placeholder="공연장은 수정할 수 없습니다"
          />
        </div>

        <!-- 공연 상태 -->
        <div>
          <label class="block text-sm font-medium mb-2">공연 상태 *</label>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="state in states"
              :key="state"
              type="button"
              @click="form.prfstate = state"
              :class="[
                'px-4 py-3 rounded-lg border-2 transition-all',
                form.prfstate === state
                  ? 'border-red-600 bg-red-600/20 text-white'
                  : 'border-gray-800 bg-gray-900 hover:border-gray-700'
              ]"
            >
              {{ state }}
            </button>
          </div>
        </div>

        <!-- 포스터 이미지 (선택사항) -->
        <div>
          <label class="block text-sm font-medium mb-2">포스터 이미지 (변경 시에만 선택)</label>
          
          <!-- 현재 포스터 미리보기 -->
          <div v-if="!selectedFile && currentPosterUrl" class="mb-4">
            <p class="text-sm text-gray-400 mb-2">현재 포스터:</p>
            <div class="w-48 h-64 rounded-lg overflow-hidden border border-gray-800">
              <img :src="currentPosterUrl" alt="현재 포스터" class="w-full h-full object-cover" />
            </div>
          </div>

          <input
            type="file"
            accept="image/*"
            @change="handleFileChange"
            class="hidden"
            ref="fileInput"
          />
          <button
            type="button"
            @click="$refs.fileInput.click()"
            class="w-full px-4 py-8 border-2 border-dashed border-gray-700 rounded-lg hover:border-red-600 transition-colors text-gray-400 hover:text-white"
          >
            <div class="flex flex-col items-center gap-2">
              <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span v-if="selectedFileName">{{ selectedFileName }}</span>
              <span v-else>클릭하여 새 포스터 이미지 선택 (선택사항)</span>
              <span class="text-xs">JPG, PNG, GIF (최대 5MB)</span>
            </div>
          </button>

          <!-- 새 이미지 미리보기 -->
          <div v-if="previewUrl" class="mt-4">
            <p class="text-sm text-gray-400 mb-2">새 포스터 미리보기:</p>
            <div class="w-48 h-64 rounded-lg overflow-hidden border border-red-600">
              <img :src="previewUrl" alt="새 포스터 미리보기" class="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        <!-- 버튼 -->
        <div class="flex gap-4 pt-6">
          <button
            type="button"
            @click="router.push('/performance-management')"
            class="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            :disabled="isSubmitting || !isFormValid"
            :class="[
              'flex-1 px-6 py-3 rounded-lg transition-colors font-medium',
              isSubmitting || !isFormValid
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            ]"
          >
            {{ isSubmitting ? '수정 중...' : '수정 완료' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { localAxios } from '@/util/http-commons'
import { toast } from 'vue-sonner'
import { performanceService } from '@/api/performanceService'

const route = useRoute()
const router = useRouter()
const api = localAxios()

const performanceId = route.params.id

const genres = [
  { id: 1, name: '클래식' },
  { id: 2, name: '콘서트' },
  { id: 3, name: '뮤지컬' },
  { id: 4, name: '연극' }
]

const states = ['공연예정', '공연중', '공연완료']

const form = ref({
  prfnm: '',
  genreName: '',
  prfpdfrom: '',
  prfpdto: '',
  area: '',
  fcltynm: '',
  mt10id: '',
  prfstate: ''
})

const selectedFile = ref(null)
const selectedFileName = ref('')
const previewUrl = ref('')
const currentPosterUrl = ref('')
const isSubmitting = ref(false)
const isLoading = ref(true)

const fileInput = ref(null)

const isFormValid = computed(() => {
  return form.value.prfnm &&
    form.value.genreName &&
    form.value.prfpdfrom &&
    form.value.prfpdto &&
    form.value.area &&
    form.value.mt10id &&
    form.value.prfstate
  // 이미지는 선택사항 (기존 이미지 유지 가능)
})

// 공연 정보 불러오기
const loadPerformanceData = async () => {
  isLoading.value = true
  try {
    const data = await performanceService.getMyPerformances()
    const performance = data.find(p => p.mt20id === performanceId)
    
    if (!performance) {
      toast.error('공연 정보를 찾을 수 없습니다')
      router.push('/performance-management')
      return
    }

    // 폼 데이터 채우기
    form.value = {
      prfnm: performance.prfnm,
      genreName: performance.genreName,
      prfpdfrom: performance.prfpdfrom,
      prfpdto: performance.prfpdto,
      area: performance.area,
      fcltynm: performance.fcltynm,
      mt10id: performance.mt10id || performanceId,
      prfstate: performance.prfstate
    }

    // 현재 포스터 URL 설정
    if (performance.poster) {
      currentPosterUrl.value = performance.poster
    } else {
      currentPosterUrl.value = `http://localhost:81/performances/poster/${performanceId}`
    }

  } catch (error) {
    console.error('공연 정보 조회 실패:', error)
    toast.error('공연 정보를 불러오는데 실패했습니다')
    router.push('/performance-management')
  } finally {
    isLoading.value = false
  }
}

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 파일 크기 체크 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error('파일 크기는 5MB 이하여야 합니다')
    return
  }

  // 이미지 파일 체크
  if (!file.type.startsWith('image/')) {
    toast.error('이미지 파일만 업로드 가능합니다')
    return
  }

  selectedFile.value = file
  selectedFileName.value = file.name

  // 미리보기 생성
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target.result
  }
  reader.readAsDataURL(file)
}

const handleSubmit = async () => {
  // 날짜 유효성 검사
  if (form.value.prfpdfrom > form.value.prfpdto) {
    toast.error('종료일은 시작일보다 이후여야 합니다')
    return
  }

  isSubmitting.value = true

  try {
    const formData = new FormData()
    
    // 개별 필드로 추가
    formData.append('prfnm', form.value.prfnm)
    formData.append('genreName', form.value.genreName)
    formData.append('prfpdfrom', form.value.prfpdfrom)
    formData.append('prfpdto', form.value.prfpdto)
    formData.append('fcltynm', form.value.fcltynm)
    formData.append('area', form.value.area)
    formData.append('mt10id', form.value.mt10id)
    formData.append('prfstate', form.value.prfstate)
    
    // 새 이미지가 선택된 경우에만 추가
    if (selectedFile.value) {
      formData.append('poster', selectedFile.value)
    }

    const token = localStorage.getItem('accessToken')
    await api.put(`/performances/${performanceId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      }
    })
    
    toast.success('공연 정보가 수정되었습니다')
    router.push('/performance-management')
  } catch (error) {
    console.error('공연 수정 실패:', error)
    if (error.response?.status === 403) {
      toast.error('본인이 등록한 공연만 수정할 수 있습니다')
    } else {
      toast.error(error.response?.data?.message || '공연 수정에 실패했습니다')
    }
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadPerformanceData()
})
</script>
