<template>
  <svg viewBox="0 0 1000 700" class="w-full h-auto">
    <!-- 배경 -->
    <rect width="1000" height="700" fill="#1a1a1a" />

    <!-- 무대 -->
    <rect x="350" y="30" width="300" height="60" fill="#dc2626" rx="5" />
    <text x="500" y="68" text-anchor="middle" fill="white" font-size="24" font-weight="bold">
      무대 (STAGE)
    </text>

    <!-- 1구역 (왼쪽) - 10x5 = 50개 -->
    <g id="section1">
      <text x="150" y="140" fill="#999" font-size="16" font-weight="bold">1구역</text>
      <template v-for="row in 10" :key="`1-row-${row}`">
        <template v-for="col in 5" :key="`1-${row}-${col}`">
          <rect
            :x="80 + (col - 1) * 35"
            :y="160 + (row - 1) * 35"
            width="28"
            height="28"
            fill="#333"
            stroke="#666"
            stroke-width="1"
            rx="3"
          />
        </template>
      </template>
    </g>

    <!-- 2구역 (중앙 왼쪽) - 10x5 = 50개 -->
    <g id="section2">
      <text x="380" y="140" fill="#999" font-size="16" font-weight="bold">2구역</text>
      <template v-for="row in 10" :key="`2-row-${row}`">
        <template v-for="col in 5" :key="`2-${row}-${col}`">
          <rect
            :x="280 + (col - 1) * 35"
            :y="160 + (row - 1) * 35"
            width="28"
            height="28"
            fill="#333"
            stroke="#666"
            stroke-width="1"
            rx="3"
          />
        </template>
      </template>
    </g>

    <!-- 3구역 (중앙) - 10x5 = 50개 -->
    <g id="section3">
      <text x="620" y="140" fill="#999" font-size="16" font-weight="bold">3구역</text>
      <template v-for="row in 10" :key="`3-row-${row}`">
        <template v-for="col in 5" :key="`3-${row}-${col}`">
          <rect
            :x="520 + (col - 1) * 35"
            :y="160 + (row - 1) * 35"
            width="28"
            height="28"
            fill="#333"
            stroke="#666"
            stroke-width="1"
            rx="3"
          />
        </template>
      </template>
    </g>

    <!-- 4구역 (오른쪽) - 10x5 = 50개 -->
    <g id="section4">
      <text x="840" y="140" fill="#999" font-size="16" font-weight="bold">4구역</text>
      <template v-for="row in 10" :key="`4-row-${row}`">
        <template v-for="col in 5" :key="`4-${row}-${col}`">
          <rect
            :x="740 + (col - 1) * 35"
            :y="160 + (row - 1) * 35"
            width="28"
            height="28"
            fill="#333"
            stroke="#666"
            stroke-width="1"
            rx="3"
          />
        </template>
      </template>
    </g>

    <!-- 5구역 (하단) - 10x5 = 50개 -->
    <g id="section5">
      <text x="500" y="530" fill="#999" font-size="16" font-weight="bold">5구역</text>
      <template v-for="row in 10" :key="`5-row-${row}`">
        <template v-for="col in 5" :key="`5-${row}-${col}`">
          <rect
            :x="420 + (col - 1) * 35"
            :y="550 + (row - 1) * 35"
            width="28"
            height="28"
            fill="#333"
            stroke="#666"
            stroke-width="1"
            rx="3"
          />
        </template>
      </template>
    </g>

    <!-- 하단 안내 -->
    <text x="500" y="680" text-anchor="middle" fill="#666" font-size="14">
      총 좌석: 250석
    </text>
  </svg>
</template>
