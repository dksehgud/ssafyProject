<script setup lang="ts">
import { ref } from 'vue'
import { Calendar, MapPin } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import ImageWithFallback from './figma/ImageWithFallback.vue'
import Card from './ui/Card.vue'
import LoadingModal from './LoadingModal.vue'
import { calculateQueueDuration } from '@/constants/timing.ts'
import { ticketService } from '@/api/ticketService'

interface Props {
  performanceId: string
  title: string
  facilityName: string
  dateStart: string
  dateEnd: string
  ticketPrice: string
  poster: string
  category: string
}

const props = defineProps<Props>()
const router = useRouter()

/* ======================
   Queue 상태
====================== */
const showQueue = ref(false)
const queueNumber = ref(Math.floor(Math.random() * 100) + 1)
let queueTimer: number | null = null


// 취소 핸들러 추가
const handleCancelQueue = () => {
  // 타이머 제거
  if (queueTimer !== null) {
    clearTimeout(queueTimer)
    queueTimer = null
  }
  showQueue.value = false
  queueNumber.value = 0
}
/* ======================
   날짜 포맷
====================== */
const formatDate = (start: string, end: string) => {
  const s = new Date(start)
  const e = new Date(end)

  const f = (d: Date) =>
    `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
      d.getDate(),
    ).padStart(2, '0')}`

  return start === end ? f(s) : `${f(s)} ~ ${f(e)}`
}

/* ======================
   클릭 → 큐 → 이동
====================== */
const handleClick = async () => {
  if (showQueue.value) return

  try {
    const data = await ticketService.getQueueInfo(props.performanceId)
    const waitingCount = data.queueNumber ?? 0
    queueNumber.value = waitingCount

    // 대기자 없으면 바로 이동
    if (waitingCount === 0) {
      router.push(`/ticket/${props.performanceId}`)
      return
    }

    showQueue.value = true
    const duration = calculateQueueDuration(waitingCount)

    // 기존 타이머가 있다면 제거
    if (queueTimer !== null) {
      clearTimeout(queueTimer)
    }

    queueTimer = window.setTimeout(() => {
      showQueue.value = false
      router.push(`/ticket/${props.performanceId}`)
      queueTimer = null
    }, duration)
  } catch (e) {
    router.push(`/ticket/${props.performanceId}`)
  }
}
</script>

<template>
  <!-- Queue Loading Modal -->
  <Transition name="fade">
    <LoadingModal
      v-if="showQueue"
      :queueNumber="queueNumber"
      @close="handleCancelQueue"
    />
  </Transition>

  <!-- Ticket Card -->
  <div
    class="h-full relative transition-transform duration-300 ease-out
           hover:scale-105 hover:-translate-y-2 cursor-pointer"
    @click.stop.prevent="handleClick"
  >
    <Card
      class="overflow-hidden bg-zinc-900 border-zinc-800
             group h-[280px] sm:h-[320px] relative
             pointer-events-none"
    >
      <!-- Background Image -->
      <ImageWithFallback
        :src="poster"
        :alt="title"
        loading="lazy"
        class="absolute inset-0 w-full h-full object-cover
               transition-transform duration-500 group-hover:scale-110"
      />

      <!-- Gradient Overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />

      <!-- Content -->
      <div class="relative h-full flex flex-col justify-end p-3 sm:p-6">
        <div class="space-y-2 sm:space-y-3">
          <h3 class="text-white text-sm sm:text-base line-clamp-2">
            {{ title }}
          </h3>

          <div class="space-y-1 sm:space-y-2 text-gray-200 text-xs sm:text-sm">
            <div class="flex items-center gap-1 sm:gap-2">
              <MapPin class="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span class="truncate">{{ facilityName }}</span>
            </div>

            <div class="flex items-center gap-1 sm:gap-2">
              <Calendar class="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span class="truncate">
                {{ formatDate(dateStart, dateEnd) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
