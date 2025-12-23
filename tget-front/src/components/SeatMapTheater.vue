<template>
  <svg viewBox="0 0 1000 900" class="w-full h-auto">
    <!-- 배경 -->
    <rect width="1000" height="900" fill="#1a1a1a" />
    
    <!-- 무대 -->
    <path
      d="M 200 80 Q 500 120 800 80"
      fill="#dc2626"
      stroke="#dc2626"
      stroke-width="40"
    />
    <text x="500" y="95" text-anchor="middle" fill="white" font-size="24" font-weight="bold">
      무대 (STAGE)
    </text>

    <!-- 1층 1구역 (왼쪽) - 8x12 = 96개 -->
    <g id="section1">
      <text x="180" y="180" fill="#999" font-size="16" font-weight="bold">1층 1구역</text>
      <template v-for="row in 12" :key="`1-row-${row}`">
        <template v-for="col in 8" :key="`1-${row}-${col}`">
          <rect
            :x="100 + (col - 1) * 32"
            :y="200 + (row - 1) * 32"
            width="26"
            height="26"
            fill="#333"
            stroke="#666"
            stroke-width="1"
            rx="3"
          />
        </template>
      </template>
    </g>

    <!-- 1층 2구역 (중앙) - 10x15 = 150개 VIP -->
    <g id="section2">
      <text x="500" y="180" fill="#fbbf24" font-size="16" font-weight="bold">1층 2구역 VIP</text>
      <template v-for="row in 15" :key="`2-row-${row}`">
        <template v-for="col in 10" :key="`2-${row}-${col}`">
          <rect
            :x="340 + (col - 1) * 32"
            :y="200 + (row - 1) * 32"
            width="26"
            height="26"
            fill="#422006"
            stroke="#fbbf24"
            stroke-width="2"
            rx="3"
          />
        </template>
      </template>
    </g>

    <!-- 1층 3구역 (오른쪽) - 8x12 = 96개 -->
    <g id="section3">
      <text x="740" y="180" fill="#999" font-size="16" font-weight="bold">1층 3구역</text>
      <template v-for="row in 12" :key="`3-row-${row}`">
        <template v-for="col in 8" :key="`3-${row}-${col}`">
          <rect
            :x="680 + (col - 1) * 32"
            :y="200 + (row - 1) * 32"
            width="26"
            height="26"
            fill="#333"
            stroke="#666"
            stroke-width="1"
            rx="3"
          />
        </template>
      </template>
    </g>

    <!-- 2층 4구역 (왼쪽 발코니) - 6x8 = 48개 -->
    <g id="section4">
      <text x="180" y="620" fill="#999" font-size="16" font-weight="bold">2층 4구역</text>
      <template v-for="row in 8" :key="`4-row-${row}`">
        <template v-for="col in 6" :key="`4-${row}-${col}`">
          <rect
            :x="120 + (col - 1) * 32"
            :y="640 + (row - 1) * 32"
            width="26"
            height="26"
            fill="#333"
            stroke="#666"
            stroke-width="1"
            rx="3"
          />
        </template>
      </template>
    </g>

    <!-- 2층 5구역 (중앙 발코니) - 10x10 = 100개 -->
    <g id="section5">
      <text x="500" y="620" fill="#999" font-size="16" font-weight="bold">2층 5구역</text>
      <template v-for="row in 10" :key="`5-row-${row}`">
        <template v-for="col in 10" :key="`5-${row}-${col}`">
          <rect
            :x="340 + (col - 1) * 32"
            :y="640 + (row - 1) * 32"
            width="26"
            height="26"
            fill="#333"
            stroke="#666"
            stroke-width="1"
            rx="3"
          />
        </template>
      </template>
    </g>

    <!-- 2층 6구역 (오른쪽 발코니) - 6x8 = 48개 -->
    <g id="section6">
      <text x="740" y="620" fill="#999" font-size="16" font-weight="bold">2층 6구역</text>
      <template v-for="row in 8" :key="`6-row-${row}`">
        <template v-for="col in 6" :key="`6-${row}-${col}`">
          <rect
            :x="700 + (col - 1) * 32"
            :y="640 + (row - 1) * 32"
            width="26"
            height="26"
            fill="#333"
            stroke="#666"
            stroke-width="1"
            rx="3"
          />
        </template>
      </template>
    </g>

    <!-- 1층과 2층 구분선 -->
    <line x1="50" y1="600" x2="950" y2="600" stroke="#444" stroke-width="2" stroke-dasharray="10,5" />
    <text x="30" y="400" fill="#666" font-size="14">1층</text>
    <text x="30" y="750" fill="#666" font-size="14">2층</text>

    <!-- 하단 안내 -->
    <text x="500" y="880" text-anchor="middle" fill="#666" font-size="14">
      총 좌석: 538석 | VIP 150석 / 일반 388석
    </text>
  </svg>
</template>
