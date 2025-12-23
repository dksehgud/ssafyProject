<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter, RouterLink } from "vue-router";
import { Eye, EyeOff, ArrowLeft } from "lucide-vue-next";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import Label from "@/components/ui/Label.vue";
import Dialog from "@/components/ui/Dialog.vue";
import DialogContent from "@/components/ui/DialogContent.vue";
import DialogHeader from "@/components/ui/DialogHeader.vue";
import DialogTitle from "@/components/ui/DialogTitle.vue";
import DialogDescription from "@/components/ui/DialogDescription.vue";
import { toast } from "vue-sonner";

import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const showPassword = ref(false);
const email = ref("");
const password = ref("");

// dev 모드 확인
const isDev = computed(() => import.meta.env.DEV);

// 아이디 찾기 모달
const findEmailModal = ref(false);
const findEmailName = ref("");
const findEmailPhone = ref("");

// 비밀번호 찾기 모달
const findPasswordModal = ref(false);
const findPasswordEmail = ref("");
const findPasswordPhone = ref("");

/**
 * 로그인 처리 함수
 * @description JWT 토큰 기반 로그인
 * @param {Event} e - 폼 제출 이벤트
 *
 * @note
 * - authStore.userLogin()을 호출하여 JWT 로그인 수행
 * - 성공 시 Access Token + Refresh Token이 localStorage에 저장됨
 * - 로그인 성공 후 홈페이지로 자동 이동
 */
const handleLogin = async (e: Event) => {
  e.preventDefault();

  try {
    // JWT 로그인 수행 (userLogin은 authStore에서 정의)
    await authStore.userLogin({
      email: email.value,
      password: password.value,
    });

    // 로그인 성공 - 사용자 정보 조회 (더 이상 필요 없음: 로그인 응답에 포함됨)
    // const token = localStorage.getItem("accessToken")
    // if (token) {
    //   await authStore.getUserInfo(token)
    // }

    // 성공 알림 및 홈으로 이동
    toast.success("로그인 성공!");
    router.push("/");
  } catch (error) {
    // 로그인 실패 처리
    console.error("로그인 에러:", error);
    toast.error("로그인 실패: 이메일 또는 비밀번호를 확인해주세요.");
  }
};

const handleFindEmail = (e: Event) => {
  e.preventDefault();
  console.log("Find Email:", {
    findEmailName: findEmailName.value,
    findEmailPhone: findEmailPhone.value,
  });
  // 아이디 찾기 로직 구현
  findEmailModal.value = false;
  toast.info("아이디 찾기 요청됨");
};

const handleFindPassword = (e: Event) => {
  e.preventDefault();
  console.log("Find Password:", {
    findPasswordEmail: findPasswordEmail.value,
    findPasswordPhone: findPasswordPhone.value,
  });
  // 비밀번호 찾기 로직 구현
  findPasswordModal.value = false;
  toast.info("비밀번호 찾기 요청됨");
};

// Dev 모드 - 테스트 계정 자동 입력
const fillTestUser = () => {
  email.value = "test@test.com";
  password.value = "12341234aS*";
  toast.info("일반회원 계정 정보가 입력되었습니다.");
};
</script>

<template>
  <div class="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
    <!-- 배경 그라디언트 -->
    <div class="absolute inset-0 bg-gradient-to-b from-red-950/20 via-black to-black" />

    <!-- 배경 패턴 -->
    <div class="absolute inset-0 opacity-5">
      <div
        class="absolute inset-0"
        :style="{
          backgroundImage:
            'url(\'data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')',
        }"
      />
    </div>

    <!-- 뒤로가기 버튼 - 좌측 상단 고정 -->
    <Transition name="fade-slide" appear>
      <button
        @click="router.push('/')"
        class="fixed top-8 left-8 z-50 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center transition-all backdrop-blur-sm border border-gray-800 group"
      >
        <ArrowLeft class="h-6 w-6 text-white group-hover:-translate-x-1 transition-transform" />
      </button>
    </Transition>

    <!-- 로그인 폼 컨테이너 -->
    <Transition name="fade-up" appear>
      <div class="relative z-10 w-full max-w-md mx-4">
        <!-- 로고 -->
        <RouterLink to="/" class="flex items-center justify-center gap-2 mb-8">
          <!-- <img src="@/assets/logo.png" alt="Tget" class="h-12" /> -->
          <span class="text-3xl font-bold text-red-600">TGET</span>
        </RouterLink>

        <!-- 로그인 폼 -->
        <div class="bg-black/70 backdrop-blur-md border border-gray-800 rounded-lg p-8 shadow-2xl">
          <h2 class="text-2xl text-white mb-6 text-center">로그인</h2>

          <form @submit="handleLogin" class="space-y-5">
            <div class="space-y-2">
              <Label for="email" class="text-gray-300">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                v-model="email"
                class="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-red-600 focus:ring-red-600"
                required
              />
            </div>

            <div class="space-y-2">
              <Label for="password" class="text-gray-300">비밀번호</Label>
              <div class="relative">
                <Input
                  id="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  v-model="password"
                  class="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-red-600 focus:ring-red-600 pr-10"
                  required
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  <EyeOff v-if="showPassword" class="h-5 w-5" />
                  <Eye v-else class="h-5 w-5" />
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between text-sm">
              <label class="flex items-center gap-2 text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  class="rounded border-gray-700 bg-gray-900 text-red-600 focus:ring-red-600"
                />
                로그인 상태 유지
              </label>
            </div>

            <Button type="submit" class="w-full bg-red-600 hover:bg-red-700 text-white h-11">
              로그인
            </Button>

            <!-- Dev 모드 - 일반회원 테스트 버튼 -->
            <Button
              v-if="isDev"
              type="button"
              @click="fillTestUser"
              class="w-full bg-gray-700 hover:bg-gray-600 text-white h-11 mt-3"
            >
              일반회원
            </Button>
          </form>

          <!-- 아이디/비밀번호 찾기 -->
          <div class="flex items-center justify-center gap-4 mt-6 text-sm">
            <button
              @click="findEmailModal = true"
              class="text-gray-400 hover:text-red-600 transition-colors"
            >
              아이디 찾기
            </button>
            <Dialog :open="findEmailModal" @update:open="findEmailModal = $event">
              <DialogContent class="bg-gray-900 border-gray-800 text-white">
                <DialogHeader>
                  <DialogTitle>아이디 찾기</DialogTitle>
                  <DialogDescription class="text-gray-400">
                    가입 시 등록한 정보를 입력해주세요.
                  </DialogDescription>
                </DialogHeader>
                <form @submit="handleFindEmail" class="space-y-4 mt-4">
                  <div class="space-y-2">
                    <Label for="findEmailName">이름</Label>
                    <Input
                      id="findEmailName"
                      type="text"
                      placeholder="홍길동"
                      v-model="findEmailName"
                      class="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="findEmailPhone">전화번호</Label>
                    <Input
                      id="findEmailPhone"
                      type="tel"
                      placeholder="010-1234-5678"
                      v-model="findEmailPhone"
                      class="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>
                  <Button type="submit" class="w-full bg-red-600 hover:bg-red-700">
                    아이디 찾기
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <span class="text-gray-600">|</span>

            <button
              @click="findPasswordModal = true"
              class="text-gray-400 hover:text-red-600 transition-colors"
            >
              비밀번호 찾기
            </button>
            <Dialog :open="findPasswordModal" @update:open="findPasswordModal = $event">
              <DialogContent class="bg-gray-900 border-gray-800 text-white">
                <DialogHeader>
                  <DialogTitle>비밀번호 찾기</DialogTitle>
                  <DialogDescription class="text-gray-400">
                    가입 시 등록한 정보를 입력해주세요.
                  </DialogDescription>
                </DialogHeader>
                <form @submit="handleFindPassword" class="space-y-4 mt-4">
                  <div class="space-y-2">
                    <Label for="findPasswordEmail">이메일</Label>
                    <Input
                      id="findPasswordEmail"
                      type="email"
                      placeholder="example@email.com"
                      v-model="findPasswordEmail"
                      class="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="findPasswordPhone">전화번호</Label>
                    <Input
                      id="findPasswordPhone"
                      type="tel"
                      placeholder="010-1234-5678"
                      v-model="findPasswordPhone"
                      class="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>
                  <Button type="submit" class="w-full bg-red-600 hover:bg-red-700">
                    비밀번호 재설정
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <!-- 회원가입 링크 -->
          <div class="mt-8 text-center text-sm">
            <span class="text-gray-400">아직 회원이 아니신가요? </span>
            <RouterLink to="/signup" class="text-red-600 hover:text-red-500 transition-colors">
              회원가입
            </RouterLink>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
