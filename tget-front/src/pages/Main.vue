<template>
  <!-- ...existing code... -->

  <Transition name="fade-up" appear>
    <div class="container mx-auto px-4">
      <FeaturedCarousel :items="carouselData" />
    </div>
  </Transition>

  <!-- AI 추천 섹션: 화면 상단(캐러셀 바로 아래) -->
  <Transition name="fade" appear>
  <div class="container mx-auto px-4 mt-6">
    <CategoryRow
      category="AI 추천 공연"
      :items="recommendations"
      :subtitle="recommendationType"
    />
  </div>
</Transition>

  <!-- Category/Region Sections: HomePage와 같은 형태로 반복 렌더링 -->
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

  <!-- ...existing code (카테고리/지역 렌더링 등)... -->
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import { fetchMainPerformances } from '@/api/performanceService';
import type { RecommendationType } from '@/types/performance';
import type { TicketData } from '@/types/ticket';

import CategoryRow from '@/components/CategoryRow.vue';
import FeaturedCarousel from '@/components/FeaturedCarousel.vue';

export default defineComponent({
  components: {
    CategoryRow,
    FeaturedCarousel,
  },
  setup() {
    const allPerformances = ref<TicketData[]>([]);
    const recommendations = ref<TicketData[]>([]);
    const recommendationType = ref<RecommendationType>('base');

    onMounted(async () => {
      const token = undefined; // TODO: auth store 연동
      const res = await fetchMainPerformances(token);

      allPerformances.value = res.allPerformances.map(mapPerformance);
      recommendations.value = res.recommendations.map(mapPerformance);
      recommendationType.value = res.recommendationType;
    });

    /** Backend DTO → Frontend TicketData */
    const mapPerformance = (item: any): TicketData => ({
      performanceId: item.mt20id ?? item.id ?? '',
      title: item.prfnm ?? item.title ?? '',
      dateStart: item.prfpdfrom ?? item.dateStart ?? '',
      dateEnd: item.prfpdto ?? item.dateEnd ?? '',
      facilityName: item.fcltynm ?? item.facilityName ?? '',
      poster: item.poster ?? item.image ?? '',
      area: item.area ?? item.region ?? '',
      genre: item.genreName ?? item.genre ?? '기타',
      state: item.prfstate ?? item.state ?? '',
      category: item.genreName ?? item.category ?? '기타',
    });

    /** 장르별 그룹화 */
    const categorizedData = computed<Record<string, TicketData[]>>(() => {
      const groups: Record<string, TicketData[]> = {};
      allPerformances.value.forEach((p) => {
        const key = p.category || '기타';
        if (!groups[key]) groups[key] = [];
        groups[key].push(p);
      });
      return groups;
    });

    /** 캐러셀 데이터 */
    const carouselData = computed(() => allPerformances.value);

    return {
      allPerformances,
      recommendations,
      recommendationType,
      categorizedData,
      carouselData,
    };
  },
});
</script>

<style scoped>
/* ...existing code... */
.recommend-list { list-style: none; padding: 0; display: flex; gap: 12px; overflow-x: auto; margin: 8px 0 20px; }
.recommend-item { width: 160px; flex-shrink: 0; }
.poster { width: 100%; height: auto; display: block; border-radius: 6px; }
.title { margin-top: 6px; font-size: 14px; }
/* ...existing code... */
</style>
