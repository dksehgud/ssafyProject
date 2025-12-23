<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import TicketCard from './TicketCard.vue'

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
  category: string
  items: TicketData[]
}>()

const scrollContainerRef = ref<HTMLDivElement | null>(null)
const showLeftButton = ref(false)
const showRightButton = ref(true)
const visibleCount = ref(20)

// 보이는 아이템만 렌더링
const visibleItems = computed(() => props.items.slice(0, visibleCount.value))

const checkScroll = () => {
  const container = scrollContainerRef.value
  if (!container) return

  showLeftButton.value = container.scrollLeft > 0
  showRightButton.value =
    container.scrollLeft < container.scrollWidth - container.clientWidth - 10
  
  // 스크롤이 끝에 가까워지면 20개 더 로드
  if (container.scrollLeft > container.scrollWidth - container.clientWidth - 500 && visibleCount.value < props.items.length) {
    visibleCount.value = Math.min(visibleCount.value + 20, props.items.length)
  }
}

const scroll = (direction: "left" | "right") => {
  const container = scrollContainerRef.value
  if (!container) return

  const containerWidth = container.clientWidth
  const scrollAmount = containerWidth - 100

  const newScrollLeft =
    direction === "left"
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount

  container.scrollTo({
    left: newScrollLeft,
    behavior: "smooth",
  })

  setTimeout(checkScroll, 300)
}

onMounted(() => {
  checkScroll()
})
</script>

<template>
  <div class="mb-8 sm:mb-12">
    <h2 class="mb-4 sm:mb-6 text-white text-lg sm:text-xl font-bold">{{ category }}</h2>
    
    <div class="relative group">
      <!-- Left Button -->
      <Transition name="fade">
        <button
          v-if="showLeftButton"
          @click="scroll('left')"
          class="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft class="w-5 h-5 sm:w-8 sm:h-8 text-white" />
        </button>
      </Transition>

      <!-- Right Button -->
      <Transition name="fade">
        <button
          v-if="showRightButton"
          @click="scroll('right')"
          class="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100"
        >
          <ChevronRight class="w-5 h-5 sm:w-8 sm:h-8 text-white" />
        </button>
      </Transition>

      <!-- Scroll Container -->
      <div
        ref="scrollContainerRef"
        @scroll="checkScroll"
        class="flex gap-2 sm:gap-4 overflow-x-auto scrollbar-hide pb-2"
        style="scrollbar-width: none; -ms-overflow-style: none;"
      >
        <div v-for="ticket in visibleItems" :key="ticket.performanceId" class="flex-none w-[280px]">
          <TicketCard
            v-bind="ticket"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
