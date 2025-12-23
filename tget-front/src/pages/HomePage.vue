<script setup lang="ts">
import { ticketService } from "@/api/ticketService"; // 백엔드 연동 시 사용
import CategoryRow from "@/components/CategoryRow.vue";
import FeaturedCarousel from "@/components/FeaturedCarousel.vue";
import MapModal from "@/components/MapModal.vue";
import Button from "@/components/ui/Button.vue";
import { Map } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
// import { ticketData } from '@/data/ticketData' // 정적 데이터 사용 (주석 처리)

// Type definition for ticket data
interface TicketData {
  performanceId: string;
  title: string;
  dateStart: string;
  dateEnd: string;
  facilityName: string;
  ticketPrice: string;
  poster: string;
  area: string;
  genre: string;
  state: string;
  category: string;
}

interface Props {
  selectedCategory?: string | null;
}

const props = defineProps<Props>();

const isMapModalOpen = ref(false);
const tickets = ref<TicketData[]>([]);
const isLoading = ref(true);
const lastSelectedRegion = ref<string>("서울"); // 마지막으로 선택한 지역 저장

onMounted(async () => {
  try {
    // 백엔드 API 호출
    const data = await ticketService.getTickets();
    console.log("🔥 백엔드 응답 데이터:", data);

    // 백엔드 DTO(PerformanceDto) -> 프론트엔드 TicketData 변환
    tickets.value = data.map((item: any) => ({
      performanceId: item.mt20id, // ID
      title: item.prfnm,
      dateStart: item.prfpdfrom,
      dateEnd: item.prfpdto,
      facilityName: item.fcltynm,
      ticketPrice: "", // DTO에 미포함 (추후 추가 필요 시 여기서 처리)
      poster: item.poster,
      area: item.area,
      genre: item.genreName,
      state: item.prfstate,
      category: item.genreName, // 카테고리로 사용
    }));
  } catch (error) {
    console.error("Failed to fetch tickets:", error);
  } finally {
    isLoading.value = false;
  }
});

const getRegion = (area: string): string => {
  if (area.includes("서울") || area.includes("서울특별시")) return "서울";
  if (area.includes("경기") || area.includes("인천")) return "경기/인천";
  if (
    area.includes("충청") ||
    area.includes("충남") ||
    area.includes("충북") ||
    area.includes("강원") ||
    area.includes("대전") ||
    area.includes("세종")
  )
    return "충청/강원";
  if (area.includes("대구") || area.includes("경북") || area.includes("경상북도"))
    return "대구/경북";
  if (
    area.includes("부산") ||
    area.includes("경남") ||
    area.includes("경상남도") ||
    area.includes("울산")
  )
    return "부산/경남";
  if (
    area.includes("광주") ||
    area.includes("전라") ||
    area.includes("전남") ||
    area.includes("전북")
  )
    return "광주/전라";
  return "제주";
};

const categorizedData = computed(() => {
  const filteredData = props.selectedCategory
    ? tickets.value.filter((ticket) => ticket.category === props.selectedCategory)
    : tickets.value;

  if (props.selectedCategory) {
    const regionGroups: Record<string, TicketData[]> = {};

    filteredData.forEach((ticket) => {
      const region = getRegion(ticket.area);
      if (!regionGroups[region]) {
        regionGroups[region] = [];
      }
      regionGroups[region].push(ticket);
    });

    return regionGroups;
  } else {
    const categories: Record<string, TicketData[]> = {};

    filteredData.forEach((ticket) => {
      if (!categories[ticket.category]) {
        categories[ticket.category] = [];
      }
      categories[ticket.category].push(ticket);
    });

    return categories;
  }
});

const carouselData = computed(() => {
  return props.selectedCategory
    ? tickets.value.filter((ticket) => ticket.category === props.selectedCategory)
    : tickets.value;
});

// genreId 매핑: 클래식=1, 콘서트=2, 뮤지컬=3, 연극=4
const genreId = computed(() => {
  if (!props.selectedCategory) return null;

  const genreMap: Record<string, number> = {
    클래식: 1,
    콘서트: 2,
    뮤지컬: 3,
    연극: 4,
  };

  return genreMap[props.selectedCategory] || null;
});

// 활성화된 지역 (이전에 선택한 지역 또는 기본값 서울)
const activeRegion = computed(() => {
  return lastSelectedRegion.value || "서울";
});

// 지역 선택 업데이트 함수
const updateLastSelectedRegion = (region: string) => {
  lastSelectedRegion.value = region;
};
</script>

<template>
  <div v-if="isLoading" class="min-h-screen bg-black flex items-center justify-center pt-20">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
  </div>

  <main v-else class="mx-auto py-6 sm:py-12 relative pb-24 sm:pb-32 px-3 sm:px-4 pt-20">
    <!-- Featured Carousel Section -->
    <Transition name="fade-up" appear>
      <div class="container mx-auto px-4">
        <FeaturedCarousel :items="carouselData" />
      </div>
    </Transition>

    <!-- Category/Region Sections -->
    <Transition name="fade" appear>
      <div class="container mx-auto px-4">
        <div
          v-for="(items, groupName, index) in categorizedData"
          :key="groupName"
          class="transition-all duration-500"
          :style="{ transitionDelay: `${0.5 + index * 0.1}s` }"
        >
          <CategoryRow :category="groupName" :items="items" />
        </div>
      </div>
    </Transition>

    <!-- Map View Button -->
    <Transition name="fade-up">
      <div
        v-if="selectedCategory"
        class="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-40"
      >
        <Button
          @click="isMapModalOpen = true"
          class="bg-red-600 hover:bg-red-700 text-white shadow-2xl h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg"
        >
          <Map class="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          지도로 보기
        </Button>
      </div>
    </Transition>

    <!-- Map Modal -->
    <MapModal
      :isOpen="isMapModalOpen"
      :genreId="genreId"
      :initialRegion="activeRegion"
      @close="isMapModalOpen = false"
      @regionChange="updateLastSelectedRegion"
    />
  </main>
</template>

<style scoped>
.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.6s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
