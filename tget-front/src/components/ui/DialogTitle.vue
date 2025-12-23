<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { DialogTitle, type DialogTitleProps, useForwardProps } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<DialogTitleProps & { class?: HTMLAttributes['class'] }>()

const forwardedProps = useForwardProps(props)

const computedClass = computed(() => {
  return cn('text-lg font-semibold leading-none tracking-tight', props.class)
})
</script>

<template>
  <DialogTitle v-bind="forwardedProps" :class="computedClass">
    <slot />
  </DialogTitle>
</template>
