<script setup lang="ts">
import { ticketService } from "@/api/ticketService"; // 백엔드 연동 시 사용
import CategoryRow from "@/components/CategoryRow.vue";
import FeaturedCarousel from "@/components/FeaturedCarousel.vue";
import MapModal from "@/components/MapModal.vue";
import TicketCard from "@/components/TicketCard.vue";
import Button from "@/components/ui/Button.vue";
import { ChevronLeft, ChevronRight, Map } from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";
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
const recommendations = ref<TicketData[]>([]);
const recommendationType = ref<string | null>(null);
const isLoading = ref(true);
const lastSelectedRegion = ref<string>("서울"); // 마지막으로 선택한 지역 저장

// Helper: map backend PerformanceDto -> frontend TicketData
const mapPerformance = (item: any): TicketData => {
  // genreId를 한글 카테고리명으로 매핑
  const genreIdToCategory: Record<number, string> = {
    1: "클래식",
    2: "콘서트",
    3: "뮤지컬",
    4: "연극",
  };
  
  const categoryName = item.genreId 
    ? genreIdToCategory[item.genreId] || item.genreName || item.category || ""
    : item.genreName || item.category || "";
  
  return {
    performanceId: item.mt20id || item.id || item.performanceId || "",
    title: item.prfnm || item.title || "",
    dateStart: item.prfpdfrom || item.dateStart || "",
    dateEnd: item.prfpdto || item.dateEnd || "",
    facilityName: item.fcltynm || item.facilityName || "",
    ticketPrice: item.ticketPrice || "",
    poster: item.poster || item.image || "",
    area: item.area || item.region || "",
    genre: item.genreName || item.genre || "",
    state: item.prfstate || item.state || "",
    category: categoryName,
  };
};

// API 호출 함수 (재사용 가능)
const loadPerformances = async () => {
  try {
    isLoading.value = true;
    
    // genreId 파라미터 준비
    const params: any = {};
    if (genreId.value !== null) {
      params.genreId = genreId.value;
    }

    console.log("🎭 현재 선택된 카테고리:", props.selectedCategory);
    console.log("🔢 genreId:", genreId.value);

    // JWT 토큰 가져오기 (localStorage에서)
    const token = localStorage.getItem("accessToken");
    console.log("🔑 JWT 토큰:", token ? "있음" : "없음");

    // 백엔드 API 호출 (토큰 전달)
    const data = await ticketService.getTickets(params, token);
    console.log("🔥 백엔드 응답 데이터:", data);
    console.log("📊 응답 구조 확인:", {
      isArray: Array.isArray(data),
      hasAllPerformances: data?.allPerformances !== undefined,
      hasRecommendations: data?.recommendations !== undefined,
      recommendationsIsArray: Array.isArray(data?.recommendations),
      recommendationsLength: data?.recommendations?.length,
      recommendationType: data?.recommendationType
    });

    // 새 응답(PagePerformanceResponse) 또는 기존 응답(배열) 모두 처리
    let performanceList: any[] = [];

    if (Array.isArray(data)) {
      performanceList = data;
    } else if (data && data.allPerformances) {
      performanceList = data.allPerformances;

      // 추천 데이터가 있을 경우 저장
      if (Array.isArray(data.recommendations)) {
        recommendations.value = data.recommendations.map((item: any) => mapPerformance(item));
        console.log("✅ AI 추천 데이터 설정됨:", recommendations.value.length, "개");
      } else {
        console.log("⚠️ recommendations가 배열이 아니거나 없음:", data.recommendations);
        recommendations.value = []; // 추천 데이터 초기화
      }

      if (data.recommendationType) {
        recommendationType.value = data.recommendationType;
        console.log("✅ 추천 타입 설정됨:", recommendationType.value);
      } else {
        recommendationType.value = null; // 추천 타입 초기화
      }
    } else if (data && data.data && Array.isArray(data.data)) {
      // axios 응답 래핑(data.data)인 경우
      performanceList = data.data;
    }

    tickets.value = performanceList.map((item: any) => mapPerformance(item));
    console.log("🎫 총 티켓 수:", tickets.value.length);
    
    // 카테고리별 분류 확인
    const categoryCount: Record<string, number> = {};
    tickets.value.forEach(ticket => {
      categoryCount[ticket.category] = (categoryCount[ticket.category] || 0) + 1;
    });
    console.log("📂 카테고리별 티켓 수:", categoryCount);
    
    // 연극 카테고리 필터링 확인
    if (props.selectedCategory === "연극") {
      const theaterTickets = tickets.value.filter(t => t.category === "연극");
      console.log("🎭 연극 필터링 결과:", theaterTickets.length, "개");
      if (theaterTickets.length === 0) {
        console.warn("⚠️ 연극 데이터가 없습니다. 백엔드 응답을 확인하세요.");
      }
    }
  } catch (error) {
    console.error("Failed to fetch tickets:", error);
  } finally {
    isLoading.value = false;
  }
};

// 초기 로드
onMounted(() => {
  loadPerformances();
});

// selectedCategory 변경 시 데이터 다시 로드
watch(() => props.selectedCategory, (newCategory, oldCategory) => {
  console.log(`🔄 카테고리 변경: ${oldCategory} → ${newCategory}`);
  loadPerformances();
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

// AI 추천 섹션 스크롤 관련
const recommendScrollRef = ref<HTMLDivElement | null>(null);
const showRecommendLeftButton = ref(false);
const showRecommendRightButton = ref(true);

const checkRecommendScroll = () => {
  const container = recommendScrollRef.value;
  if (!container) return;

  showRecommendLeftButton.value = container.scrollLeft > 0;
  showRecommendRightButton.value =
    container.scrollLeft < container.scrollWidth - container.clientWidth - 10;
};

const scrollRecommend = (direction: "left" | "right") => {
  const container = recommendScrollRef.value;
  if (!container) return;

  const containerWidth = container.clientWidth;
  const scrollAmount = containerWidth - 100;

  const newScrollLeft =
    direction === "left"
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

  container.scrollTo({
    left: newScrollLeft,
    behavior: "smooth",
  });

  setTimeout(checkRecommendScroll, 300);
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

    <!-- AI 추천 섹션: 캐러셀 바로 아래, 카테고리(클래식 등) 위에 노출 -->
    <Transition name="fade" appear>
      <div v-if="recommendations.length" class="container mx-auto px-4 mt-6 mb-8 sm:mb-12">
        <h2 class="mb-4 sm:mb-6 text-white text-lg sm:text-xl font-bold">AI 추천 공연 <small class="text-sm text-gray-500">({{ recommendationType || 'base' }})</small></h2>
        
        <div class="relative group">
          <!-- Left Button -->
          <Transition name="fade">
            <button
              v-if="showRecommendLeftButton"
              @click="scrollRecommend('left')"
              class="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft class="w-5 h-5 sm:w-8 sm:h-8 text-white" />
            </button>
          </Transition>

          <!-- Right Button -->
          <Transition name="fade">
            <button
              v-if="showRecommendRightButton"
              @click="scrollRecommend('right')"
              class="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100"
            >
              <ChevronRight class="w-5 h-5 sm:w-8 sm:h-8 text-white" />
            </button>
          </Transition>

          <!-- Scroll Container -->
          <div
            ref="recommendScrollRef"
            @scroll="checkRecommendScroll"
            class="flex gap-2 sm:gap-4 overflow-x-auto scrollbar-hide pb-2"
            style="scrollbar-width: none; -ms-overflow-style: none;"
          >
            <div v-for="r in recommendations" :key="r.performanceId" class="flex-none w-[280px]">
              <TicketCard
                v-bind="r"
              />
            </div>
          </div>
        </div>
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

.recommend-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.recommend-item {
  /* card sizing handled inline */
}
</style>
