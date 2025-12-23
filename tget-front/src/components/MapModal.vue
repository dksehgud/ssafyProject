<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { X, MapPin, Calendar, Ticket, Info, ChevronLeft, ChevronRight } from "lucide-vue-next";
import Button from "./ui/Button.vue";
import { ticketService } from "@/api/ticketService";
import type { TicketData } from "@/data/ticketData";
import Dialog from "./ui/Dialog.vue";
import DialogContent from "./ui/DialogContent.vue";
import DialogHeader from "./ui/DialogHeader.vue";
import DialogTitle from "./ui/DialogTitle.vue";
import DialogDescription from "./ui/DialogDescription.vue";

declare global {
  interface Window {
    kakao: any;
  }
}

interface Props {
  isOpen: boolean;
  genreId?: number | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "close"): void;
}>();

const router = useRouter();
const selectedRegion = ref("서울");
const selectedVenue = ref<VenueInfo | null>(null);
const scrollContainerRef = ref<HTMLDivElement | null>(null);
const showLeftButton = ref(false);
const showRightButton = ref(true);
const venues = ref<VenueInfo[]>([]);
const map = ref<any>(null);
const markers = ref<any[]>([]);
const kakaoReady = ref(false);
let scriptLoading = false;

const regions = ["서울", "경기/인천", "충청/강원", "대구/경북", "부산/경남", "광주/전라"];

interface VenueInfo {
  name: string;
  area: string;
  region: string;
  performanceCount: number;
  performances: TicketData[];
  address: string;
  sidonm: string;
  gugunnm: string;
  latitude?: number;
  longitude?: number;
}

onMounted(async () => {
  try {
    // 초기 지역(서울) 데이터 로드
    await loadRegionVenues(selectedRegion.value);
    setTimeout(checkScroll, 100);
  } catch (error) {
    console.error("Failed to fetch initial venues:", error);
  }
});

// 지역별 공연장 데이터 로드
const loadRegionVenues = async (region: string) => {
  try {
    console.log("[MapModal] 지역 데이터 로드:", region, "genreId:", props.genreId);
    const data = await ticketService.getVenuesByRegion(region, props.genreId);

    console.log("[MapModal] ===== 백엔드 응답 데이터 =====");
    console.log("[MapModal] 전체 데이터 개수:", data.length);
    if (data.length > 0) {
      console.log("[MapModal] 첫 번째 항목 전체:", data[0]);
      console.log("[MapModal] fcltynm:", data[0].fcltynm);
      console.log("[MapModal] sidonm:", data[0].sidonm);
      console.log("[MapModal] gugunnm:", data[0].gugunnm);
      console.log("[MapModal] la (위도):", data[0].la, "타입:", typeof data[0].la);
      console.log("[MapModal] lo (경도):", data[0].lo, "타입:", typeof data[0].lo);
      console.log("[MapModal] adres:", data[0].adres);
      console.log("[MapModal] performanceCount:", data[0].performanceCount);
    }

    // 서버에서 받은 데이터를 venues 형식으로 변환
    // 백엔드 VenueDto 필드: mt10id, fcltynm, sidonm, gugunnm, adres, la, lo, performanceCount
    venues.value = data.map((venue: any) => {
      const lat = venue.la ? Number(venue.la) : undefined;
      const lon = venue.lo ? Number(venue.lo) : undefined;

      const mapped = {
        name: venue.fcltynm, // 공연장명
        area: `${venue.sidonm} ${venue.gugunnm}`,
        region: region, // 선택된 권역
        performanceCount: venue.performanceCount || 0, // 공연 수
        performances: venue.performances || [], // 공연 목록 (있는 경우)
        address: venue.adres, // 주소
        sidonm: venue.sidonm, // 시도명
        gugunnm: venue.gugunnm, // 구군명
        latitude: lat, // 위도
        longitude: lon, // 경도
      };

      if (!lat || !lon) {
        console.warn(`[MapModal] ⚠️ 좌표 누락: ${mapped.name} (lat: ${lat}, lon: ${lon})`);
      } else {
        console.log(`[MapModal] ✅ ${mapped.name} - 위도:${lat}, 경도:${lon}`);
      }

      return mapped;
    });

    console.log("[MapModal] 로드된 공연장 수:", venues.value.length);

    // 지도가 있으면 마커 업데이트 (filteredVenues watch에서 자동으로 처리됨)
    // if (map.value) {
    //   updateMarkers();
    // }
  } catch (error) {
    console.error("[MapModal] 지역 데이터 로드 실패:", error);
    venues.value = [];
  }
};

// filteredVenues는 이제 venues.value를 그대로 사용 (서버에서 이미 필터링된 데이터를 받음)
const filteredVenues = computed(() => venues.value);

const checkScroll = () => {
  const container = scrollContainerRef.value;
  if (!container) return;

  showLeftButton.value = container.scrollLeft > 0;
  showRightButton.value = container.scrollLeft < container.scrollWidth - container.clientWidth - 10;
};

const scroll = (direction: "left" | "right") => {
  const container = scrollContainerRef.value;
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

  setTimeout(checkScroll, 300);
};

const handlePerformanceClick = (performanceId: string) => {
  selectedVenue.value = null;
  emit("close");
  router.push(`/ticket/${performanceId}`);
};

const onClose = () => {
  emit("close");
};

watch([selectedRegion, filteredVenues], () => {
  nextTick(() => {
    const container = scrollContainerRef.value;
    if (container) {
      container.scrollLeft = 0;
      setTimeout(checkScroll, 100);
    }
  });
});

// 지역 변경 시 데이터 로드
watch(selectedRegion, async (newRegion) => {
  console.log("[MapModal] 선택된 지역 변경:", newRegion);
  await loadRegionVenues(newRegion);
});

// 카카오맵 초기화
const initMap = () => {
  const container = document.getElementById("map");
  if (!container) {
    console.warn("[MapModal] #map 컨테이너를 찾을 수 없습니다");
    return;
  }

  if (!window.kakao?.maps) {
    console.warn("[MapModal] Kakao Maps API가 로드되지 않았습니다");
    return;
  }

  try {
    // 기존 마커 제거
    markers.value.forEach((m) => m.setMap(null));
    markers.value = [];

    // 기존 지도가 있으면 제거
    if (map.value) {
      map.value = null;
    }

    const center = new window.kakao.maps.LatLng(37.5665, 126.978);
    const options = {
      center: center,
      level: 7,
    };

    map.value = new window.kakao.maps.Map(container, options);
    console.log("[MapModal] 지도 초기화 완료, map.value:", !!map.value);

    // 지도가 생성된 후 마커 업데이트 (반드시 실행)
    setTimeout(() => {
      console.log(
        "[MapModal] initMap 후 updateMarkers 호출, filteredVenues:",
        filteredVenues.value.length
      );
      updateMarkers();
    }, 100);
  } catch (error) {
    console.error("[MapModal] 지도 초기화 실패:", error);
  }
};

// 마커 업데이트
const updateMarkers = () => {
  console.log("[MapModal] ===== updateMarkers 시작 =====");
  console.log("[MapModal] map.value:", !!map.value);
  console.log("[MapModal] kakao.maps:", !!window.kakao?.maps);
  console.log("[MapModal] filteredVenues.length:", filteredVenues.value.length);

  if (!map.value) {
    console.error("[MapModal] updateMarkers: 지도가 없음 - 중단");
    return;
  }

  if (!window.kakao?.maps) {
    console.error("[MapModal] updateMarkers: Kakao Maps API가 없음 - 중단");
    return;
  }

  console.log("[MapModal] updateMarkers: 마커 업데이트 중, venues:", filteredVenues.value.length);

  // 기존 마커 제거
  console.log("[MapModal] 기존 마커 제거:", markers.value.length, "개");
  markers.value.forEach((m) => m.setMap(null));
  markers.value = [];

  // 새 마커 생성
  let successCount = 0;
  let failCount = 0;

  filteredVenues.value.forEach((venue, index) => {
    console.log(
      `[MapModal] venue[${index}]: "${venue.name}", lat: ${venue.latitude}, lon: ${venue.longitude}`
    );

    if (!venue.latitude || !venue.longitude) {
      console.warn(`[MapModal] ❌ 좌표 없음: ${venue.name}`);
      failCount++;
      return;
    }

    try {
      const pos = new window.kakao.maps.LatLng(venue.latitude, venue.longitude);
      console.log(
        `[MapModal] LatLng 생성 성공: ${venue.name} (${venue.latitude}, ${venue.longitude})`
      );

      // 안이 채워진 빨간색 핀 SVG로 마커 이미지 설정
      const markerImage = new window.kakao.maps.MarkerImage(
        'data:image/svg+xml;utf8,<svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 38C16 38 29 23.6928 29 14.5C29 7.04416 23.1797 1 16 1C8.8203 1 3 7.04416 3 14.5C3 23.6928 16 38 16 38Z" stroke="%23EF4444" stroke-width="3" fill="%23EF4444"/><circle cx="16" cy="15" r="5" stroke="white" stroke-width="3" fill="white"/></svg>',
        new window.kakao.maps.Size(28, 36),
        { offset: new window.kakao.maps.Point(16, 40) }
      );

      const marker = new window.kakao.maps.Marker({
        position: pos,
        map: map.value,
        image: markerImage,
      });
      console.log(`[MapModal] ✅ 마커 생성 성공: ${venue.name}`);

      window.kakao.maps.event.addListener(marker, "click", () => {
        selectedVenue.value = venue;
        map.value.panTo(pos);
      });

      markers.value.push(marker);
      successCount++;
    } catch (error) {
      console.error(`[MapModal] ❌ 마커 생성 실패: ${venue.name}`, error);
      failCount++;
    }
  });

  console.log(`[MapModal] ===== 마커 생성 완료 =====`);
  console.log(
    `[MapModal] 성공: ${successCount}개, 실패: ${failCount}개, 총: ${markers.value.length}개`
  );

  console.log("[MapModal] updateMarkers: 마커 생성 완료, 총 개수:", markers.value.length);

  // 지도 범위 조정
  if (markers.value.length > 0) {
    const bounds = new window.kakao.maps.LatLngBounds();
    filteredVenues.value.forEach((v) => {
      if (v.latitude && v.longitude) {
        bounds.extend(new window.kakao.maps.LatLng(v.latitude, v.longitude));
      }
    });
    map.value.setBounds(bounds);
  }
};

// 카카오맵 스크립트 로드
const ensureKakaoLoaded = () => {
  if (window.kakao?.maps) {
    kakaoReady.value = true;
    console.log("[MapModal] Kakao Maps API 이미 로드됨");
    return;
  }

  if (scriptLoading) {
    console.log("[MapModal] Kakao Maps API 로딩 중...");
    return;
  }

  scriptLoading = true;
  const key = import.meta.env.VITE_KAKAO_MAP_KEY;

  if (!key) {
    console.error("[MapModal] VITE_KAKAO_MAP_KEY가 설정되지 않았습니다");
    return;
  }

  console.log("[MapModal] Kakao Maps API 스크립트 로드 시작");
  const script = document.createElement("script");
  script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`;
  script.async = true;
  script.onload = () => {
    console.log("[MapModal] Kakao Maps 스크립트 로드 완료");
    window.kakao.maps.load(() => {
      kakaoReady.value = true;
      console.log("[MapModal] Kakao Maps API 준비 완료");
    });
  };
  script.onerror = (error) => {
    console.error("[MapModal] Kakao Maps 스크립트 로드 실패", error);
    scriptLoading = false;
  };
  document.head.appendChild(script);
};

// 지도 렌더링
const renderMapIfPossible = async () => {
  console.log(
    "[MapModal] renderMapIfPossible 호출됨, kakaoReady:",
    kakaoReady.value,
    "props.isOpen:",
    props.isOpen
  );

  if (!props.isOpen) {
    console.log("[MapModal] 모달이 닫혀있음");
    return;
  }

  if (!kakaoReady.value) {
    console.log("[MapModal] Kakao Maps API 대기 중");
    return;
  }

  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 300));

  const container = document.getElementById("map");

  if (!container) {
    console.error("[MapModal] 컨테이너가 없습니다. 다시 시도합니다.");
    setTimeout(() => renderMapIfPossible(), 200);
    return;
  }

  if (container.offsetWidth === 0 || container.offsetHeight === 0) {
    console.error("[MapModal] 컨테이너 크기가 0입니다. 다시 시도합니다.");
    setTimeout(() => renderMapIfPossible(), 200);
    return;
  }

  // 항상 새로 초기화
  console.log("[MapModal] 지도 초기화 시도");
  initMap();
};

// 모달이 열릴 때 지도 렌더링
watch(
  () => props.isOpen,
  async (isOpen, oldIsOpen) => {
    console.log("[MapModal] isOpen 변경:", oldIsOpen, "->", isOpen);
    if (isOpen) {
      ensureKakaoLoaded();
      // 약간의 딜레이를 주고 렌더링 시도
      await nextTick();
      setTimeout(() => {
        renderMapIfPossible();
      }, 100);
    }
  }
);

// Kakao API 준비 완료 시 지도 렌더링
watch(kakaoReady, async (ready) => {
  console.log("[MapModal] kakaoReady 변경:", ready, "isOpen:", props.isOpen);
  if (ready && props.isOpen) {
    await nextTick();
    setTimeout(() => {
      renderMapIfPossible();
    }, 100);
  }
});

// filteredVenues 변경 시 마커 업데이트 (지도가 이미 초기화된 경우에만)
watch(
  filteredVenues,
  () => {
    console.log("[MapModal] filteredVenues 변경 감지, map.value:", !!map.value);
    if (map.value) {
      console.log("[MapModal] 마커 업데이트 시작");
      updateMarkers();
    }
  },
  { flush: "post" }
); // DOM 업데이트 후 실행

// selectedVenue 변경 시 지도 중심 이동
watch(selectedVenue, (venue) => {
  if (!venue || !map.value) return;
  if (!venue.latitude || !venue.longitude) return;

  const pos = new window.kakao.maps.LatLng(venue.latitude, venue.longitude);
  map.value.panTo(pos);
  map.value.setLevel(3);
});
</script>

<template>
  <!-- Main Map Modal -->
  <Transition name="slide-up">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex flex-col">
      <!-- Overlay -->
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm" @click="onClose" />

      <!-- Modal Content - Full Screen -->
      <div
        class="relative z-50 bg-gradient-to-b from-gray-900 to-black h-full overflow-hidden flex flex-col w-full"
      >
        <!-- Header -->
        <div
          class="bg-gradient-to-r from-red-900/30 to-black border-b border-gray-800 p-6 flex-shrink-0"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <MapPin class="h-6 w-6 text-red-500" />
              <h2 class="text-2xl text-white font-bold">공연장 위치</h2>
            </div>
            <button
              @click="onClose"
              class="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
            >
              <X class="h-5 w-5 text-white" />
            </button>
          </div>

          <!-- Region Buttons -->
          <div class="flex gap-2 mt-4 overflow-x-auto scrollbar-hide">
            <button
              v-for="region in regions"
              :key="region"
              @click="selectedRegion = region"
              class="px-4 py-2 rounded-full whitespace-nowrap transition-all"
              :class="
                selectedRegion === region
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              "
            >
              {{ region }}
            </button>
          </div>
        </div>

        <!-- Map Area - Takes full remaining height -->
        <div class="flex-1 overflow-hidden flex flex-col">
          <div class="flex-1 p-6 overflow-hidden">
            <div class="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden h-full">
              <div id="map" class="w-full h-full" />
            </div>
          </div>

          <!-- Venue Cards - Fixed at bottom -->
          <div class="flex-shrink-0 p-6 pt-0">
            <div class="space-y-3">
              <h3 class="text-white px-2 font-bold">
                {{ selectedRegion }} 공연장 ({{ filteredVenues.length }})
              </h3>
              <div class="relative group">
                <!-- Left Scroll Button -->
                <Transition name="fade">
                  <button
                    v-if="showLeftButton && filteredVenues.length > 2"
                    @click="scroll('left')"
                    class="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all shadow-lg"
                  >
                    <ChevronLeft class="w-6 h-6 text-white" />
                  </button>
                </Transition>

                <!-- Right Scroll Button -->
                <Transition name="fade">
                  <button
                    v-if="showRightButton && filteredVenues.length > 2"
                    @click="scroll('right')"
                    class="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all shadow-lg"
                  >
                    <ChevronRight class="w-6 h-6 text-white" />
                  </button>
                </Transition>

                <div
                  ref="scrollContainerRef"
                  @scroll="checkScroll"
                  class="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
                  style="scrollbar-width: none; -ms-overflow-style: none"
                >
                  <div
                    v-for="venue in filteredVenues"
                    :key="venue.name"
                    class="flex-none w-[400px] bg-gray-800/70 rounded-xl border border-gray-700 p-5 cursor-pointer hover:border-red-600 hover:bg-gray-800 transition-all group"
                    @click="selectedVenue = venue"
                  >
                    <div class="flex items-start gap-4">
                      <div
                        class="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center flex-shrink-0 group-hover:bg-red-600/30 transition-colors"
                      >
                        <MapPin class="h-6 w-6 text-red-500" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <h4 class="text-white mb-1 truncate font-bold">{{ venue.name }}</h4>
                        <p class="text-xs text-gray-300 mb-1">
                          {{ venue.sidonm }} {{ venue.gugunnm }}
                        </p>
                        <p class="text-sm text-gray-400 mb-3 line-clamp-1">{{ venue.address }}</p>
                        <div class="flex items-center gap-4 text-xs text-gray-500">
                          <div class="flex items-center gap-1">
                            <Ticket class="h-3 w-3" />
                            <span>{{ venue.performanceCount }}개 공연</span>
                          </div>
                          <div class="flex items-center gap-1">
                            <Info class="h-3 w-3" />
                            <span class="text-red-500">상세보기</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Venue Detail Dialog -->
  <Dialog :open="!!selectedVenue" @update:open="(val) => !val && (selectedVenue = null)">
    <DialogContent
      class="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto"
    >
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2 text-2xl">
          <MapPin class="h-6 w-6 text-red-500" />
          {{ selectedVenue?.name }}
        </DialogTitle>
        <DialogDescription class="text-gray-400">
          {{ selectedVenue?.address }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="selectedVenue" class="mt-6 space-y-6">
        <!-- Venue Info -->
        <div class="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 class="text-white mb-3 flex items-center gap-2 font-bold">
            <Info class="h-5 w-5 text-red-500" />
            공연장 정보
          </h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-400">지역</span>
              <span class="text-white">{{ selectedVenue.region }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">주소</span>
              <span class="text-white">{{ selectedVenue.area }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">전체 주소</span>
              <span class="text-white">{{ selectedVenue.address }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">공연 수</span>
              <span class="text-white">{{ selectedVenue.performanceCount }}개</span>
            </div>
          </div>
        </div>

        <!-- Performance List -->
        <div>
          <h3 class="text-white mb-3 flex items-center gap-2 font-bold">
            <Ticket class="h-5 w-5 text-red-500" />
            진행 중인 공연
          </h3>
          <div class="space-y-3 max-h-[300px] overflow-y-auto">
            <div
              v-for="performance in selectedVenue.performances"
              :key="performance.performanceId"
              class="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-red-600 transition-colors cursor-pointer"
              @click="handlePerformanceClick(performance.performanceId)"
            >
              <div class="flex gap-4">
                <img
                  :src="performance.poster"
                  :alt="performance.title"
                  class="w-16 h-20 object-cover rounded"
                />
                <div class="flex-1">
                  <h4 class="text-white mb-1 line-clamp-1 font-bold">{{ performance.title }}</h4>
                  <div class="space-y-1 text-xs text-gray-400">
                    <div class="flex items-center gap-1">
                      <Calendar class="h-3 w-3" />
                      <span>{{ performance.dateStart }} ~ {{ performance.dateEnd }}</span>
                    </div>
                    <div class="text-red-500">{{ performance.ticketPrice }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Wayfinding Button -->
        <Button class="w-full bg-red-600 hover:bg-red-700 h-12">
          <MapPin class="h-5 w-5 mr-2" />
          길찾기
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
#map {
  min-height: 400px;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
