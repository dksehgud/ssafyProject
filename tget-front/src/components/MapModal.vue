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
  initialRegion?: string; // 초기 권역 설정
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "close"): void;
  (e: "regionChange", region: string): void;
}>();

const router = useRouter();
const selectedRegion = ref(props.initialRegion || "서울");
const selectedVenue = ref<VenueInfo | null>(null);
const scrollContainerRef = ref<HTMLDivElement | null>(null);
const showLeftButton = ref(false);
const showRightButton = ref(true);
const venues = ref<VenueInfo[]>([]);
const map = ref<any>(null);
const markers = ref<any[]>([]);
const overlays = ref<any[]>([]); // CustomOverlay 배열 추가
const hoverOverlay = ref<any>(null); // 호버 시 표시할 오버레이
const kakaoReady = ref(false);
const currentZoomLevel = ref(7); // 현재 줌 레벨 추적
let scriptLoading = false;

// 줌 레벨 임계값: 이 값 이하일 때 라벨 표시 (값이 작을수록 더 확대된 상태)
const LABEL_VISIBLE_ZOOM_LEVEL = 3;

// 지역별 캐시: key = `${region}::${genreId}`
const regionCache = new Map<string, VenueInfo[]>();

const regions = ["서울", "경기/인천", "충청/강원", "대구/경북", "부산/경남", "광주/전라"];

interface VenueInfo {
  mt10id: string; // 공연장 ID
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
    // 모달이 열려있을 때만 초기 지역 데이터 로드
    if (props.isOpen) {
      await loadRegionVenues(selectedRegion.value);
      setTimeout(checkScroll, 100);
    } else {
      console.log('[MapModal] mounted - modal closed, 초기 로드 건너뜀');
    }
  } catch (error) {
    console.error("Failed to fetch initial venues:", error);
  }
});

// 지역별 공연장 데이터 로드
const loadRegionVenues = async (region: string) => {
  try {
    // 모달이 닫혀있으면 API 호출하지 않음
    if (!props.isOpen) {
      console.log('[MapModal] loadRegionVenues 호출됨지만 모달이 닫혀있어 요청을 건너뜁니다:', region);
      return;
    }

    const cacheKey = `${region}::${props.genreId ?? 'all'}`;

    // 캐시가 있다면 캐시를 사용하고 API 호출을 피함
    if (regionCache.has(cacheKey)) {
      venues.value = regionCache.get(cacheKey) || [];
      console.log('[MapModal] 지역 데이터 캐시 사용:', cacheKey, '개수:', venues.value.length);
      return;
    }

    console.log("[MapModal] 지역 데이터 로드:", region, "genreId:", props.genreId);
    const data = await ticketService.getVenuesByRegion(region, props.genreId);

    console.log("[MapModal] ===== 백엔드 응답 데이터 =====");
    console.log("[MapModal] 전체 데이터 개수:", data.length);
    if (data.length > 0) {
      console.log("[MapModal] 첫 번째 항목 전체:", data[0]);
      console.log("[MapModal] mt10id:", data[0].mt10id);
      console.log("[MapModal] fcltynm:", data[0].fcltynm);
      console.log("[MapModal] sidonm:", data[0].sidonm);
      console.log("[MapModal] gugunnm:", data[0].gugunnm);
      console.log("[MapModal] region:", data[0].region);
      console.log("[MapModal] adres:", data[0].adres);
      console.log("[MapModal] telno:", data[0].telno);
      console.log("[MapModal] la (위도):", data[0].la, "타입:", typeof data[0].la);
      console.log("[MapModal] lo (경도):", data[0].lo, "타입:", typeof data[0].lo);
      console.log("[MapModal] performanceCount:", data[0].performanceCount);
      console.log("[MapModal] mt13cnt:", data[0].mt13cnt);
    }

    // 서버에서 받은 데이터를 venues 형식으로 변환
    // 백엔드 VenueDto 필드: mt10id, fcltynm, sidonm, gugunnm, region, adres, telno, la, lo, performanceCount, mt13cnt
    const venueList = data.map((venue: any) => {
      const lat = venue.la ? Number(venue.la) : undefined;
      const lon = venue.lo ? Number(venue.lo) : undefined;

      const mappedItem: VenueInfo = {
        mt10id: venue.mt10id, // 공연장 ID
        name: venue.fcltynm, // 공연장명
        area: `${venue.sidonm} ${venue.gugunnm}`,
        region: venue.region || region, // 백엔드에서 제공하는 region 또는 선택된 권역
        performanceCount: venue.performanceCount || 0, // 공연 수
        performances: [], // 목록 API에서는 공연 목록을 제공하지 않음
        address: venue.adres || `${venue.sidonm} ${venue.gugunnm}`, // 서버 DTO의 adres 사용
        sidonm: venue.sidonm, // 시도명
        gugunnm: venue.gugunnm, // 구군명
        latitude: lat, // 위도
        longitude: lon, // 경도
      };

      if (!lat || !lon) {
        console.warn(`[MapModal] ⚠️ 좌표 누락: ${mappedItem.name} (lat: ${lat}, lon: ${lon})`);
      } else {
        console.log(`[MapModal] ✅ ${mappedItem.name} - 위도:${lat}, 경도:${lon}`);
      }

      return mappedItem;
    });

    venues.value = venueList;
    // 캐시에 저장
    regionCache.set(cacheKey, venues.value);

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

// 지역 변경 핸들러
const handleRegionChange = (region: string) => {
  selectedRegion.value = region;
  emit("regionChange", region);
};

// 길찾기 버튼 핸들러 - 다이얼로그 닫고 지도 중앙에 공연장 표시
const handleWayfinding = () => {
  if (!selectedVenue.value) return;

  const venue = selectedVenue.value;

  // 다이얼로그 닫기
  selectedVenue.value = null;

  // 지도를 해당 공연장 중앙으로 이동
  if (map.value && venue.latitude && venue.longitude) {
    const pos = new window.kakao.maps.LatLng(venue.latitude, venue.longitude);
    map.value.setCenter(pos); // 정확히 중앙으로 이동
    map.value.setLevel(4); // 라벨이 보이도록 줌 레벨 4로 확대
    console.log("[MapModal] 길찾기 - 지도를 공연장 중앙으로 이동, 줌 레벨: 4");
  }
};

// 공연장 클릭 핸들러 - 상세정보 API 호출
const handleVenueClick = async (venue: VenueInfo) => {
  try {
    console.log("[MapModal] 공연장 클릭:", venue.name, "mt10id:", venue.mt10id);

    // 먼저 지도를 해당 공연장 위치로 이동 (즉시 피드백)
    if (map.value && venue.latitude && venue.longitude) {
      const pos = new window.kakao.maps.LatLng(venue.latitude, venue.longitude);
      map.value.setCenter(pos); // 정확히 중앙으로 이동
      map.value.setLevel(4); // 라벨이 보이도록 줌 레벨 4로 확대
      console.log("[MapModal] 지도를 공연장 중앙으로 즉시 이동, 줌 레벨: 4");
    }

    // API 호출하여 상세정보 및 공연 목록 가져오기
    // mt10id, genreId, region을 함께 전달
    const detailData = await (ticketService as any).getVenueDetail(
      venue.mt10id,
      props.genreId,
      selectedRegion.value
    );

    console.log("[MapModal] 공연장 상세정보 응답:", detailData);
    console.log("[MapModal] venue 정보:", detailData.venue);
    console.log("[MapModal] performances 개수:", detailData.performances?.length);

    // 백엔드 응답 구조: { venue: VenueDto, performances: PerformanceDto[] }
    const venueInfo = detailData.venue;
    const performanceList = detailData.performances || [];

    // 공연 목록을 프론트엔드 형식으로 변환
    const mappedPerformances = performanceList.map((perf: any) => ({
      performanceId: perf.mt20id,
      title: perf.prfnm,
      dateStart: perf.prfpdfrom,
      dateEnd: perf.prfpdto,
      facilityName: perf.fcltynm,
      poster: perf.poster,
      area: perf.area,
      genre: perf.genreName,
      state: perf.prfstate,
      ticketPrice: "", // DTO에 가격 정보가 없으므로 빈 문자열
    }));

    console.log("[MapModal] 변환된 공연 목록:", mappedPerformances);

    // 받아온 데이터로 selectedVenue 업데이트
    selectedVenue.value = {
      mt10id: venueInfo.mt10id,
      name: venueInfo.fcltynm || venue.name,
      area: `${venueInfo.sidonm} ${venueInfo.gugunnm}`,
      region: venueInfo.region || venue.region,
      performanceCount: mappedPerformances.length,
      performances: mappedPerformances,
      address: venueInfo.adres || venue.address, // 서버 DTO의 adres 사용
      sidonm: venueInfo.sidonm,
      gugunnm: venueInfo.gugunnm,
      latitude: venueInfo.la ? Number(venueInfo.la) : venue.latitude,
      longitude: venueInfo.lo ? Number(venueInfo.lo) : venue.longitude,
    };

    console.log("[MapModal] 최종 selectedVenue:", selectedVenue.value);
  } catch (error) {
    console.error("[MapModal] 공연장 상세정보 로드 실패:", error);
    // 실패 시 기존 데이터로 표시
    selectedVenue.value = venue;

    // 실패해도 지도는 중앙으로 이동 (이미 위에서 이동했지만 재확인)
    if (map.value && venue.latitude && venue.longitude) {
      const pos = new window.kakao.maps.LatLng(venue.latitude, venue.longitude);
      map.value.setCenter(pos);
      map.value.setLevel(4);
    }
  }
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
  if (!props.isOpen) {
    console.log('[MapModal] 모달이 닫혀있어 지역 데이터 로드를 건너뜁니다:', newRegion);
    return;
  }
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

    // 기존 오버레이 제거
    overlays.value.forEach((o) => o.setMap(null));
    overlays.value = [];

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

    // 줌 레벨 변경 이벤트 리스너
    window.kakao.maps.event.addListener(map.value, "zoom_changed", () => {
      const level = map.value.getLevel();
      currentZoomLevel.value = level;
      console.log("[MapModal] 줌 레벨 변경:", level);
      updateOverlayVisibility();
    });

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

  // 기존 오버레이 제거
  console.log("[MapModal] 기존 오버레이 제거:", overlays.value.length, "개");
  overlays.value.forEach((o) => o.setMap(null));
  overlays.value = [];

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
        zIndex: 1, // 기본 zIndex
      });
      console.log(`[MapModal] ✅ 마커 생성 성공: ${venue.name}`);

      // 공연장 이름을 표시하는 CustomOverlay 생성
      const overlayContent = document.createElement('div');
      overlayContent.className = 'custom-overlay';
      overlayContent.style.cssText = `
        padding: 6px 10px;
        background: rgba(239, 68, 68, 0.95);
        color: white;
        font-size: 12px;
        font-weight: bold;
        border-radius: 6px;
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: pointer;
        user-select: none;
        transition: opacity 0.2s;
      `;
      overlayContent.textContent = venue.name;
      overlayContent.onclick = () => handleVenueClick(venue);

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: pos,
        content: overlayContent,
        yAnchor: 2.3, // 호버 오버레이와 동일한 위치
        zIndex: 100,
      });

      // 줌 레벨에 따라 초기 표시 여부 결정
      if (currentZoomLevel.value <= LABEL_VISIBLE_ZOOM_LEVEL) {
        customOverlay.setMap(map.value);
      }

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, "click", () => {
        handleVenueClick(venue);
      });

      // 마우스 호버 이벤트 - 호버 시 항상 오버레이 표시 + 마커를 앞으로
      window.kakao.maps.event.addListener(marker, "mouseover", () => {
        // 마커를 최상단으로 이동
        marker.setZIndex(9999);

        // 호버 전용 오버레이 생성 (줌 레벨과 무관하게 표시)
        if (hoverOverlay.value) {
          hoverOverlay.value.setMap(null);
        }

        const hoverContent = document.createElement('div');
        hoverContent.style.cssText = `
          padding: 6px 10px;
          background: rgba(239, 68, 68, 1);
          color: white;
          font-size: 13px;
          font-weight: bold;
          border-radius: 6px;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          cursor: pointer;
          user-select: none;
        `;
        hoverContent.textContent = venue.name;
        hoverContent.onclick = () => handleVenueClick(venue);

        hoverOverlay.value = new window.kakao.maps.CustomOverlay({
          position: pos,
          content: hoverContent,
          yAnchor: 2.3, // 일반 오버레이와 동일한 위치
          map: map.value,
          zIndex: 10000, // 호버 시 더 위에 표시
        });
      });

      // 마우스 아웃 이벤트 - 호버 오버레이 제거 + 마커 원래 위치로
      window.kakao.maps.event.addListener(marker, "mouseout", () => {
        // 마커를 원래 zIndex로 복원
        marker.setZIndex(1);

        if (hoverOverlay.value) {
          hoverOverlay.value.setMap(null);
          hoverOverlay.value = null;
        }
      });

      markers.value.push(marker);
      overlays.value.push(customOverlay);
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

// 줌 레벨에 따라 오버레이 표시/숨김
const updateOverlayVisibility = () => {
  const shouldShow = currentZoomLevel.value <= LABEL_VISIBLE_ZOOM_LEVEL;
  console.log("[MapModal] 오버레이 가시성 업데이트, 줌 레벨:", currentZoomLevel.value, "표시:", shouldShow);

  overlays.value.forEach((overlay) => {
    if (shouldShow) {
      overlay.setMap(map.value);
    } else {
      overlay.setMap(null);
    }
  });
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
      // 모달이 열릴 때 initialRegion이 있으면 selectedRegion 업데이트
      if (props.initialRegion && props.initialRegion !== selectedRegion.value) {
        console.log("[MapModal] initialRegion으로 selectedRegion 업데이트:", props.initialRegion);
        selectedRegion.value = props.initialRegion;
      }

      // 활성화된 권역의 공연장 데이터 즉시 로드
      console.log("[MapModal] 모달 열림 - 공연장 데이터 로드 시작:", selectedRegion.value);
      await loadRegionVenues(selectedRegion.value);

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

// selectedVenue 변경 시 지도 중심 이동 및 확대
watch(selectedVenue, (venue) => {
  if (!venue || !map.value) return;
  if (!venue.latitude || !venue.longitude) return;

  const pos = new window.kakao.maps.LatLng(venue.latitude, venue.longitude);
  map.value.setCenter(pos); // 정확히 중앙으로 이동
  map.value.setLevel(4); // 라벨이 보이도록 줌 레벨 4로 확대
  console.log("[MapModal] selectedVenue watch - 지도를 중앙으로 이동 및 확대, 줌 레벨: 4");
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
              @click="handleRegionChange(region)"
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
                    @click="handleVenueClick(venue)"
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
        <Button
          @click="handleWayfinding"
          class="w-full bg-red-600 hover:bg-red-700 h-12"
        >
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

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
