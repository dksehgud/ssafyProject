<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

interface Props {
  startDate: string
  endDate: string
  selectedDate: Date | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'dateSelect', date: Date): void
}>()

const start = new Date(props.startDate)
const end = new Date(props.endDate)

const currentMonth = ref(new Date(start.getFullYear(), start.getMonth(), 1))

const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  return { daysInMonth, startingDayOfWeek, year, month }
}

const isDateInRange = (date: Date) => {
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const rangeStart = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const rangeEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  
  return checkDate >= rangeStart && checkDate <= rangeEnd
}

const isDateSelected = (date: Date) => {
  if (!props.selectedDate) return false
  return (
    date.getDate() === props.selectedDate.getDate() &&
    date.getMonth() === props.selectedDate.getMonth() &&
    date.getFullYear() === props.selectedDate.getFullYear()
  )
}

const monthData = computed(() => getDaysInMonth(currentMonth.value))

const handlePrevMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1, 1)
}

const handleNextMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1)
}

const canGoPrev = computed(() => {
  const prevMonth = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1, 1)
  return prevMonth >= new Date(start.getFullYear(), start.getMonth(), 1)
})

const canGoNext = computed(() => {
  const nextMonth = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1)
  return nextMonth <= new Date(end.getFullYear(), end.getMonth(), 1)
})

const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]
const dayNames = ["일", "월", "화", "수", "목", "금", "토"]
</script>

<template>
  <div class="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-4">
      <button
        @click="handlePrevMonth"
        :disabled="!canGoPrev"
        class="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800/30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
      >
        <ChevronLeft class="h-4 w-4 text-white" />
      </button>
      
      <h3 class="text-base text-white font-medium">
        {{ monthData.year }}년 {{ monthNames[monthData.month] }}
      </h3>
      
      <button
        @click="handleNextMonth"
        :disabled="!canGoNext"
        class="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800/30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
      >
        <ChevronRight class="h-4 w-4 text-white" />
      </button>
    </div>

    <!-- 요일 -->
    <div class="grid grid-cols-7 gap-1.5 mb-2">
      <div
        v-for="(day, index) in dayNames"
        :key="day"
        class="text-center text-xs py-1.5"
        :class="{
          'text-red-500': index === 0,
          'text-blue-400': index === 6,
          'text-gray-500': index !== 0 && index !== 6
        }"
      >
        {{ day }}
      </div>
    </div>

    <!-- 날짜 -->
    <div class="grid grid-cols-7 gap-1.5">
      <!-- 빈 칸 -->
      <div v-for="index in monthData.startingDayOfWeek" :key="`empty-${index}`" />

      <!-- 날짜 -->
      <button
        v-for="index in monthData.daysInMonth"
        :key="index"
        @click="isDateInRange(new Date(monthData.year, monthData.month, index)) && emit('dateSelect', new Date(monthData.year, monthData.month, index))"
        :disabled="!isDateInRange(new Date(monthData.year, monthData.month, index))"
        class="h-9 w-full rounded-md flex items-center justify-center text-xs transition-all transform active:scale-95 hover:scale-105"
        :class="[
          isDateSelected(new Date(monthData.year, monthData.month, index))
            ? 'bg-red-600 text-white font-bold shadow-md shadow-red-600/50'
            : isDateInRange(new Date(monthData.year, monthData.month, index))
            ? 'bg-gray-800 hover:bg-red-600/20 text-white hover:text-red-400 border border-gray-700 hover:border-red-600'
            : 'bg-gray-900/30 text-gray-700 cursor-not-allowed',
          (new Date(monthData.year, monthData.month, index).getDay() === 0 && isDateInRange(new Date(monthData.year, monthData.month, index)) && !isDateSelected(new Date(monthData.year, monthData.month, index))) ? 'text-red-400' : '',
          (new Date(monthData.year, monthData.month, index).getDay() === 6 && isDateInRange(new Date(monthData.year, monthData.month, index)) && !isDateSelected(new Date(monthData.year, monthData.month, index))) ? 'text-blue-400' : ''
        ]"
      >
        {{ index }}
      </button>
    </div>

    <!-- 범례 -->
    <div class="mt-4 pt-3 border-t border-gray-800 flex items-center justify-center gap-3 text-xs">
      <div class="flex items-center gap-1.5">
        <div class="w-2.5 h-2.5 rounded bg-red-600"></div>
        <span class="text-gray-400">선택됨</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div class="w-2.5 h-2.5 rounded bg-gray-800 border border-gray-700"></div>
        <span class="text-gray-400">예매 가능</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div class="w-2.5 h-2.5 rounded bg-gray-900/30"></div>
        <span class="text-gray-400">예매 불가</span>
      </div>
    </div>
  </div>
</template>
