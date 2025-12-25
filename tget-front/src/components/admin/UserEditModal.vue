<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    @click.self="handleClose"
  >
    <div class="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- 헤더 -->
      <div class="flex items-center justify-between p-6 border-b border-gray-700">
        <h2 class="text-xl text-white font-bold">유저 수정</h2>
        <button
          @click="handleClose"
          class="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X class="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <!-- 폼 -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <div>
          <label class="block text-sm text-gray-400 mb-2">유저 ID</label>
          <input
            v-model="formData.userid"
            type="text"
            disabled
            class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-500"
          />
        </div>

        <div>
          <label class="block text-sm text-gray-400 mb-2">이름 *</label>
          <input
            v-model="formData.name"
            type="text"
            required
            class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
          />
        </div>

        <div>
          <label class="block text-sm text-gray-400 mb-2">이메일 *</label>
          <input
            v-model="formData.email"
            type="email"
            required
            class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
          />
        </div>

        <div>
          <label class="block text-sm text-gray-400 mb-2">전화번호</label>
          <input
            v-model="formData.phone"
            type="tel"
            class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
          />
        </div>

        <div>
          <label class="block text-sm text-gray-400 mb-2">역할</label>
          <select
            v-model.number="formData.roleid"
            class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
          >
            <option :value="2">USER (일반 사용자)</option>
            <option :value="1">ADMIN (관리자)</option>
            <option :value="3">BUSNIESS (기업 회원)</option>
          </select>
        </div>

        <!-- 액션 버튼 -->
        <div class="flex gap-3 pt-4">
          <button
            type="button"
            @click="handleClose"
            class="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            class="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            저장
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

interface Props {
  isOpen: boolean
  user: any
}

interface Emits {
  (e: 'close'): void
  (e: 'save', data: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formData = ref({
  userid: 0,
  name: '',
  email: '',
  phone: '',
  roleid: 2  // 기본값: USER (DB에서 2=USER)
})

watch(() => props.user, (newVal) => {
  if (newVal) {
    formData.value = {
      userid: newVal.userid || 0,
      name: newVal.name || '',
      email: newVal.email || '',
      phone: newVal.phone || '',
      roleid: newVal.roleid || 2  // 기본값: USER
    }
  }
}, { immediate: true })

const handleClose = () => {
  emit('close')
}

const handleSubmit = () => {
  emit('save', formData.value)
}
</script>
