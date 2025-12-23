/**
 * 애플리케이션 진입점 (Entry Point)
 * @description Vue 애플리케이션 초기화 및 설정
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'  // Pinia 상태 지속성 플러그인
import './index.css'
import App from './App.vue'
import router from './router'

/**
 * Vue 애플리케이션 생성
 */
const app = createApp(App)

/**
 * Pinia 스토어 생성 및 플러그인 설정
 * @description
 * - pinia-plugin-persistedstate: Pinia 상태를 localStorage에 자동 저장
 * - 페이지 새로고침 시에도 상태 유지 (선택적 기능)
 * 
 * @note 현재는 authStore에서 수동으로 localStorage 관리하므로
 *       필요에 따라 플러그인 사용을 선택할 수 있습니다.
 */
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

/**
 * 플러그인 등록
 */
app.use(pinia)
app.use(router)

app.mount('#root')
