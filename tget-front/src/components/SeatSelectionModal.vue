<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { X, Check, MapPin } from 'lucide-vue-next'
import Button from './ui/Button.vue'
import Separator from './ui/Separator.vue'
import { toast } from 'vue-sonner'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import SeatMapStandard from './SeatMapStandard.vue'
import SeatMapFan from './SeatMapFan.vue'
import SeatMapTheater from './SeatMapTheater.vue'
import { generateStandardSeats, generateFanSeats, generateTheaterSeats, type Seat } from '@/utils/seatDataGenerator'

interface Props {
  isOpen: boolean
  ticketTitle: string
  ticketDate: string
  ticketLocation: string
  ticketPrice: string
  ticketCategory: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
}>()

const selectedSeats = ref<Seat[]>([])
const selectedDate = ref<Date>(new Date())
const allSeats = ref<Seat[]>([])

// 날짜별 예매 상태를 시뮬레이션
const getBookedSeatsForDate = (date: Date, seatType: string): string[] => {
  const dateKey = format(date, "yyyy-MM-dd")
  const today = format(new Date(), "yyyy-MM-dd")
  const tomorrow = format(new Date(Date.now() + 86400000), "yyyy-MM-dd")
  const dayAfter = format(new Date(Date.now() + 172800000), "yyyy-MM-dd")

  const bookedSeatsData: Record<string, Record<string, string[]>> = {
    standard: {
      [today]: ["1-1-1", "1-2-2", "2-3-3", "3-5-5", "3-6-6", "4-4-4", "5-1-1"],
      [tomorrow]: ["1-1-2", "2-1-1", "3-1-1", "3-2-2", "4-1-1", "5-2-2"],
      [dayAfter]: ["1-3-1", "2-4-2", "3-7-3", "4-5-4", "5-3-1"],
    },
    fan: {
      [today]: ["1-1-1", "1-1-6", "1-2-7", "1-3-8", "2-4-10", "2-5-12", "2-6-14"],
      [tomorrow]: ["1-1-2", "1-2-5", "2-1-1", "2-2-9", "2-3-11"],
      [dayAfter]: ["1-4-5", "1-5-8", "2-6-15", "2-7-18"],
    },
    theater: {
      [today]: ["1-1-1", "1-2-3", "2-5-5", "2-7-7", "3-3-3", "4-2-2", "5-5-5", "6-1-1"],
      [tomorrow]: ["1-1-2", "2-1-1", "2-2-2", "3-1-1", "5-1-1", "6-2-2"],
      [dayAfter]: ["1-5-3", "2-10-5", "3-6-4", "4-4-3", "5-7-6"],
    },
  }

  return bookedSeatsData[seatType]?.[dateKey] || []
}

const seatType = computed(() => 
  props.ticketCategory === "콘서트" ? "fan" : props.ticketCategory === "뮤지컬" ? "theater" : "standard"
)

const viewBoxSize = computed(() => 
  seatType.value === "fan" ? "0 0 1000 850" : seatType.value === "theater" ? "0 0 1000 900" : "0 0 1000 700"
)

const loadSeats = () => {
  let baseSeats: Seat[] = []
  if (seatType.value === "fan") {
    baseSeats = generateFanSeats()
  } else if (seatType.value === "theater") {
    baseSeats = generateTheaterSeats()
  } else {
    baseSeats = generateStandardSeats()
  }

  const bookedSeatIds = getBookedSeatsForDate(selectedDate.value, seatType.value)
  allSeats.value = baseSeats.map((seat) => ({
    ...seat,
    isBooked: bookedSeatIds.includes(seat.id),
  }))
}

watch([seatType, selectedDate], loadSeats)
onMounted(loadSeats)

const findSeatByCoordinate = (clickX: number, clickY: number): Seat | null => {
  const CLICK_THRESHOLD = 20
  let closestSeat: Seat | null = null
  let minDistance = CLICK_THRESHOLD

  for (const seat of allSeats.value) {
    const distance = Math.sqrt(Math.pow(seat.x - clickX, 2) + Math.pow(seat.y - clickY, 2))
    if (distance < minDistance) {
      minDistance = distance
      closestSeat = seat
    }
  }
  return closestSeat
}

const handleSeatClick = (e: MouseEvent) => {
  const target = e.currentTarget as HTMLDivElement
  const rect = target.getBoundingClientRect()
  const scaleX = 1000 / rect.width
  const scaleY = (seatType.value === "fan" ? 850 : seatType.value === "theater" ? 900 : 700) / rect.height

  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY

  const clickedSeat = findSeatByCoordinate(x, y)

  if (!clickedSeat) return

  if (clickedSeat.isBooked) {
    toast.error(`이미 예매된 좌석입니다 (${clickedSeat.section} ${clickedSeat.row}열 ${clickedSeat.number}번)`)
    return
  }

  const alreadySelected = selectedSeats.value.some((seat) => seat.id === clickedSeat.id)
  if (alreadySelected) {
    handleRemoveSeat(clickedSeat.id)
    return
  }

  if (selectedSeats.value.length >= 4) {
    toast.error("최대 4개의 좌석까지 선택 가능합니다")
    return
  }

  selectedSeats.value.push(clickedSeat)
  toast.success(`${clickedSeat.section} ${clickedSeat.row}열 ${clickedSeat.number}번 좌석이 선택되었습니다`)
}

const handleRemoveSeat = (seatId: string) => {
  const seat = selectedSeats.value.find((s) => s.id === seatId)
  selectedSeats.value = selectedSeats.value.filter((s) => s.id !== seatId)
  if (seat) {
    toast.info(`${seat.section} ${seat.row}열 ${seat.number}번 좌석 선택이 취소되었습니다`)
  }
}

const handleClearAllSeats = () => {
  if (selectedSeats.value.length === 0) return
  selectedSeats.value = []
  toast.info(`모든 좌석 선택이 취소되었습니다`)
}

const handleConfirmBooking = () => {
  if (selectedSeats.value.length === 0) {
    toast.error("좌석을 선택해주세요")
    return
  }

  toast.success(`${selectedSeats.value.length}개의 좌석이 예매되었습니다!`, {
    description: "예매 내역은 마이페이지에서 확인하실 수 있습니다.",
  })

  setTimeout(() => {
    emit('close')
    selectedSeats.value = []
  }, 1500)
}

const totalPrice = computed(() => selectedSeats.value.reduce((acc, seat) => acc + seat.price, 0))
</script>

<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- 오버레이 -->
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm" @click="emit('close')" />

      <!-- 모달 -->
      <div class="relative bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <!-- 헤더 -->
        <div class="bg-gradient-to-r from-red-900/30 to-black border-b border-gray-800 p-6 shrink-0">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h2 class="text-3xl text-white mb-2">{{ ticketTitle }}</h2>
              <div class="flex flex-wrap gap-3 text-sm text-gray-400">
                <div class="flex items-center gap-1">
                  <MapPin class="h-4 w-4 text-red-500" />
                  {{ ticketLocation }}
                </div>
              </div>
            </div>
            <button
              @click="emit('close')"
              class="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
            >
              <X class="h-5 w-5 text-white" />
            </button>
          </div>

          <!-- 범례 -->
          <div class="flex gap-4">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-green-500 rounded-full"></div>
              <span class="text-sm text-gray-400">예매완료</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span class="text-sm text-gray-400">선택</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 border-2 border-gray-600 rounded-full"></div>
              <span class="text-sm text-gray-400">선택가능</span>
            </div>
          </div>
        </div>

        <!-- 본문 -->
        <div class="p-8 overflow-y-auto flex-1">
          <div class="grid lg:grid-cols-3 gap-8 h-full">
            <!-- 좌석 맵 -->
            <div class="lg:col-span-2 flex flex-col">
              <div class="relative bg-gray-800/50 rounded-xl p-6 border border-gray-700 flex-1 flex items-center justify-center overflow-hidden">
                <div class="relative cursor-crosshair select-none w-full" @click="handleSeatClick">
                  <SeatMapFan v-if="seatType === 'fan'" />
                  <SeatMapTheater v-else-if="seatType === 'theater'" />
                  <SeatMapStandard v-else />

                  <!-- 예매된 좌석과 선택한 좌석 표시 -->
                  <svg class="absolute inset-0 w-full h-full pointer-events-none" :viewBox="viewBoxSize">
                    <circle
                      v-for="seat in allSeats.filter(s => s.isBooked)"
                      :key="`booked-${seat.id}`"
                      :cx="seat.x"
                      :cy="seat.y"
                      :r="seatType === 'fan' ? 8 : 10"
                      fill="#22c55e"
                      stroke="#86efac"
                      stroke-width="2"
                      opacity="0.9"
                    >
                      <title>예매완료: {{ seat.section }} {{ seat.row }}열 {{ seat.number }}번</title>
                    </circle>

                    <circle
                      v-for="seat in selectedSeats"
                      :key="`selected-${seat.id}`"
                      :cx="seat.x"
                      :cy="seat.y"
                      :r="seatType === 'fan' ? 8 : 10"
                      fill="#3b82f6"
                      stroke="#93c5fd"
                      stroke-width="2"
                      class="animate-pulse cursor-pointer pointer-events-auto"
                      @click.stop="handleRemoveSeat(seat.id)"
                    >
                      <title>{{ seat.section }} {{ seat.row }}열 {{ seat.number }}번 (클릭하여 취소)</title>
                    </circle>
                  </svg>
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-4 text-center shrink-0">
                좌석을 클릭하여 선택하세요 (최대 4개) | 선택한 좌석을 다시 클릭하면 취소됩니다
              </p>
            </div>

            <!-- 예매 정보 -->
            <div class="space-y-4 flex flex-col">
              <div class="bg-gray-800/50 rounded-xl p-5 border border-gray-700 flex-1 flex flex-col">
                <div class="flex items-center justify-between mb-4 shrink-0">
                  <h3 class="text-xl text-white">선택한 좌석</h3>
                  <button
                    v-if="selectedSeats.length > 0"
                    @click="handleClearAllSeats"
                    class="text-sm text-gray-400 hover:text-red-500 transition-colors underline"
                  >
                    전체삭제
                  </button>
                </div>

                <div v-if="selectedSeats.length === 0" class="text-sm text-gray-500 text-center py-8 flex-1 flex items-center justify-center">
                  좌석을 선택해주세요
                </div>
                <div v-else class="space-y-1.5 overflow-y-auto flex-1 pr-2">
                  <div
                    v-for="seat in selectedSeats"
                    :key="seat.id"
                    class="flex items-center justify-between bg-gray-900/50 rounded-lg p-3 group"
                  >
                    <div class="flex flex-col gap-0.5">
                      <div class="flex items-center gap-2">
                        <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span class="text-sm text-gray-300">{{ seat.section }}</span>
                      </div>
                      <span class="text-xs text-gray-500 ml-4">{{ seat.row }}열 {{ seat.number }}번</span>
                    </div>
                    <button
                      @click="handleRemoveSeat(seat.id)"
                      class="text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <Separator class="bg-gray-700 shrink-0" />

              <!-- 가격 정보 -->
              <div class="bg-gray-800/50 rounded-xl p-5 border border-gray-700 space-y-3 shrink-0">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-400">좌석 수</span>
                  <span class="text-white">{{ selectedSeats.length }}개</span>
                </div>
                <div v-if="selectedSeats.length > 0" class="space-y-1 max-h-[100px] overflow-y-auto pr-2">
                  <div
                    v-for="seat in selectedSeats"
                    :key="seat.id"
                    class="flex items-center justify-between text-xs"
                  >
                    <span class="text-gray-500">{{ seat.section }} {{ seat.row }}열 {{ seat.number }}번</span>
                    <span class="text-gray-400">{{ seat.price.toLocaleString() }}원</span>
                  </div>
                </div>
                <Separator class="bg-gray-700" />
                <div class="flex items-center justify-between">
                  <span class="text-white">총 결제 금액</span>
                  <span class="text-3xl text-red-500">{{ totalPrice.toLocaleString() }}원</span>
                </div>
              </div>

              <!-- 예매 버튼 -->
              <Button
                @click="handleConfirmBooking"
                :disabled="selectedSeats.length === 0"
                class="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 h-14 text-lg shrink-0"
              >
                <template v-if="selectedSeats.length === 0">
                  좌석을 선택하세요
                </template>
                <template v-else>
                  <Check class="h-5 w-5 mr-2" />
                  예매하기
                </template>
              </Button>

              <p class="text-xs text-gray-500 text-center shrink-0">
                예매 후 24시간 이내 취소 가능합니다
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
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
