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
          <h1 class="text-2xl font-bold">공연 등록</h1>
        </div>
      </div>
    </div>

    <!-- 등록 폼 -->
    <div class="max-w-4xl mx-auto px-6 py-8">
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

        <!-- 지역 선택 -->
        <div>
          <label class="block text-sm font-medium mb-2">지역 *</label>
          <div v-if="loadingAreas" class="text-gray-400">지역 목록 불러오는 중...</div>
          <div v-else class="space-y-2 max-h-64 overflow-y-auto p-2 border border-gray-800 rounded-lg">
            <button
              v-for="areaObj in areas"
              :key="areaObj.original"
              type="button"
              @click="selectArea(areaObj)"
              :class="[
                'w-full px-4 py-2 rounded-lg text-left transition-all',
                form.area === areaObj.original
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 hover:bg-gray-700'
              ]"
            >
              {{ areaObj.short }}
            </button>
          </div>
        </div>

        <!-- 공연장 선택 -->
        <div v-if="form.area">
          <label class="block text-sm font-medium mb-2">공연장 *</label>
          <div v-if="loadingVenues" class="text-gray-400">공연장 목록 불러오는 중...</div>
          <div v-else-if="venues.length === 0" class="text-gray-400">해당 지역에 공연장이 없습니다</div>
          <div v-else class="space-y-2 max-h-64 overflow-y-auto p-2 border border-gray-800 rounded-lg">
            <button
              v-for="venue in venues"
              :key="venue.mt10id"
              type="button"
              @click="selectVenue(venue)"
              :class="[
                'w-full px-4 py-3 rounded-lg text-left transition-all',
                form.mt10id === venue.mt10id
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 hover:bg-gray-700'
              ]"
            >
              <div class="font-medium">{{ venue.fcltynm }}</div>
              <div class="text-sm text-gray-400">{{ venue.sidonm }} {{ venue.gugunnm }}</div>
            </button>
          </div>
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

        <!-- 포스터 이미지 -->
        <div>
          <label class="block text-sm font-medium mb-2">포스터 이미지 *</label>
          <div class="flex items-start gap-4">
            <div class="flex-1">
              <input
                type="file"
                ref="fileInput"
                accept="image/*"
                @change="handleFileChange"
                class="hidden"
              />
              <button
                type="button"
                @click="$refs.fileInput.click()"
                class="w-full px-4 py-3 bg-gray-900 border-2 border-dashed border-gray-700 rounded-lg hover:border-red-600 transition-colors text-left"
              >
                <span v-if="selectedFileName" class="text-white">{{ selectedFileName }}</span>
                <span v-else class="text-gray-500">이미지를 선택하세요 (클릭)</span>
              </button>
              <p class="text-xs text-gray-500 mt-2">권장: 2:3 비율 (예: 400x600px), JPG/PNG, 최대 5MB</p>
            </div>
            <!-- 미리보기 -->
            <div v-if="previewUrl" class="w-32 h-48 rounded-lg overflow-hidden border-2 border-gray-800">
              <img :src="previewUrl" alt="포스터 미리보기" class="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        <!-- 버튼 -->
        <div class="flex gap-4 pt-4">
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
            class="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
          >
            {{ isSubmitting ? '등록 중...' : '공연 등록' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { localAxios } from '@/util/http-commons'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

const router = useRouter()
const api = localAxios()

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
const isSubmitting = ref(false)

const areas = ref([])
const venues = ref([])
const loadingAreas = ref(false)
const loadingVenues = ref(false)

const isFormValid = computed(() => {
  return form.value.prfnm &&
    form.value.genreName &&
    form.value.prfpdfrom &&
    form.value.prfpdto &&
    form.value.area &&
    form.value.mt10id &&
    form.value.prfstate &&
    selectedFile.value
})

// 지역명 축약 함수 (예: 서울특별시 → 서울)
const shortenAreaName = (areaName) => {
  if (!areaName) return ''
  
  // 정규식으로 간단하게 처리
  return areaName
    .replace(/특별시|광역시|특별자치시|특별자치도|도$/g, '')
    .replace(/^서울$/, '서울')
    .replace(/^부산$/, '부산')
    .replace(/^대구$/, '대구')
    .replace(/^인천$/, '인천')
    .replace(/^광주$/, '광주')
    .replace(/^대전$/, '대전')
    .replace(/^울산$/, '울산')
    .replace(/^세종$/, '세종')
    .replace(/^경기$/, '경기')
    .replace(/^강원$/, '강원')
    .replace(/^충청북$/, '충북')
    .replace(/^충청남$/, '충남')
    .replace(/^전라북$/, '전북')
    .replace(/^전북$/, '전북')
    .replace(/^전라남$/, '전남')
    .replace(/^경상북$/, '경북')
    .replace(/^경상남$/, '경남')
    .replace(/^제주$/, '제주')
}

// 지역 목록 불러오기
const loadAreas = async () => {
  loadingAreas.value = true
  try {
    console.log('🔍 지역 목록 요청 중...')
    const response = await api.get('/api/venues/areas')
    console.log('✅ 지역 목록 응답:', response.data)
    
    // 지역명을 2글자로 축약하고 중복 제거
    const areaMap = new Map()
    response.data.forEach(area => {
      const short = shortenAreaName(area)
      if (!areaMap.has(short)) {
        areaMap.set(short, area)
      }
    })
    
    areas.value = Array.from(areaMap.entries()).map(([short, original]) => ({
      original,
      short
    }))
    
    if (areas.value.length === 0) {
      toast.warning('등록된 지역이 없습니다')
    }
  } catch (error) {
    console.error('❌ 지역 목록 조회 실패:', error)
    console.error('에러 상세:', error.response?.data)
    toast.error(error.response?.data?.message || '지역 목록을 불러오지 못했습니다')
  } finally {
    loadingAreas.value = false
  }
}

// 지역 선택 시 공연장 목록 불러오기
const selectArea = async (areaObj) => {
  // 원본 지역명을 DB에 저장하고, 축약명은 화면에만 표시
  form.value.area = areaObj.original
  form.value.mt10id = ''
  form.value.fcltynm = ''
  
  loadingVenues.value = true
  try {
    console.log('🔍 공연장 목록 요청:', areaObj.original)
    const response = await api.get(`/api/venues/area/${encodeURIComponent(areaObj.original)}`)
    console.log('✅ 공연장 목록 응답:', response.data)
    venues.value = response.data
    
    if (venues.value.length === 0) {
      toast.info(`${areaObj.short} 지역에 공연장이 없습니다`)
    }
  } catch (error) {
    console.error('❌ 공연장 목록 조회 실패:', error)
    console.error('에러 상세:', error.response?.data)
    toast.error('공연장 목록을 불러오지 못했습니다')
    venues.value = []
  } finally {
    loadingVenues.value = false
  }
}

// 공연장 선택
const selectVenue = (venue) => {
  form.value.mt10id = venue.mt10id
  form.value.fcltynm = venue.fcltynm
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
  if (!selectedFile.value) {
    toast.error('포스터 이미지를 선택해주세요')
    return
  }

  // 날짜 유효성 검사
  if (form.value.prfpdfrom > form.value.prfpdto) {
    toast.error('종료일은 시작일보다 이후여야 합니다')
    return
  }

  isSubmitting.value = true

  try {
    const formData = new FormData()
    
    // 개별 필드로 추가 (JSON 대신 일반 form field로)
    formData.append('prfnm', form.value.prfnm)
    formData.append('genreName', form.value.genreName)
    formData.append('prfpdfrom', form.value.prfpdfrom)
    formData.append('prfpdto', form.value.prfpdto)
    formData.append('fcltynm', form.value.fcltynm)
    formData.append('area', form.value.area)
    formData.append('mt10id', form.value.mt10id)
    formData.append('prfstate', form.value.prfstate)
    formData.append('poster', selectedFile.value)

    const token = localStorage.getItem('accessToken')
    await api.post('/performances', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      }
    })
    
    toast.success('공연이 성공적으로 등록되었습니다')
    router.push('/performance-management')
  } catch (error) {
    console.error('공연 등록 실패:', error)
    toast.error(error.response?.data?.message || '공연 등록에 실패했습니다')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadAreas()
})
</script>
