<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import { Ticket, MapPin, Calendar, Clock, X, ChevronRight, User as UserIcon, Eye, EyeOff, Lock, Mail, Phone } from "lucide-vue-next"

import Button from "@/components/ui/Button.vue"
import Input from "@/components/ui/Input.vue"
import Label from "@/components/ui/Label.vue"
import Dialog from "@/components/ui/Dialog.vue"
import DialogContent from "@/components/ui/DialogContent.vue"
import DialogHeader from "@/components/ui/DialogHeader.vue"
import DialogTitle from "@/components/ui/DialogTitle.vue"
import DialogDescription from "@/components/ui/DialogDescription.vue"
import { authService } from '@/api/authService'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner'

interface Reservation {
  reservationId: string
  performanceId: string
  performanceTitle: string
  poster: string
  facilityName: string
  area: string
  performanceDate: string
  performanceTime: string
  reservationDate: string
  seats: string[]
  totalPrice: number
  status: "confirmed" | "cancelled"
  category: string
}

const router = useRouter()
const authStore = useAuthStore()

// 탭 상태
const activeTab = ref<'profile' | 'reservations'>('profile')

// 회원정보 관련
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const isEditing = ref(false)

const formData = ref({
  name: '',
  phone: '',
  email: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 예약내역 관련
const filter = ref<"all" | "confirmed" | "cancelled">("all")
const selectedReservation = ref<Reservation | null>(null)

/* 샘플 데이터 - TODO: 실제 API 연동 필요 */
const reservations = ref<Reservation[]>([
  {
    reservationId: "R2025001",
    performanceId: "PF001",
    performanceTitle: "2025 락 페스티벌",
    poster: "https://images.unsplash.com/photo-1566735355835-bddb43dc3f63",
    facilityName: "올림픽공원 체조경기장",
    area: "서울특별시",
    performanceDate: "2025-12-15",
    performanceTime: "19:00",
    reservationDate: "2024-12-20 14:30",
    seats: ["A열 12번", "A열 13번"],
    totalPrice: 198000,
    status: "confirmed",
    category: "콘서트",
  },
  {
    reservationId: "R2025003",
    performanceId: "PF008",
    performanceTitle: "오페라의 유령",
    poster: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf",
    facilityName: "블루스퀘어",
    area: "서울특별시",
    performanceDate: "2024-12-25",
    performanceTime: "14:00",
    reservationDate: "2024-12-10 16:45",
    seats: ["VIP석 3열 15번", "VIP석 3열 16번"],
    totalPrice: 280000,
    status: "cancelled",
    category: "뮤지컬",
  },
])

/* 필터링 */
const filteredReservations = computed(() => {
  if (filter.value === "all") return reservations.value
  return reservations.value.filter(r => r.status === filter.value)
})

/* 상태 뱃지 */
const getStatusBadgeClass = (status: string) =>
  status === "confirmed"
    ? "bg-green-600/20 text-green-400 border-green-600/30"
    : "bg-red-600/20 text-red-400 border-red-600/30"

const getStatusLabel = (status: string) =>
  status === "confirmed" ? "예매완료" : "취소완료"

const getCategoryColor = (category: string) => {
  switch (category) {
    case "콘서트":
      return "bg-purple-600/20 text-purple-400 border-purple-600/30"
    case "뮤지컬":
      return "bg-pink-600/20 text-pink-400 border-pink-600/30"
    case "클래식":
      return "bg-blue-600/20 text-blue-400 border-blue-600/30"
    case "페스티벌":
      return "bg-orange-600/20 text-orange-400 border-orange-600/30"
    default:
      return "bg-gray-600/20 text-gray-400 border-gray-600/30"
  }
}

// 회원정보 관련 로직
onMounted(() => {
  if (!authStore.isAuthenticated) {
    toast.error('로그인이 필요합니다')
    router.push('/login')
    return
  }

  const userInfo = authStore.userInfo
  if (userInfo) {
    formData.value.name = userInfo.name || ''
    formData.value.phone = userInfo.phone || ''
    formData.value.email = userInfo.email || ''
  }
})

const passwordValidation = computed(() => {
  const pwd = formData.value.newPassword
  if (!pwd) return null

  return {
    length: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
  }
})

const isPasswordValid = computed(() => {
  if (!formData.value.newPassword) return true
  return passwordValidation.value && Object.values(passwordValidation.value).every(Boolean)
})

const isPasswordMatch = computed(() => {
  if (!formData.value.newPassword) return true
  return formData.value.newPassword === formData.value.confirmPassword
})

const handleSubmit = async () => {
  if (!isPasswordValid.value) {
    toast.error('비밀번호 조건을 확인해주세요')
    return
  }

  if (!isPasswordMatch.value) {
    toast.error('비밀번호가 일치하지 않습니다')
    return
  }

  try {
    const updateData: any = {
      userEmail: formData.value.email,
      name: formData.value.name,
      phone: formData.value.phone
    }

    if (formData.value.newPassword) {
      if (!formData.value.currentPassword) {
        toast.error('현재 비밀번호를 입력해주세요')
        return
      }
      updateData.currentPassword = formData.value.currentPassword
      updateData.newPassword = formData.value.newPassword
    }

    await authService.modify(updateData)

    const updatedUserInfo = {
      ...authStore.userInfo,
      name: formData.value.name,
      phone: formData.value.phone
    }
    authStore.userInfo = updatedUserInfo
    localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))

    toast.success('회원정보가 수정되었습니다')
    isEditing.value = false

    formData.value.currentPassword = ''
    formData.value.newPassword = ''
    formData.value.confirmPassword = ''
  } catch (error: any) {
    console.error('회원정보 수정 실패:', error)
    toast.error(error.response?.data?.message || '회원정보 수정에 실패했습니다')
  }
}

const handleCancel = () => {
  const userInfo = authStore.userInfo
  if (userInfo) {
    formData.value.name = userInfo.name || ''
    formData.value.phone = userInfo.phone || ''
  }
  formData.value.currentPassword = ''
  formData.value.newPassword = ''
  formData.value.confirmPassword = ''
  isEditing.value = false
}

// 예약 취소 함수
const handleCancelReservation = async (reservationId: string) => {
  if (!confirm('정말 예약을 취소하시겠습니까?')) {
    return
  }

  try {
    // TODO: 실제 API 호출로 교체 필요
    // await reservationService.cancelReservation(reservationId)

    // 임시로 상태 업데이트
    const reservation = reservations.value.find(r => r.reservationId === reservationId)
    if (reservation) {
      reservation.status = 'cancelled'
    }

    toast.success('예약이 취소되었습니다')
  } catch (error: any) {
    console.error('예약 취소 실패:', error)
    toast.error(error.response?.data?.message || '예약 취소에 실패했습니다')
  }
}
</script>

<template>
  <div class="min-h-screen bg-black pt-20">
    <!-- 헤더 -->
    <div class="border-b border-gray-800 bg-gradient-to-b from-red-900/20 to-black">
      <div class="container mx-auto px-6 py-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl text-white mb-2">마이페이지</h1>
            <p class="text-gray-400">회원정보 및 예약 내역을 관리하세요</p>
          </div>
          <button
            @click="router.push('/')"
            class="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            <X class="w-5 h-5 text-white" />
          </button>
        </div>

        <!-- 탭 네비게이션 -->
        <div class="flex gap-3 mt-6 border-b border-gray-800">
          <button
            @click="activeTab = 'profile'"
            class="px-5 py-2.5 transition-all relative font-medium"
            :class="activeTab === 'profile' ? 'text-red-500' : 'text-gray-400 hover:text-white'"
          >
            <UserIcon class="w-4 h-4 inline-block mr-2" />
            회원정보
            <div
              v-if="activeTab === 'profile'"
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"
            />
          </button>
          <button
            @click="activeTab = 'reservations'"
            class="px-5 py-2.5 transition-all relative font-medium"
            :class="activeTab === 'reservations' ? 'text-red-500' : 'text-gray-400 hover:text-white'"
          >
            <Ticket class="w-4 h-4 inline-block mr-2" />
            예약내역
            <div
              v-if="activeTab === 'reservations'"
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- 회원정보 탭 -->
    <div v-show="activeTab === 'profile'" class="container mx-auto px-6 py-8">
      <div class="max-w-md mx-auto bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800 shadow-2xl p-8">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- 이름 -->
          <div class="space-y-2">
            <Label for="name" class="text-gray-300 flex items-center gap-2">
              <UserIcon class="w-4 h-4" />
              이름
            </Label>
            <Input
              id="name"
              v-model="formData.name"
              type="text"
              :disabled="!isEditing"
              placeholder="홍길동"
              class="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 disabled:opacity-50"
            />
          </div>

          <!-- 휴대폰 번호 -->
          <div class="space-y-2">
            <Label for="phone" class="text-gray-300 flex items-center gap-2">
              <Phone class="w-4 h-4" />
              휴대폰 번호
            </Label>
            <Input
              id="phone"
              v-model="formData.phone"
              type="tel"
              :disabled="!isEditing"
              placeholder="010-1234-5678"
              class="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 disabled:opacity-50"
            />
          </div>

          <!-- 이메일 (읽기 전용) -->
          <div class="space-y-2">
            <Label for="email" class="text-gray-300 flex items-center gap-2">
              <Mail class="w-4 h-4" />
              이메일
            </Label>
            <Input
              id="email"
              v-model="formData.email"
              type="email"
              disabled
              class="bg-gray-800/30 border-gray-700 text-gray-500 cursor-not-allowed"
            />
            <p class="text-xs text-gray-500">이메일은 변경할 수 없습니다</p>
          </div>

          <template v-if="isEditing">
            <!-- 구분선 -->
            <div class="border-t border-gray-800 pt-6">
              <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Lock class="w-5 h-5" />
                비밀번호 변경 (선택사항)
              </h3>
            </div>

            <!-- 현재 비밀번호 -->
            <div class="space-y-2">
              <Label for="currentPassword" class="text-gray-300">현재 비밀번호</Label>
              <div class="relative">
                <Input
                  id="currentPassword"
                  v-model="formData.currentPassword"
                  :type="showCurrentPassword ? 'text' : 'password'"
                  placeholder="현재 비밀번호 입력"
                  class="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 pr-10"
                />
                <button
                  type="button"
                  @click="showCurrentPassword = !showCurrentPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <Eye v-if="showCurrentPassword" class="h-5 w-5" />
                  <EyeOff v-else class="h-5 w-5" />
                </button>
              </div>
            </div>

            <!-- 새 비밀번호 -->
            <div class="space-y-2">
              <Label for="newPassword" class="text-gray-300">새 비밀번호</Label>
              <div class="relative">
                <Input
                  id="newPassword"
                  v-model="formData.newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  placeholder="새 비밀번호 입력"
                  class="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 pr-10"
                />
                <button
                  type="button"
                  @click="showNewPassword = !showNewPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <Eye v-if="showNewPassword" class="h-5 w-5" />
                  <EyeOff v-else class="h-5 w-5" />
                </button>
              </div>

              <!-- 비밀번호 조건 -->
              <div v-if="passwordValidation && formData.newPassword" class="space-y-1 mt-2">
                <p class="text-xs text-gray-400 mb-2">비밀번호 조건:</p>
                <div class="space-y-1">
                  <div class="flex items-center gap-2 text-xs" :class="passwordValidation.length ? 'text-green-500' : 'text-gray-500'">
                    <span class="w-4">{{ passwordValidation.length ? '✓' : '○' }}</span>
                    <span>8자 이상</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs" :class="passwordValidation.uppercase ? 'text-green-500' : 'text-gray-500'">
                    <span class="w-4">{{ passwordValidation.uppercase ? '✓' : '○' }}</span>
                    <span>대문자 포함</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs" :class="passwordValidation.lowercase ? 'text-green-500' : 'text-gray-500'">
                    <span class="w-4">{{ passwordValidation.lowercase ? '✓' : '○' }}</span>
                    <span>소문자 포함</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs" :class="passwordValidation.number ? 'text-green-500' : 'text-gray-500'">
                    <span class="w-4">{{ passwordValidation.number ? '✓' : '○' }}</span>
                    <span>숫자 포함</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs" :class="passwordValidation.special ? 'text-green-500' : 'text-gray-500'">
                    <span class="w-4">{{ passwordValidation.special ? '✓' : '○' }}</span>
                    <span>특수문자 포함</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 비밀번호 확인 -->
            <div class="space-y-2">
              <Label for="confirmPassword" class="text-gray-300">비밀번호 확인</Label>
              <div class="relative">
                <Input
                  id="confirmPassword"
                  v-model="formData.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="비밀번호 재입력"
                  class="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 pr-10"
                />
                <button
                  type="button"
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <Eye v-if="showConfirmPassword" class="h-5 w-5" />
                  <EyeOff v-else class="h-5 w-5" />
                </button>
              </div>
              <p v-if="formData.confirmPassword && !isPasswordMatch" class="text-xs text-red-500">
                비밀번호가 일치하지 않습니다
              </p>
              <p v-else-if="formData.confirmPassword && isPasswordMatch" class="text-xs text-green-500">
                비밀번호가 일치합니다
              </p>
            </div>
          </template>

          <!-- 버튼 -->
          <div class="space-y-3 pt-4">
            <Button
              v-if="!isEditing"
              type="button"
              @click="isEditing = true"
              class="w-full bg-red-600 hover:bg-red-700 text-white h-12"
            >
              수정하기
            </Button>

            <template v-else>
              <Button
                type="submit"
                class="w-full bg-red-600 hover:bg-red-700 text-white h-12"
              >
                저장하기
              </Button>
              <Button
                type="button"
                @click="handleCancel"
                variant="ghost"
                class="w-full border border-gray-700 text-gray-300 hover:bg-gray-800 h-12"
              >
                취소
              </Button>
            </template>
          </div>
        </form>
      </div>
    </div>

    <!-- 예약내역 탭 -->
    <div v-show="activeTab === 'reservations'" class="container mx-auto px-6 py-8">
      <!-- 필터 -->
      <div class="flex gap-3 mb-6">
        <button
          v-for="f in ['all','confirmed','cancelled']"
          :key="f"
          @click="filter = f as any"
          class="px-5 py-2.5 rounded-full transition-all"
          :class="filter === f ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'"
        >
          {{ f === 'all' ? '전체' : f === 'confirmed' ? '예매완료' : '취소완료' }}
        </button>
      </div>

      <!-- 예약 목록 -->
      <div v-if="filteredReservations.length === 0" class="text-center py-20 text-gray-400">
        <Ticket class="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p class="text-lg">예약 내역이 없습니다</p>
      </div>

      <div v-else class="space-y-6">
        <div
          v-for="r in filteredReservations"
          :key="r.reservationId"
          class="bg-gray-900/80 border border-gray-800 rounded-xl p-6 hover:border-red-600 transition-all"
        >
          <div class="flex gap-6">
            <img
              :src="r.poster"
              :alt="r.performanceTitle"
              class="w-40 h-56 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
              @click="router.push(`/ticket/${r.performanceId}`)"
            />

            <div class="flex-1 space-y-4">
              <div>
                <span
                  class="px-3 py-1 text-xs rounded-full border mr-2"
                  :class="getStatusBadgeClass(r.status)"
                >
                  {{ getStatusLabel(r.status) }}
                </span>
                <span
                  class="px-3 py-1 text-xs rounded-full border"
                  :class="getCategoryColor(r.category)"
                >
                  {{ r.category }}
                </span>
              </div>

              <h3
                class="text-xl text-white cursor-pointer hover:text-red-500 transition-colors"
                @click="router.push(`/ticket/${r.performanceId}`)"
              >
                {{ r.performanceTitle }}
              </h3>

              <div class="grid grid-cols-2 gap-2 text-sm text-gray-300">
                <div class="flex gap-2">
                  <MapPin class="w-4 h-4 text-red-500 flex-shrink-0" />
                  {{ r.facilityName }}
                </div>
                <div class="flex gap-2">
                  <Calendar class="w-4 h-4 text-red-500 flex-shrink-0" />
                  {{ r.performanceDate }} {{ r.performanceTime }}
                </div>
                <div class="flex gap-2">
                  <Ticket class="w-4 h-4 text-red-500 flex-shrink-0" />
                  {{ r.seats.join(", ") }}
                </div>
                <div class="flex gap-2">
                  <Clock class="w-4 h-4 text-red-500 flex-shrink-0" />
                  {{ r.reservationDate }}
                </div>
              </div>

              <div class="flex justify-between pt-4 border-t border-gray-800 items-center gap-3">
                <p class="text-2xl text-white font-bold">{{ r.totalPrice.toLocaleString() }}원</p>
                <div class="flex gap-2">
                  <Button
                    v-if="r.status === 'confirmed'"
                    variant="outline"
                    class="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                    @click="handleCancelReservation(r.reservationId)"
                  >
                    예약취소
                  </Button>
                  <Button variant="outline" @click="selectedReservation = r">상세보기</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 상세 모달 -->
    <Dialog :open="!!selectedReservation" @update:open="(val) => !val && (selectedReservation = null)">
      <DialogContent class="bg-gray-900 border-gray-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle class="text-xl">예약 상세 정보</DialogTitle>
          <DialogDescription class="text-gray-400">
            예약번호: {{ selectedReservation?.reservationId }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="selectedReservation" class="mt-6 space-y-4">
          <div class="bg-gray-800/50 rounded-lg p-4 space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-400">공연명</span>
              <span class="text-white font-medium">{{ selectedReservation.performanceTitle }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">장소</span>
              <span class="text-white">{{ selectedReservation.facilityName }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">관람일시</span>
              <span class="text-white">{{ selectedReservation.performanceDate }} {{ selectedReservation.performanceTime }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">좌석</span>
              <span class="text-white">{{ selectedReservation.seats.join(", ") }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">예약일시</span>
              <span class="text-white">{{ selectedReservation.reservationDate }}</span>
            </div>
            <div class="flex justify-between text-lg font-bold pt-2 border-t border-gray-700">
              <span class="text-gray-400">총 결제금액</span>
              <span class="text-red-500">{{ selectedReservation.totalPrice.toLocaleString() }}원</span>
            </div>
          </div>

          <Button
            class="w-full bg-red-600 hover:bg-red-700 h-12"
            @click="router.push(`/ticket/${selectedReservation.performanceId}`)"
          >
            공연 상세보기
            <ChevronRight class="ml-2 w-5 h-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
/* 애니메이션 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.space-y-6 > * {
  animation: fadeIn 0.3s ease-out;
}
</style>
