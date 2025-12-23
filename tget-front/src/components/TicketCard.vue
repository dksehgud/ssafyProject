<script setup lang="ts">
import { Calendar, MapPin } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import ImageWithFallback from './figma/ImageWithFallback.vue'
import Card from './ui/Card.vue'

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
   클릭 → 상세 이동
====================== */
const handleClick = () => {
    router.push(`/ticket/${props.performanceId}`)
}
</script>

<template>
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
