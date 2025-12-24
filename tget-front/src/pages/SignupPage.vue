<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { Eye, EyeOff, ArrowLeft, Check, Send } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import Checkbox from '@/components/ui/Checkbox.vue'
import { toast } from 'vue-sonner'

import { useAuthStore } from '@/stores/auth'
import { authService } from '@/api/authService'

const router = useRouter()
const authStore = useAuthStore()
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const formData = ref({
  email: "",
  password: "",
  confirmPassword: "",
  name: "",
  phone: "",
  verificationCode: "",
})

const agreedToTerms = ref(false)
const agreedToPrivacy = ref(false)

// 이메일 인증 관련 상태
const isEmailVerified = ref(false)
const isCodeSent = ref(false)
const isSendingCode = ref(false)
const isVerifyingCode = ref(false)
const verificationTimer = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

const passwordValidation = computed(() => {
  const pwd = formData.value.password
  return {
    length: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
  }
})

const isPasswordValid = computed(() => Object.values(passwordValidation.value).every(Boolean))

const isFormValid = computed(() => 
  formData.value.email &&
  formData.value.password &&
  formData.value.confirmPassword &&
  formData.value.name &&
  formData.value.phone &&
  isPasswordValid.value &&
  formData.value.password === formData.value.confirmPassword &&
  agreedToTerms.value &&
  agreedToPrivacy.value &&
  isEmailVerified.value  // 이메일 인증 필수
)

// 타이머 포맷팅 (MM:SS)
const formattedTimer = computed(() => {
  const minutes = Math.floor(verificationTimer.value / 60)
  const seconds = verificationTimer.value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

/**
 * 인증번호 전송
 */
const sendVerificationCode = async () => {
  if (!formData.value.email) {
    toast.error('이메일을 입력해주세요')
    return
  }

  // 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.value.email)) {
    toast.error('올바른 이메일 형식이 아닙니다')
    return
  }

  try {
    isSendingCode.value = true
    await authService.sendVerificationCode(formData.value.email)
    
    isCodeSent.value = true
    toast.success('인증번호가 전송되었습니다')
    
    // 3분 타이머 시작
    verificationTimer.value = 180
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      verificationTimer.value--
      if (verificationTimer.value <= 0) {
        clearInterval(timerInterval!)
        isCodeSent.value = false
        toast.error('인증 시간이 만료되었습니다. 다시 시도해주세요.')
      }
    }, 1000)
  } catch (error: any) {
    console.error('인증번호 전송 실패:', error)
    console.log('=== 에러 상세 정보 ===')
    console.log('상태 코드:', error.response?.status)
    console.log('응답 데이터:', error.response?.data)
    console.log('===================')
    
    // 백엔드 에러 응답 처리
    const errorData = error.response?.data
    let errorMessage = '인증번호 전송에 실패했습니다'
    
    // ErrorCode가 AUTH_004 (EMAIL_DUPLICATED)인 경우
    if (errorData?.code === 'AUTH_004') {
      errorMessage = '이미 가입된 이메일입니다'
    } 
    // 일반적인 메시지가 있는 경우 (두 가지 형식 모두 지원)
    else if (errorData?.message) {
      errorMessage = errorData.message
    }
    
    // 한 번만 토스트 표시
    toast.error(errorMessage)
  } finally {
    isSendingCode.value = false
  }
}

/**
 * 인증번호 확인
 */
const verifyCode = async () => {
  if (!formData.value.verificationCode) {
    toast.error('인증번호를 입력해주세요')
    return
  }

  try {
    isVerifyingCode.value = true
    await authService.verifyCode(formData.value.email, formData.value.verificationCode)
    
    isEmailVerified.value = true
    isCodeSent.value = false
    if (timerInterval) clearInterval(timerInterval)
    
    toast.success('이메일 인증이 완료되었습니다')
  } catch (error: any) {
    console.error('인증번호 확인 실패:', error)
    toast.error(error.response?.data?.message || '인증번호가 일치하지 않습니다')
  } finally {
    isVerifyingCode.value = false
  }
}

/**
 * 회원가입 처리 함수
 * @description JWT 기반 회원가입
 * @param {Event} e - 폼 제출 이벤트
 * 
 * @note
 * - authStore.userSignup()을 호출하여 회원가입 수행
 * - 백엔드에서 토큰을 반환하면 자동 로그인 처리
 * - 회원가입 성공 후 홈페이지로 이동
 */
const handleSubmit = async (e: Event) => {
  e.preventDefault()
  
  if (isFormValid.value) {
    try {
      // JWT 회원가입 수행 (userSignup은 authStore에서 정의)
      await authStore.userSignup({
        email: formData.value.email,
        password: formData.value.password,
        name: formData.value.name,
        phone: formData.value.phone
      })
      
      // 회원가입 성공 알림
      toast.success('회원가입 성공!')
      
      // 홈페이지로 이동 (자동 로그인되었을 수 있음)
      router.push("/")
    } catch (error) {
      // 회원가입 실패 처리
      console.error("회원가입 에러:", error)
      toast.error('회원가입 실패: 다시 시도해주세요.')
    }
  }
}
</script>

<template>
  <div class="min-h-screen bg-black relative overflow-hidden flex items-center justify-center py-12">
    <!-- 배경 그라디언트 -->
    <div class="absolute inset-0 bg-gradient-to-b from-red-950/20 via-black to-black" />
    
    <!-- 배경 패턴 -->
    <div class="absolute inset-0 opacity-5">
      <div class="absolute inset-0" :style="{
        backgroundImage: 'url(\'data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')',
      }" />
    </div>

    <!-- 뒤로가기 버튼 - 좌측 상단 고정 -->
    <button
      @click="router.push('/')"
      class="absolute top-8 left-8 z-20 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center transition-all backdrop-blur-sm border border-gray-800 hover:border-gray-600 group"
    >
      <ArrowLeft class="h-6 w-6 text-white group-hover:-translate-x-0.5 transition-transform" />
    </button>

    <!-- 회원가입 폼 컨테이너 -->
    <Transition name="fade-up" appear>
      <div class="relative z-10 w-full max-w-md mx-4">
        <!-- 로고 -->
        <RouterLink to="/" class="flex items-center justify-center gap-2 mb-8">
          <!-- <img src="@/assets/logo.png" alt="Tget" class="h-12" /> -->
          <span class="text-3xl font-bold text-red-600">TGET</span>
        </RouterLink>

        <!-- 회원가입 폼 -->
        <div class="bg-black/70 backdrop-blur-md border border-gray-800 rounded-lg p-8 shadow-2xl">
          <h2 class="text-2xl text-white mb-6 text-center">회원가입</h2>

          <form @submit="handleSubmit" class="space-y-5">
            <!-- 이메일 -->
            <div class="space-y-2">
              <Label for="email" class="text-gray-300">이메일</Label>
              <div class="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  v-model="formData.email"
                  :disabled="isEmailVerified"
                  class="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-red-600 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
                <Button
                  type="button"
                  @click="sendVerificationCode"
                  :disabled="isSendingCode || isEmailVerified || !formData.email"
                  class="bg-red-600 hover:bg-red-700 text-white whitespace-nowrap disabled:bg-gray-700 disabled:cursor-not-allowed"
                >
                  <Send class="w-4 h-4 mr-1" />
                  {{ isEmailVerified ? '인증완료' : '인증번호' }}
                </Button>
              </div>
              <p v-if="isEmailVerified" class="text-xs text-green-500 flex items-center gap-1">
                <Check class="w-3 h-3" />
                이메일 인증이 완료되었습니다
              </p>
            </div>

            <!-- 인증번호 입력 -->
            <div v-if="isCodeSent && !isEmailVerified" class="space-y-2">
              <Label for="verificationCode" class="text-gray-300 flex items-center justify-between">
                <span>인증번호</span>
                <span class="text-red-500 text-sm font-mono">{{ formattedTimer }}</span>
              </Label>
              <div class="flex gap-2">
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="6자리 인증번호"
                  v-model="formData.verificationCode"
                  maxlength="6"
                  class="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-red-600 focus:ring-red-600"
                />
                <Button
                  type="button"
                  @click="verifyCode"
                  :disabled="isVerifyingCode || !formData.verificationCode"
                  class="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap disabled:bg-gray-700 disabled:cursor-not-allowed"
                >
                  확인
                </Button>
              </div>
              <p class="text-xs text-gray-400">
                이메일로 전송된 6자리 인증번호를 입력해주세요
              </p>
            </div>

            <!-- 비밀번호 -->
            <div class="space-y-2">
              <Label for="password" class="text-gray-300">비밀번호</Label>
              <div class="relative">
                <Input
                  id="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  v-model="formData.password"
                  class="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-red-600 focus:ring-red-600 pr-10"
                  required
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  <EyeOff v-if="showPassword" class="h-5 w-5" />
                  <Eye v-else class="h-5 w-5" />
                </button>
              </div>
              
              <!-- 비밀번호 검증 -->
              <div v-if="formData.password" class="mt-2 space-y-1 text-xs">
                <div class="flex items-center gap-1" :class="passwordValidation.length ? 'text-green-500' : 'text-gray-500'">
                  <Check class="h-3 w-3" />
                  <span>8자 이상</span>
                </div>
                <div class="flex items-center gap-1" :class="passwordValidation.uppercase ? 'text-green-500' : 'text-gray-500'">
                  <Check class="h-3 w-3" />
                  <span>대문자 포함</span>
                </div>
                <div class="flex items-center gap-1" :class="passwordValidation.lowercase ? 'text-green-500' : 'text-gray-500'">
                  <Check class="h-3 w-3" />
                  <span>소문자 포함</span>
                </div>
                <div class="flex items-center gap-1" :class="passwordValidation.number ? 'text-green-500' : 'text-gray-500'">
                  <Check class="h-3 w-3" />
                  <span>숫자 포함</span>
                </div>
                <div class="flex items-center gap-1" :class="passwordValidation.special ? 'text-green-500' : 'text-gray-500'">
                  <Check class="h-3 w-3" />
                  <span>특수문자 포함</span>
                </div>
              </div>
            </div>

            <!-- 비밀번호 확인 -->
            <div class="space-y-2">
              <Label for="confirmPassword" class="text-gray-300">비밀번호 확인</Label>
              <div class="relative">
                <Input
                  id="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  v-model="formData.confirmPassword"
                  class="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-red-600 focus:ring-red-600 pr-10"
                  required
                />
                <button
                  type="button"
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  <EyeOff v-if="showConfirmPassword" class="h-5 w-5" />
                  <Eye v-else class="h-5 w-5" />
                </button>
              </div>
              <p v-if="formData.confirmPassword && formData.password !== formData.confirmPassword" class="text-xs text-red-500">
                비밀번호가 일치하지 않습니다
              </p>
            </div>

            <!-- 이름 -->
            <div class="space-y-2">
              <Label for="name" class="text-gray-300">이름</Label>
              <Input
                id="name"
                type="text"
                placeholder="홍길동"
                v-model="formData.name"
                class="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-red-600 focus:ring-red-600"
                required
              />
            </div>

            <!-- 전화번호 -->
            <div class="space-y-2">
              <Label for="phone" class="text-gray-300">전화번호</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="010-1234-5678"
                v-model="formData.phone"
                class="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-red-600 focus:ring-red-600"
                required
              />
            </div>

            <!-- 약관 동의 -->
            <div class="space-y-3 pt-2">
              <label class="flex items-start gap-2 text-sm text-gray-300 cursor-pointer">
                <Checkbox
                  :checked="agreedToTerms"
                  @update:checked="agreedToTerms = $event"
                  class="mt-0.5 border-gray-700 bg-gray-900 text-red-600 focus:ring-red-600"
                />
                <span>
                  <span class="text-red-500">*</span> 이용약관에 동의합니다
                </span>
              </label>
              <label class="flex items-start gap-2 text-sm text-gray-300 cursor-pointer">
                <Checkbox
                  :checked="agreedToPrivacy"
                  @update:checked="agreedToPrivacy = $event"
                  class="mt-0.5 border-gray-700 bg-gray-900 text-red-600 focus:ring-red-600"
                />
                <span>
                  <span class="text-red-500">*</span> 개인정보 처리방침에 동의합니다
                </span>
              </label>
            </div>

            <Button
              type="submit"
              :disabled="!isFormValid"
              class="w-full bg-red-600 hover:bg-red-700 text-white h-11 disabled:bg-gray-700 disabled:cursor-not-allowed"
            >
              회원가입
            </Button>
          </form>

          <!-- 로그인 링크 -->
          <div class="mt-6 text-center text-sm">
            <span class="text-gray-400">이미 계정이 있으신가요? </span>
            <RouterLink to="/login" class="text-red-600 hover:text-red-500 transition-colors">
              로그인
            </RouterLink>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
