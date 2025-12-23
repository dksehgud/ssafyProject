<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { Motion } from "@motionone/vue";
import { Loader2, X } from "lucide-vue-next";
import { calculateQueueDuration } from "@/constants/timing.ts";

interface Props {
  queueNumber: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "close"): void;
}>();

const progress = ref(0);
let interval: number | undefined;

onMounted(() => {
  const duration = calculateQueueDuration(props.queueNumber);

  if (duration === 0) {
    progress.value = 100;
    return;
  }

  const steps = 100;
  const intervalTime = duration / steps;

  interval = window.setInterval(() => {
    if (progress.value >= 100) {
      progress.value = 100;
      clearInterval(interval);
      return;
    }
    progress.value += 100 / steps;
  }, intervalTime);
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});

const handleClose = () => {
  if (interval) clearInterval(interval);
  emit("close");
};
</script>

<template>
  <!-- 배경 -->
  <Motion
    :initial="{ opacity: 0 }"
    :animate="{ opacity: 1 }"
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md"
  >
    <!-- 카드 -->
    <Motion
      :initial="{ scale: 0.9, opacity: 0, y: 20 }"
      :animate="{ scale: 1, opacity: 1, y: 0 }"
      :transition="{ duration: 0.4, easing: 'ease-out' }"
      class="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-10 max-w-md w-full mx-4"
    >
      <!-- ❌ 닫기 버튼 -->
      <button
        class="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        @click.stop="handleClose"
        aria-label="닫기"
      >
        <X class="w-5 h-5" />
      </button>

      <div class="text-center space-y-6">
        <!-- 로딩 스피너 (CSS 방식 권장) -->
        <div class="flex justify-center">
          <Loader2 class="h-16 w-16 text-red-600 animate-spin" />
        </div>

        <!-- 대기열 정보 -->
        <div class="space-y-4">
          <h2 class="text-2xl text-white">예매 페이지로 이동 중입니다</h2>

          <div class="space-y-2">
            <p class="text-gray-400">대기 순번</p>
            <div class="flex items-center justify-center gap-2">
              <span class="text-4xl text-red-600">{{ queueNumber }}</span>
              <span class="text-xl text-gray-300">번째</span>
            </div>
          </div>

          <!-- 프로그레스 바 -->
          <div class="space-y-2">
            <div class="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all"
                :style="{ width: progress + '%' }"
              />
            </div>
            <p class="text-gray-500 text-sm">{{ Math.floor(progress) }}%</p>
          </div>

          <p class="text-gray-500 text-sm">잠시만 기다려주세요...</p>

          <!-- 점 애니메이션 -->
          <div class="flex justify-center gap-2">
            <span class="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
            <span class="w-2 h-2 bg-red-600 rounded-full animate-pulse delay-150" />
            <span class="w-2 h-2 bg-red-600 rounded-full animate-pulse delay-300" />
          </div>
        </div>
      </div>
    </Motion>
  </Motion>
</template>
