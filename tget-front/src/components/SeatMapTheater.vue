<script setup lang="ts">
import { generateTheaterSeats } from '@/utils/seatDataGenerator'

interface Seat {
  id: string
  section: string
  row: number
  number: number
  x: number
  y: number
  price: number
  isBooked: boolean
}

const seats: Seat[] = generateTheaterSeats()
</script>

<template>
  <svg viewBox="0 0 1000 900" class="w-full h-auto">
    <!-- 배경 -->
    <rect width="1000" height="900" fill="#1a1a1a" />

    <!-- 무대 -->
    <rect x="350" y="30" width="300" height="60" fill="#dc2626" rx="5" />
    <text x="500" y="68" text-anchor="middle" fill="white" font-size="24" font-weight="bold">
      무대 (STAGE)
    </text>

    <!-- 좌석 렌더링 -->
    <g id="seats">
      <rect
        v-for="seat in seats"
        :key="seat.id"
        :x="seat.x - 14"
        :y="seat.y - 14"
        width="28"
        height="28"
        fill="#333"
        stroke="#666"
        stroke-width="1"
        rx="3"
      >
        <title>{{ seat.section }} {{ seat.row }}열 {{ seat.number }}번</title>
      </rect>
    </g>

    <!-- 하단 안내 -->
    <text x="500" y="880" text-anchor="middle" fill="#666" font-size="14">
      총 좌석: {{ seats.length }}석
    </text>
  </svg>
</template>
