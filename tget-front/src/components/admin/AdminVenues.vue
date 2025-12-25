<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl text-white">공연장 관리</h2>
      <button class="bg-red-600 px-4 py-3 rounded-lg text-white flex gap-2">
        <Plus class="w-5 h-5" /> 공연장 추가
      </button>
    </div>

    <div class="flex gap-4">
      <input
        v-model="searchTerm"
        placeholder="공연장명 또는 주소 검색..."
        class="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
      />
      <select v-model="selectedRegion" class="filter-select">
        <option value="all">전체</option>
        <option v-for="r in regions" :key="r">{{ r }}</option>
      </select>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="(venue, index) in filteredVenues"
        :key="venue.id"
        class="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:border-red-600 transition-all animate-fade-in"
        :style="{ animationDelay: `${index * 50}ms` }"
      >
        <h3 class="text-white text-xl mb-2">{{ venue.name }}</h3>
        <p class="text-gray-400 text-sm mb-1">{{ venue.address }}</p>
        <p class="text-gray-500 text-sm">지역: {{ venue.region }}</p>

        <div class="flex justify-between pt-4 mt-4 border-t border-gray-700">
          <span class="text-gray-400">공연 수</span>
          <span class="text-white">{{ venue.performanceCount }}개</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus } from 'lucide-vue-next'
import { ticketData } from '@/data/ticketData'

interface Venue {
  id: string
  name: string
  address: string
  region: string
  performanceCount: number
}

const venueMap = new Map<string, Venue>()
ticketData.forEach((t, i) => {
  if (!venueMap.has(t.facilityName)) {
    venueMap.set(t.facilityName, {
      id: `v-${i}`,
      name: t.facilityName,
      address: t.area,
      region: t.area.split(' ')[0],
      performanceCount: 1,
    })
  } else {
    venueMap.get(t.facilityName)!.performanceCount++
  }
})

const venues = ref(Array.from(venueMap.values()))
const searchTerm = ref('')
const selectedRegion = ref('all')
const regions = [...new Set(venues.value.map(v => v.region))]

const filteredVenues = computed(() =>
  venues.value.filter(v => {
    const search =
      v.name.includes(searchTerm.value) ||
      v.address.includes(searchTerm.value)
    const region =
      selectedRegion.value === 'all' || v.region === selectedRegion.value
    return search && region
  }),
)
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.4s ease-out forwards;
}

.filter-select {
  @apply px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white;
}
</style>
