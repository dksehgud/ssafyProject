<template>
  <div
    class="marker-root"
    @mouseenter="onHover"
    @mouseleave="onLeave"
  >
    <div class="marker-wrapper">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="marker-svg"
      >
        <!-- 외곽 테두리 -->
        <path
          d="M16 2L28 10V22L16 30L4 22V10L16 2Z"
          fill="#dc2626"
          stroke="#991b1b"
          stroke-width="1.5"
        />

        <!-- 내부 티켓 아이콘 -->
        <rect x="11" y="11" width="10" height="7" rx="0.8" fill="white" opacity="0.9" />
        <line
          x1="11"
          y1="14.5"
          x2="21"
          y2="14.5"
          stroke="#dc2626"
          stroke-width="0.4"
          stroke-dasharray="0.8 0.8"
        />
        <rect x="12.5" y="12.5" width="2" height="1.2" fill="#dc2626" opacity="0.7" />
        <rect x="12.5" y="16" width="5" height="0.8" fill="#dc2626" opacity="0.5" />

        <!-- 펄스 효과 -->
        <circle cx="16" cy="16" r="20" fill="#dc2626" opacity="0.18">
          <animate attributeName="r" from="12" to="32" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.45" to="0" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>

      <!-- 공연 개수 뱃지 -->
      <div class="count-badge">
        {{ performanceCount }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
  performanceCount: number
}

const props = defineProps<Props>()

const isHovered = ref(false)

const onHover = () => {
  isHovered.value = true
}

const onLeave = () => {
  isHovered.value = false
}

onMounted(() => {
  console.log('✅ VenueMarker 마운트됨, 공연 개수:', props.performanceCount)
})
</script>

<style scoped>
.marker-root {
  cursor: pointer;
  position: relative;
  display: inline-block;
  transition: all 0.2s ease-out;
}

.marker-root:hover {
  transform: scale(1.15);
  z-index: 1000;
}

.marker-wrapper {
  position: relative;
  width: 32px;
  height: 38px;
  pointer-events: none; /* 마커 자체는 마우스 이벤트 무시 */
}

.marker-svg {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  pointer-events: none;
}

/* 공연 개수 뱃지 */
.count-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: linear-gradient(135deg, #dc2626, #991b1b);
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: bold;
  border: 1.5px solid #1a1a1a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}
</style>

