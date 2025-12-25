<script setup lang="ts">
import Header from "@/components/Header.vue";
import SplashScreen from "@/components/SplashScreen.vue";
import { computed, ref } from "vue";
import { RouterView, useRoute } from "vue-router";
import { Toaster } from "vue-sonner";
//import { AnimatePresence, Motion } from '@vueuse/motion' // Actually we might not need this if we use v-if/transition

const route = useRoute();
const showSplash = ref(true);
const selectedCategory = ref<string | null>(null);

const isAuthPage = computed(() => route.path === "/login" || route.path === "/signup");
const isDetailPage = computed(() => route.path.startsWith("/ticket/"));
const isPerformancePage = computed(() => route.path.startsWith("/performance-"));
const isAdminPage = computed(() => route.path.startsWith("/admin"));
const skipSplash = computed(
  () => isAuthPage.value || isDetailPage.value || isPerformancePage.value || isAdminPage.value
);

const handleSplashComplete = () => {
  showSplash.value = false;
};

const handleCategorySelect = (category: string | null) => {
  selectedCategory.value = category;
};
</script>

<template>
  <div class="min-h-screen bg-black text-white">
    <!-- Splash Screen -->
    <Transition name="fade">
      <SplashScreen v-if="showSplash && !skipSplash" @complete="handleSplashComplete" />
    </Transition>

    <!-- Main Content -->
    <Transition name="fade">
      <div v-if="!showSplash || skipSplash">
        <Header
          v-if="!isAuthPage && !isAdminPage"
          :selectedCategory="selectedCategory"
          @categorySelect="handleCategorySelect"
        />

        <RouterView v-slot="{ Component }">
          <component :is="Component" :selectedCategory="selectedCategory" />
        </RouterView>
      </div>
    </Transition>

    <Toaster
      position="top-center"
      theme="dark"
      :toastOptions="{
        style: {
          background: '#1f1f1f',
          color: '#fff',
          border: '1px solid #333',
        },
      }"
    />
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
