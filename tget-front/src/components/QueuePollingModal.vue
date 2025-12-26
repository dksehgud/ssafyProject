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
let simulationTimer: number | null = null

// 진행률 계산 (단순 시각적 효과) - 실제로는 대기 순번 감소 비율로 해야 정확함
const updateProgress = (currentPos: number, initialPos: number) => {
    if (initialPos <= 0) return 100
    const percent = Math.max(0, Math.min(100, ((initialPos - currentPos) / initialPos) * 100))
    // 시뮬레이션 모드에서는 99%까지만 진행 (실제 완료 신호 대기)
    progress.value = Math.min(percent, 99)
}

const initialPos = ref(props.initialWaitingCount || 100)

// 시연용 시뮬레이션 로직
const runSimulation = () => {
    if (waitingCount.value > 1) {
        // 랜덤하게 3~8명씩 줄어들게 설정
        const decrement = Math.floor(Math.random() * 6) + 3
        const nextCount = Math.max(1, waitingCount.value - decrement)
        
        waitingCount.value = nextCount
        
        // 시간도 조금씩 줄이기 (0분 밑으로는 안가게)
        if (estimatedTime.value > 0 && Math.random() > 0.7) {
            estimatedTime.value = Math.max(1, estimatedTime.value - 1)
        }

        updateProgress(nextCount, initialPos.value)
    }
}

const pollStatus = async () => {
  try {
    const data = await queueService.getQueueStatus(props.token, props.performanceId)
    
    if (data.status === 'ACTIVE') {
      // 내 순서 도달!
      progress.value = 100
      if (pollingTimer) clearInterval(pollingTimer)
      if (simulationTimer) clearInterval(simulationTimer)
      // 타임 기반 애니메이션 중지
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      
      // 잠시 성공 화면 보여주고 완료 처리
      setTimeout(() => {
          emit('complete')
      }, 500)
      return
    }

    if (data.status === 'EXPIRED') {
        errorMessage.value = "대기 시간이 만료되었습니다. 다시 시도해주세요."
        if (pollingTimer) clearInterval(pollingTimer)
        if (simulationTimer) clearInterval(simulationTimer)
        if (animationFrameId) cancelAnimationFrame(animationFrameId)
        return
    }

    // 대기 인원 및 시간 업데이트 (화면 표시용)
    waitingCount.value = data.positionInQueue
    estimatedTime.value = data.estimatedWaitTime

    // 프로그레스바는 시간 기반으로 별도 작동하므로 여기서는 업데이트 안 함

  } catch (error) {
    console.error('Queue polling error:', error)
  }
}

// 5초 동안 0% -> 99% 차오르는 애니메이션
let animationFrameId: number | null = null
const startTime = Date.now()
const DURATION = 5000 // 5초

const animateProgress = () => {
    const elapsed = Date.now() - startTime
    const percent = Math.min((elapsed / DURATION) * 100, 99)
    progress.value = percent
    
    if (percent < 99) {
        animationFrameId = requestAnimationFrame(animateProgress)
    }
}

onMounted(() => {
  // 즉시 한 번 조회
  pollStatus()
  // 1초마다 폴링
  pollingTimer = window.setInterval(pollStatus, 1000)
  
  // 시연용 시뮬레이션 (대기 인원 줄어드는 효과) 유지
  simulationTimer = window.setInterval(runSimulation, 800)
  
  // 5초 프로그레스바 애니메이션 시작
  animateProgress()
})

onUnmounted(() => {
  if (pollingTimer) clearInterval(pollingTimer)
  if (simulationTimer) clearInterval(simulationTimer)
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
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
