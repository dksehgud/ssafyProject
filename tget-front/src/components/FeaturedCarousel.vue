<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Card from './ui/Card.vue'
import CardContent from './ui/CardContent.vue'
import Button from './ui/Button.vue'
import { Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import ImageWithFallback from './figma/ImageWithFallback.vue'

interface TicketData {
  performanceId: string
  title: string
  facilityName: string
  dateStart: string
  dateEnd: string
  ticketPrice: string
  poster: string
  category: string
}

const props = defineProps<{
  items: TicketData[]
}>()

const router = useRouter()
const currentIndex = ref(0)

const getPrevIndex = () => {
  return currentIndex.value === 0 ? props.items.length - 1 : currentIndex.value - 1
}

const getNextIndex = () => {
  return currentIndex.value === props.items.length - 1 ? 0 : currentIndex.value + 1
}

const handlePrev = () => {
  currentIndex.value = getPrevIndex()
}

const handleNext = () => {
  currentIndex.value = getNextIndex()
}

const prevItem = computed(() => props.items[getPrevIndex()])
const currentItem = computed(() => props.items[currentIndex.value])
const nextItem = computed(() => props.items[getNextIndex()])

const formatDate = (start: string, end: string) => {
  const startDate = new Date(start)
  const endDate = new Date(end)

  const formatDateStr = (date: Date) => {
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  }

  if (start === end) {
    return formatDateStr(startDate)
  }

  return `${formatDateStr(startDate)} ~ ${formatDateStr(endDate)}`
}

const navigateToDetail = (id: string) => {
    router.push(`/ticket/${id}`)
}
</script>

<template>
  <div class="relative w-full mb-16">
    
    <div class="flex items-center gap-4">
      <!-- Left Card + Arrow -->
      <div class="relative w-[20%]">
        <button
          @click="handlePrev"
          class="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center transition-all backdrop-blur-sm"
        >
          <ChevronLeft class="w-8 h-8 text-white" />
        </button>
        <div
          class="h-[500px] cursor-pointer hover:opacity-60 transition-opacity opacity-40"
          @click="handlePrev"
        >
          <Card class="overflow-hidden bg-zinc-900 border-zinc-800 h-full">
            <div class="relative h-full">
              <ImageWithFallback
                :src="prevItem.poster"
                :alt="prevItem.title"
                class="w-full h-full object-cover"
              />
              <div class="absolute inset-0 bg-black/50" />
            </div>
          </Card>
        </div>
      </div>

      <!-- Center Main Card -->
      <div class="w-[60%]">
        <Transition name="fade" mode="out-in">
          <div :key="currentItem.performanceId" class="h-[500px]">
            <Card
              class="overflow-hidden bg-zinc-900 border-zinc-800 h-full group cursor-pointer flex flex-col hover:scale-105 transition-transform duration-300"
              @click="navigateToDetail(currentItem.performanceId)"
            >
              <div class="relative h-[55%] overflow-hidden">
                <ImageWithFallback
                  :src="currentItem.poster"
                  :alt="currentItem.title"
                  class="w-full h-full object-cover"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
              </div>
              <CardContent class="pt-6 flex-1 flex flex-col justify-between pb-6">
                <div>
                  <h2 class="mb-3 text-white text-2xl font-bold">{{ currentItem.title }}</h2>
                  <div class="space-y-2 text-gray-400 text-sm">
                    <div class="flex items-center gap-2">
                      <MapPin class="h-4 w-4" />
                      <span>{{ currentItem.facilityName }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <Calendar class="h-4 w-4" />
                      <span>{{ formatDate(currentItem.dateStart, currentItem.dateEnd) }}</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center justify-between mt-4">
                  <div>
                    <div class="text-sm text-gray-500">시작가</div>
                    <div class="text-red-600 text-lg font-bold">{{ currentItem.ticketPrice }}</div>
                  </div>
                  <Button
                    class="bg-red-600 hover:bg-red-700 text-white"
                    @click.stop="navigateToDetail(currentItem.performanceId)"
                  >
                    예매하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </Transition>
      </div>

      <!-- Right Card + Arrow -->
      <div class="relative w-[20%]">
        <button
          @click="handleNext"
          class="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center transition-all backdrop-blur-sm"
        >
          <ChevronRight class="w-8 h-8 text-white" />
        </button>
        <div
          class="h-[500px] cursor-pointer hover:opacity-60 transition-opacity opacity-40"
          @click="handleNext"
        >
          <Card class="overflow-hidden bg-zinc-900 border-zinc-800 h-full">
            <div class="relative h-full">
              <ImageWithFallback
                :src="nextItem.poster"
                :alt="nextItem.title"
                class="w-full h-full object-cover"
              />
              <div class="absolute inset-0 bg-black/50" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
