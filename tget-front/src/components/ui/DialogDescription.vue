<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { DialogDescription, type DialogDescriptionProps, useForwardProps } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<DialogDescriptionProps & { class?: HTMLAttributes['class'] }>()

const forwardedProps = useForwardProps(props)

const computedClass = computed(() => {
  return cn('text-sm text-muted-foreground', props.class)
})
</script>

<template>
  <DialogDescription v-bind="forwardedProps" :class="computedClass">
    <slot />
  </DialogDescription>
</template>
