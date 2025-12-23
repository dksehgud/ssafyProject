<script setup lang="ts">
import { onMounted } from 'vue'

const emit = defineEmits<{
  (e: 'complete'): void
}>()

onMounted(() => {
  setTimeout(() => {
    emit('complete')
  }, 2500)
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black">
    <div class="flex flex-col items-center gap-4 animate-fade-in">
      <div class="text-6xl font-bold text-red-600 animate-scale-in">
        TGet
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.8s ease-out forwards;
}

.animate-scale-in {
  animation: scaleIn 0.5s ease-out 0.3s forwards;
  opacity: 0;
  transform: scale(0.5);
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(3); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}
</style>
