<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { Separator, type SeparatorProps } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<SeparatorProps & { class?: HTMLAttributes['class'] }>()

const computedClass = computed(() => {
  return cn(
    'shrink-0 bg-border',
    props.orientation === 'vertical' ? 'h-full w-[1px]' : 'h-[1px] w-full',
    props.class,
  )
})
</script>

<template>
  <Separator v-bind="props" :class="computedClass" />
</template>
