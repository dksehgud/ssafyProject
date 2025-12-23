<script setup lang="ts">
import { authService } from '@/api/authService'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Label from '@/components/ui/Label.vue'
import { useAuthStore } from '@/stores/auth'
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Phone, User as UserIcon } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

const router = useRouter()
const authStore = useAuthStore()

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

    // 비밀번호 변경하는 경우
    if (formData.value.newPassword) {
      if (!formData.value.currentPassword) {
        toast.error('현재 비밀번호를 입력해주세요')
        return
      }
      updateData.currentPassword = formData.value.currentPassword
      updateData.newPassword = formData.value.newPassword
    }

    await authService.modify(updateData)
    
    // 사용자 정보 업데이트
    const updatedUserInfo = {
      ...authStore.userInfo,
      name: formData.value.name,
      phone: formData.value.phone
    }
    authStore.userInfo = updatedUserInfo
    localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))

    toast.success('회원정보가 수정되었습니다')
    isEditing.value = false
    
    // 비밀번호 필드 초기화
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
</script>

<template>
  <div class="min-h-screen bg-black relative overflow-hidden flex items-center justify-center py-4 sm:py-12 pt-20">
    <!-- 배경 그라디언트 -->
    <div class="absolute inset-0 bg-gradient-to-b from-red-950/20 via-black to-black" />
    
    <!-- 배경 패턴 -->
    <div class="absolute inset-0 opacity-5">
      <div class="absolute inset-0" :style="{
        backgroundImage: 'url(\'data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')',
      }" />
    </div>

    <!-- 뒤로가기 버튼 -->
    <button
      @click="router.go(-1)"
      class="fixed top-4 left-4 sm:top-8 sm:left-8 z-50 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center transition-all backdrop-blur-sm border border-gray-800 hover:border-gray-600 group"
    >
      <ArrowLeft class="h-5 w-5 sm:h-6 sm:w-6 text-white group-hover:-translate-x-0.5 transition-transform" />
    </button>

    <!-- 메인 컨텐츠 -->
    <div class="relative z-10 w-full max-w-md px-3 sm:px-4">
      <div class="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800 shadow-2xl p-4 sm:p-8">
        <!-- 헤더 -->
        <div class="text-center mb-6 sm:mb-8">
          <div class="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-red-600/10 rounded-full mb-3 sm:mb-4">
            <UserIcon class="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">회원정보</h1>
          <p class="text-sm sm:text-base text-gray-400">개인정보 및 비밀번호를 관리하세요</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4 sm:space-y-6">
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
              <Label for="currentPassword" class="text-gray-300">
                현재 비밀번호
              </Label>
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
              <Label for="newPassword" class="text-gray-300">
                새 비밀번호
              </Label>
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
              <Label for="confirmPassword" class="text-gray-300">
                비밀번호 확인
              </Label>
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
