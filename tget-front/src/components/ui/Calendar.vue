<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import {
  CalendarRoot,
  type CalendarRootEmits,
  type CalendarRootProps,
  useForwardPropsEmits,
  CalendarHeader,
  CalendarGrid,
  CalendarGridHead,
  CalendarGridBody,
  CalendarHeadCell,
  CalendarGridRow,
  CalendarCell,
  CalendarCellTrigger,
  CalendarPrev,
  CalendarNext,
} from 'radix-vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<CalendarRootProps & { class?: HTMLAttributes['class'] }>()

const emits = defineEmits<CalendarRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)

const computedClass = computed(() => cn('p-3', props.class))
</script>

<template>
  <CalendarRoot
    v-slot="{ grid, weekDays }"
    :class="computedClass"
    v-bind="forwarded"
  >
    <CalendarHeader class="flex items-center justify-between">
      <CalendarPrev
        class="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-input rounded-md flex items-center justify-center"
      >
        <ChevronLeft class="h-4 w-4" />
      </CalendarPrev>
      <div class="text-sm font-medium">
        {{ grid[0].value.month }}월 {{ grid[0].value.year }}
      </div>
      <CalendarNext
        class="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-input rounded-md flex items-center justify-center"
      >
        <ChevronRight class="h-4 w-4" />
      </CalendarNext>
    </CalendarHeader>

    <div class="flex flex-col space-y-4 mt-4 sm:flex-row sm:gap-x-4 sm:space-y-0">
      <CalendarGrid v-for="month in grid" :key="month.value.toString()">
        <CalendarGridHead>
          <CalendarGridRow>
            <CalendarHeadCell
              v-for="day in weekDays"
              :key="day"
              class="text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]"
            >
              {{ day }}
            </CalendarHeadCell>
          </CalendarGridRow>
        </CalendarGridHead>
        <CalendarGridBody class="grid">
          <CalendarGridRow v-for="(weekDates, index) in month.rows" :key="index" class="flex w-full mt-2">
            <CalendarCell
              v-for="weekDate in weekDates"
              :key="weekDate.toString()"
              :date="weekDate"
            >
              <CalendarCellTrigger
                :day="weekDate"
                :month="month.value"
                class="h-9 w-9 p-0 font-normal aria-selected:opacity-100 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[disabled]:text-muted-foreground data-[disabled]:opacity-50 data-[unavailable]:text-destructive-foreground data-[unavailable]:line-through"
              />
            </CalendarCell>
          </CalendarGridRow>
        </CalendarGridBody>
      </CalendarGrid>
    </div>
  </CalendarRoot>
</template>
