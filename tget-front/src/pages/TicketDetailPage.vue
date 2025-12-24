<script setup lang="ts">
import { ticketService } from "@/api/ticketService";
import ImageWithFallback from "@/components/figma/ImageWithFallback.vue";
import NetflixCalendar from "@/components/NetflixCalendar.vue";
import SeatSelectionModal from "@/components/SeatSelectionModal.vue";
import QueuePollingModal from "@/components/QueuePollingModal.vue";
import Badge from "@/components/ui/Badge.vue";
import Button from "@/components/ui/Button.vue";
import { queueService } from "@/api/queueService";
import Separator from "@/components/ui/Separator.vue";
import { ArrowLeft, Building, Calendar, Clock, MapPin, Tag, User, Users } from "lucide-vue-next";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

const isSeatModalOpen = ref(false);
const isQueueModalOpen = ref(false);
const queueToken = ref("");
const initialQueueData = ref({ waiting: 0, estimatedTime: 0 });

const selectedDate = ref<Date | null>(null);
const ticket = ref<any>(null);
const isLoading = ref(true);

const handleReserve = async () => {
  if (!ticket.value || !selectedDate.value) return;

  try {
    const data = await queueService.checkQueue(ticket.value.performanceId, 1); // TODO: scheduleId if needed
    
    // Direct Entry
    if (data.canProceedDirectly || !data.requiresQueue) {
        queueToken.value = data.sessionId; // Save session ID just in case
        isSeatModalOpen.value = true;
        return;
    }

    // Waiting Required
    queueToken.value = data.sessionId;
    initialQueueData.value = {
        waiting: data.currentWaitingCount || 0,
        estimatedTime: data.estimatedWaitTime || 0
    };
    isQueueModalOpen.value = true;

  } catch (error) {
    console.error("Queue check error:", error);
    alert("예매 대기열 확인 중 오류가 발생했습니다.");
  }
};

import { bookingService } from '@/api/bookingService';
import { toast } from 'vue-sonner';

const onQueueComplete = () => {
    isQueueModalOpen.value = false;
    isSeatModalOpen.value = true;
};

const handleSeatConfirmed = async (seats: any[]) => {
    try {
        await bookingService.bookTicket({
            performanceId: ticket.value.performanceId,
            scheduleId: 1, // TODO: 실제 스케줄 ID 사용
            seats: seats,
            token: queueToken.value
        });
        
        toast.success(`${seats.length}개의 좌석이 예매되었습니다!`, {
            description: "예매 내역은 마이페이지에서 확인하실 수 있습니다.",
        });
        
        isSeatModalOpen.value = false;
        // 마이페이지의 예약내역 탭으로 이동
        router.push('/mypage?tab=reservations'); 
    } catch (error) {
        console.error("Booking failed:", error);
        toast.error("예매에 실패했습니다. 다시 시도해주세요.");
    }
};

onMounted(async () => {
  try {
    const data = await ticketService.getTicketById(id);
    console.log("🔥 상세 정보:", data);

    // 백엔드 DTO를 프론트엔드 형식으로 변환
    ticket.value = {
      performanceId: data.mt20id,
      title: data.prfnm,
      dateStart: data.prfpdfrom,
      dateEnd: data.prfpdto,
      facilityName: data.fcltynm,
      poster: data.poster,
      area: data.area,
      genre: data.genreName,
      state: data.prfstate,
      runtime: data.prfruntime || "정보 없음",
      ageLimit: data.prfage || "전체 관람가",
      productionCompany: data.prfcrew || "정보 없음",
      ticketPrice: data.pcseguidance || "가격 정보 없음",
      cast: data.prfcast || "출연진 정보 없음",
      introImages: data.styurls || [],
      openRun: false,
      isDaehakro: data.area?.includes("대학로") || false,
      isFestival: false,
      isForChild: data.prfage?.includes("어린이") || false,
      dtguidance: data.dtguidance || "공연 시간 정보 없음",
    };
  } catch (error) {
    console.error("Failed to fetch ticket:", error);
  } finally {
    isLoading.value = false;
  }
});

const formatDate = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const formatDateStr = (date: Date) => {
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(
      date.getDate()
    ).padStart(2, "0")}`;
  };

  if (start === end) {
    return formatDateStr(startDate);
  }

  return `${formatDateStr(startDate)} ~ ${formatDateStr(endDate)}`;
};
</script>

<template>
  <div v-if="isLoading" class="min-h-screen bg-black flex items-center justify-center pt-20">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
  </div>

  <div v-else-if="!ticket" class="min-h-screen bg-black flex items-center justify-center pt-20">
    <div class="text-center">
      <h2 class="text-2xl text-white mb-4">공연을 찾을 수 없습니다</h2>
      <Button @click="router.push('/')" class="bg-red-600 hover:bg-red-700">
        홈으로 돌아가기
      </Button>
    </div>
  </div>

  <div v-else class="min-h-screen bg-black pt-20">
    <!-- 뒤로가기 버튼 -->
    <button
      @click="router.go(-1)"
      class="fixed top-24 left-8 z-50 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center transition-all backdrop-blur-sm border border-gray-800 hover:border-gray-600 group"
    >
      <ArrowLeft class="h-6 w-6 text-white group-hover:-translate-x-0.5 transition-transform" />
    </button>

    <!-- 메인 컨텐츠 -->
    <div class="container mx-auto px-4 py-20">
      <div class="grid lg:grid-cols-2 gap-12 items-start">
        <!-- 왼쪽: 포스터 이미지 -->
        <Transition name="fade-slide-right" appear>
          <div>
            <div class="relative rounded-2xl overflow-hidden shadow-2xl">
              <ImageWithFallback
                :src="ticket.poster"
                :alt="ticket.title"
                class="w-full h-[600px] object-cover"
              />
              <div
                class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
              />

              <!-- 특수 태그들 -->
              <div class="absolute bottom-6 left-6 flex flex-wrap gap-2">
                <Badge
                  v-if="ticket.openRun"
                  variant="secondary"
                  class="bg-purple-600/80 text-white"
                >
                  오픈런
                </Badge>
                <Badge
                  v-if="ticket.isDaehakro"
                  variant="secondary"
                  class="bg-orange-600/80 text-white"
                >
                  대학로
                </Badge>
                <Badge
                  v-if="ticket.isFestival"
                  variant="secondary"
                  class="bg-pink-600/80 text-white"
                >
                  페스티벌
                </Badge>
                <Badge
                  v-if="ticket.isForChild"
                  variant="secondary"
                  class="bg-yellow-600/80 text-white"
                >
                  어린이공연
                </Badge>
              </div>
            </div>

            <!-- 공연 정보 - 포스터 바로 아래 -->
            <div class="mt-6 bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-3">
              <h3 class="text-xl text-white mb-4">공연 정보</h3>

              <div class="flex items-start gap-3 text-gray-300">
                <Clock class="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div class="text-sm text-gray-500">공연 시간</div>
                  <div>{{ ticket.runtime }}</div>
                </div>
              </div>

              <div class="flex items-start gap-3 text-gray-300">
                <Users class="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div class="text-sm text-gray-500">관람 등급</div>
                  <div>{{ ticket.ageLimit }}</div>
                </div>
              </div>

              <div class="flex items-start gap-3 text-gray-300">
                <Building class="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div class="text-sm text-gray-500">제작사</div>
                  <div>{{ ticket.productionCompany }}</div>
                </div>
              </div>

              <div class="flex items-start gap-3 text-gray-300">
                <Tag class="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div class="text-sm text-gray-500">가격</div>
                  <div class="text-2xl text-red-600">{{ ticket.ticketPrice }}</div>
                </div>
              </div>
            </div>

            <!-- 소개 이미지들 -->
            <div v-if="ticket.introImages.length > 0" class="mt-6 space-y-4">
              <div
                v-for="(img, idx) in ticket.introImages"
                :key="idx"
                class="relative rounded-2xl overflow-hidden shadow-xl"
              >
                <ImageWithFallback
                  :src="img"
                  :alt="`${ticket.title} 소개 ${idx + 1}`"
                  class="w-full h-auto object-contain"
                />
                <div
                  class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"
                />
              </div>
            </div>
          </div>
        </Transition>

        <!-- 오른쪽: 정보 -->
        <Transition name="fade-slide-left" appear>
          <div class="space-y-8">
            <!-- 타이틀 -->
            <div>
              <h1 class="text-4xl text-white mb-4">{{ ticket.title }}</h1>
              <div class="flex gap-2 flex-wrap">
                <Badge variant="outline" class="text-gray-400 border-gray-700">
                  {{ ticket.genre }}
                </Badge>
                <Badge variant="outline" class="text-gray-400 border-gray-700">
                  {{ ticket.area }}
                </Badge>
              </div>
            </div>

            <Separator class="bg-gray-800" />

            <!-- 장소 및 공연 기간 - 포스터 바로 아래 -->
            <div class="mt-6 bg-gray-900/50 border border-gray-800 rounded-xl p-5 space-y-3">
              <div class="flex items-start gap-3 text-gray-300">
                <MapPin class="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div class="text-sm text-gray-500">장소</div>
                  <div class="text-lg">{{ ticket.facilityName }}</div>
                </div>
              </div>

              <div class="flex items-start gap-3 text-gray-300">
                <Calendar class="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div class="text-sm text-gray-500">공연 기간</div>
                  <div class="text-lg">{{ formatDate(ticket.dateStart, ticket.dateEnd) }}</div>
                </div>
              </div>
            </div>

            <Separator class="bg-gray-800" />

            <!-- 날짜 선택 캘린더 -->
            <div class="space-y-4">
              <h3 class="text-xl text-white">날짜 선택</h3>
              <NetflixCalendar
                :startDate="ticket.dateStart"
                :endDate="ticket.dateEnd"
                :selectedDate="selectedDate"
                @dateSelect="(date) => (selectedDate = date)"
              />
            </div>

            <Separator class="bg-gray-800" />

            <!-- 예매 버튼 - 날짜 선택 바로 아래 -->
            <div class="space-y-4">
              <Button
                class="w-full bg-red-600 hover:bg-red-700 text-white h-14 text-lg disabled:bg-gray-700 disabled:cursor-not-allowed"
                @click="handleReserve"
                :disabled="ticket.state === '공연종료' || !selectedDate"
              >
                {{
                  ticket.state === "공연종료"
                    ? "공연 종료"
                    : !selectedDate
                    ? "날짜를 선택해주세요"
                    : "예매하기"
                }}
              </Button>
            </div>

            <Separator class="bg-gray-800" />

            <!-- 상세 설명 -->
            <template v-if="ticket.description">
              <div class="space-y-4">
                <h3 class="text-xl text-white">상세 정보</h3>
                <p class="text-gray-400 leading-relaxed">{{ ticket.description }}</p>
              </div>
              <Separator class="bg-gray-800" />
            </template>

            <!-- 출연진 -->
            <template v-if="ticket.cast && ticket.cast.length > 0">
              <div class="space-y-4">
                <h3 class="text-xl text-white flex items-center gap-2">
                  <User class="h-5 w-5 text-red-600" />
                  출연진
                </h3>
                <div class="flex flex-wrap gap-2">
                  <Badge
                    v-for="(member, index) in ticket.cast"
                    :key="index"
                    variant="secondary"
                    class="bg-gray-800 text-gray-300 hover:bg-gray-700"
                  >
                    {{ member }}
                  </Badge>
                </div>
              </div>
              <Separator class="bg-gray-800" />
            </template>

            <!-- 제작진 -->
            <template v-if="ticket.crew && ticket.crew.length > 0">
              <div class="space-y-4">
                <h3 class="text-xl text-white">제작진</h3>
                <div class="flex flex-wrap gap-2">
                  <Badge
                    v-for="(member, index) in ticket.crew"
                    :key="index"
                    variant="secondary"
                    class="bg-gray-800 text-gray-300 hover:bg-gray-700"
                  >
                    {{ member }}
                  </Badge>
                </div>
              </div>
              <Separator class="bg-gray-800" />
            </template>

            <!-- 공지사항 -->
            <div class="bg-gray-900/50 border border-gray-800 rounded-lg p-6 mt-8">
              <h4 class="text-white mb-3">유의사항</h4>
              <ul class="text-sm text-gray-400 space-y-2">
                <li>• 예매 후 취소/환불은 공연 시작 24시간 전까지 가능합니다.</li>
                <li>• 공연 당일 예매 확인증 또는 티켓을 지참해주세요.</li>
                <li>• 공연 시작 후 입장이 제한될 수 있습니다.</li>
                <li>• 관람 등급을 확인하시고 예매해주시기 바랍니다.</li>
              </ul>
            </div>

            <!-- 업데이트 정보 -->
            <div class="text-xs text-gray-600 text-center">
              최종 업데이트: {{ ticket.lastUpdated }}
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- 대기열 폴링 모달 -->
    <QueuePollingModal
        v-if="isQueueModalOpen"
        :token="queueToken"
        :performanceId="ticket.performanceId"
        :initialWaitingCount="initialQueueData.waiting"
        :initialEstimatedTime="initialQueueData.estimatedTime"
        @close="isQueueModalOpen = false"
        @complete="onQueueComplete"
    />

    <!-- 좌석 선택 모달 -->
    <SeatSelectionModal
      :isOpen="isSeatModalOpen"
      @close="isSeatModalOpen = false"
      @confirm="handleSeatConfirmed"
      :ticketTitle="ticket.value?.title || ''"
      :ticketDate="ticket.value ? formatDate(ticket.value.dateStart, ticket.value.dateEnd) : ''"
      :ticketLocation="ticket.value?.facilityName || ''"
      :ticketPrice="ticket.value?.ticketPrice || ''"
      :ticketCategory="ticket.value?.genre || ''"
    />
  </div>
</template>

<style scoped>
.fade-slide-right-enter-active,
.fade-slide-right-leave-active {
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.fade-slide-right-enter-from,
.fade-slide-right-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-slide-left-enter-active,
.fade-slide-left-leave-active {
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.fade-slide-left-enter-from,
.fade-slide-left-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
