<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { queueService } from '@/api/queueService'
import { AlertCircle, Clock, Users } from 'lucide-vue-next'

const props = defineProps<{
  token: string
  performanceId: string
  initialWaitingCount?: number
  initialEstimatedTime?: number
}>()

const emit = defineEmits(['close', 'complete'])

const waitingCount = ref(props.initialWaitingCount || 0)
const estimatedTime = ref(props.initialEstimatedTime || 0)
const progress = ref(0)
const errorMessage = ref<string | null>(null)

let pollingTimer: number | null = null

// 진행률 계산 (단순 시각적 효과) - 실제로는 대기 순번 감소 비율로 해야 정확함
const updateProgress = (currentPos: number, initialPos: number) => {
    if (initialPos <= 0) return 100
    const percent = Math.max(0, Math.min(100, ((initialPos - currentPos) / initialPos) * 100))
    progress.value = percent
}

const initialPos = ref(props.initialWaitingCount || 100)

const pollStatus = async () => {
  try {
    const data = await queueService.getQueueStatus(props.token, props.performanceId)
    
    if (data.status === 'ACTIVE') {
      // 내 순서 도달!
      progress.value = 100
      if (pollingTimer) clearInterval(pollingTimer)
      
      // 잠시 성공 화면 보여주고 완료 처리
      setTimeout(() => {
          emit('complete')
      }, 500)
      return
    }

    if (data.status === 'EXPIRED') {
        errorMessage.value = "대기 시간이 만료되었습니다. 다시 시도해주세요."
        if (pollingTimer) clearInterval(pollingTimer)
        return
    }

    // 대기 중 업데이트
    waitingCount.value = data.positionInQueue
    estimatedTime.value = data.estimatedWaitTime
    
    // 초기 위치 기준 진행률 업데이트 (대략적)
    if (data.positionInQueue > initialPos.value) {
        initialPos.value = data.positionInQueue // 불어난 경우 재설정
    }
    updateProgress(data.positionInQueue, initialPos.value)

  } catch (error) {
    console.error('Queue polling error:', error)
    // 일시적 에러는 무시하고 계속 재시도, 치명적 에러면 중단 로직 추가 가능
    // errorMessage.value = "서버 연결에 실패했습니다."
  }
}

onMounted(() => {
  // 즉시 한 번 조회
  pollStatus()
  // 1초마다 폴링
  pollingTimer = window.setInterval(pollStatus, 1000)
})

onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
  }
})

const handleCancel = () => {
    if (confirm('대기열을 나가시겠습니까?')) {
        emit('close')
    }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
    <div class="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        
      <!-- 배경 애니메이션 효과 -->
      <div class="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/40 via-transparent to-transparent"></div>

      <div class="relative text-center space-y-6">
        
        <div class="space-y-2">
            <h2 class="text-2xl font-bold text-white">접속 대기 중</h2>
            <p class="text-gray-400 text-sm">현재 예매량이 많아 대기 중입니다.</p>
        </div>



        <div class="grid grid-cols-2 gap-4">
            <!-- 내 앞 대기 -->
            <div class="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700 flex flex-col items-center justify-center gap-2">
                <Users class="w-6 h-6 text-red-500" />
                <div class="text-xs text-gray-400">내 앞 대기 순서</div>
                <div class="text-2xl font-bold text-white">{{ waitingCount }}<span class="text-sm font-normal text-gray-500 ml-1">명</span></div>
            </div>

            <!-- 예상 시간 -->
            <div class="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700 flex flex-col items-center justify-center gap-2">
                <Clock class="w-6 h-6 text-red-500" />
                <div class="text-xs text-gray-400">예상 대기 시간</div>
                <div class="text-2xl font-bold text-white">{{ estimatedTime }}<span class="text-sm font-normal text-gray-500 ml-1">분</span></div>
            </div>
        </div>

        <!-- Progress Circle or Bar -->
        <div class="relative py-4">
            <div class="w-full bg-zinc-800 rounded-full h-4 overflow-hidden">
                <div class="bg-red-600 h-full transition-all duration-500 ease-out" :style="{ width: `${progress}%` }"></div>
            </div>
            <p class="text-right text-xs text-gray-500 mt-1">{{ Math.round(progress) }}%</p>
        </div>

        <div class="bg-zinc-800/30 rounded-lg p-3">
            <p class="text-xs text-gray-500 leading-relaxed">
                대기 중 새로고침을 하거나 취소를 하시면<br />
                대기 시간이 늘어날 수 있습니다.
            </p>
        </div>

        <div v-if="errorMessage" class="bg-red-900/20 border border-red-800 p-3 rounded-lg flex items-center gap-2 text-red-400 text-sm text-left">
            <AlertCircle class="w-4 h-4 flex-shrink-0" />
            <span>{{ errorMessage }}</span>
        </div>

        <div class="pt-4">
            <button 
                @click="handleCancel"
                class="text-gray-500 hover:text-white text-sm underline underline-offset-4 transition-colors">
                대기 취소하기
            </button>
        </div>
      </div>
    </div>
  </div>
</template>
