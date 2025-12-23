<script setup lang="ts">
const seats: { x: number; y: number; section: string }[] = []

// 부채꼴 좌석 계산
const centerX = 500
const centerY = 100

// 1구역 - 앞쪽 부채꼴 (VIP)
for (let row = 0; row < 8; row++) {
  const radius = 200 + row * 40
  const angleStart = -50
  const angleEnd = 50
  const seatsInRow = 12 + row * 2
  const angleStep = (angleEnd - angleStart) / (seatsInRow - 1)
  
  for (let i = 0; i < seatsInRow; i++) {
    const angle = (angleStart + i * angleStep) * Math.PI / 180
    const x = centerX + radius * Math.sin(angle)
    const y = centerY + radius * Math.cos(angle)
    seats.push({ x, y, section: '1' })
  }
}

// 2구역 - 중간 부채꼴
for (let row = 0; row < 10; row++) {
  const radius = 520 + row * 35
  const angleStart = -60
  const angleEnd = 60
  const seatsInRow = 18 + row * 2
  const angleStep = (angleEnd - angleStart) / (seatsInRow - 1)
  
  for (let i = 0; i < seatsInRow; i++) {
    const angle = (angleStart + i * angleStep) * Math.PI / 180
    const x = centerX + radius * Math.sin(angle)
    const y = centerY + radius * Math.cos(angle)
    seats.push({ x, y, section: '2' })
  }
}
</script>

<template>
  <svg viewBox="0 0 1000 850" class="w-full h-auto">
    <!-- 배경 -->
    <rect width="1000" height="850" fill="#1a1a1a" />
    
    <!-- 무대 -->
    <ellipse cx="500" cy="80" rx="180" ry="50" fill="#dc2626" />
    <text x="500" y="90" text-anchor="middle" fill="white" font-size="24" font-weight="bold">
      무대 (STAGE)
    </text>

    <!-- 1구역 VIP 라벨 -->
    <text x="500" y="250" text-anchor="middle" fill="#fbbf24" font-size="18" font-weight="bold">
      1구역 VIP
    </text>

    <!-- 2구역 라벨 -->
    <text x="500" y="600" text-anchor="middle" fill="#999" font-size="18" font-weight="bold">
      2구역
    </text>

    <!-- 좌석 렌더링 -->
    <circle
      v-for="(seat, index) in seats"
      :key="`seat-${index}`"
      :cx="seat.x"
      :cy="seat.y"
      r="10"
      :fill="seat.section === '1' ? '#422006' : '#333'"
      :stroke="seat.section === '1' ? '#fbbf24' : '#666'"
      :stroke-width="seat.section === '1' ? '2' : '1'"
    />

    <!-- 하단 안내 -->
    <text x="500" y="830" text-anchor="middle" fill="#666" font-size="14">
      총 좌석: 376석 | VIP 124석 / 일반 252석
    </text>
  </svg>
</template>
