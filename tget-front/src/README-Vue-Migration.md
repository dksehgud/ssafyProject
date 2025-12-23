# Vue.js 마이그레이션 가이드

## 📋 개요
이 프로젝트는 React에서 Vue.js로 마이그레이션할 수 있도록 Tailwind CSS v3.4를 사용하도록 설정되었습니다.

## 🔧 생성된 설정 파일

### 1. `tailwind.config.js`
- **Tailwind CSS v3.4** 설정 파일
- Vue.js 파일 경로 포함 (`.vue` 확장자)
- 모든 커스텀 색상, 테마, 애니메이션 설정 포함
- ShadCN 스타일 디자인 시스템 유지

### 2. `postcss.config.js`
- PostCSS 설정
- Tailwind CSS와 Autoprefixer 플러그인 포함

### 3. `package.json`
- Vue.js 3.4+ 의존성
- Vue Router 4.2+
- Tailwind CSS 3.4+
- 필요한 모든 유틸리티 라이브러리

### 4. `vite.config.js`
- Vite + Vue 플러그인 설정
- 경로 별칭 (alias) 설정
- PostCSS 통합

### 5. `styles/globals.css`
- Tailwind v4 → v3 호환 형식으로 변경
- `@theme inline` → 표준 CSS 변수로 변경
- HSL 색상 형식 사용 (Vue.js와 완벽 호환)
- 기존 디자인 시스템 완전 유지

## 🚀 Vue.js 프로젝트 설정 방법

### 1. 새 Vue 프로젝트 생성
```bash
npm create vue@latest
# 또는
npm create vite@latest my-tget-app -- --template vue
```

### 2. 의존성 설치
```bash
cd my-tget-app
npm install
```

### 3. Tailwind CSS 설치
```bash
npm install -D tailwindcss@^3.4.1 postcss autoprefixer tailwindcss-animate
npx tailwindcss init -p
```

### 4. 필요한 라이브러리 설치
```bash
# 기본 라이브러리
npm install vue-router@^4.2.5 date-fns@^3.0.0

# 아이콘 (Lucide Vue)
npm install lucide-vue-next

# 유틸리티
npm install @vueuse/core

# 애니메이션 (Motion for Vue)
npm install @vueuse/motion
```

### 5. 설정 파일 복사
이 프로젝트의 다음 파일들을 새 Vue 프로젝트에 복사:
- `tailwind.config.js`
- `postcss.config.js`
- `vite.config.js` (필요시 병합)
- `styles/globals.css` → Vue 프로젝트의 `src/styles/globals.css`

### 6. main.js/main.ts 수정
```javascript
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/globals.css'  // Tailwind CSS import

const app = createApp(App)
app.use(router)
app.mount('#app')
```

## 📦 컴포넌트 마이그레이션 가이드

### React → Vue 변환 예시

#### React 컴포넌트:
```jsx
import { useState } from 'react'
import { Button } from './components/ui/button'

export function MyComponent() {
  const [count, setCount] = useState(0)
  
  return (
    <div className="p-4 bg-black text-white">
      <h1 className="text-2xl font-medium">Count: {count}</h1>
      <Button onClick={() => setCount(count + 1)}>
        Increment
      </Button>
    </div>
  )
}
```

#### Vue 컴포넌트:
```vue
<script setup>
import { ref } from 'vue'
import Button from '@/components/ui/button.vue'

const count = ref(0)
</script>

<template>
  <div class="p-4 bg-black text-white">
    <h1 class="text-2xl font-medium">Count: {{ count }}</h1>
    <Button @click="count++">
      Increment
    </Button>
  </div>
</template>
```

### Motion/React → VueUse Motion 변환

#### React (Motion):
```jsx
import { motion } from 'motion/react'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

#### Vue (VueUse Motion):
```vue
<script setup>
import { useMotion } from '@vueuse/motion'
import { ref } from 'vue'

const target = ref()

useMotion(target, {
  initial: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0, transition: { duration: 500 } }
})
</script>

<template>
  <div ref="target">
    Content
  </div>
</template>
```

### Lucide React → Lucide Vue 변환

#### React:
```jsx
import { ChevronLeft, ChevronRight } from 'lucide-react'

<ChevronLeft className="w-8 h-8" />
```

#### Vue:
```vue
<script setup>
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
</script>

<template>
  <ChevronLeft class="w-8 h-8" />
</template>
```

## 🎨 Tailwind 클래스 사용법

모든 Tailwind 클래스는 동일하게 사용 가능합니다:
- ✅ `bg-black`, `text-white`, `p-4`, `rounded-xl`
- ✅ `hover:bg-red-700`, `group-hover:opacity-100`
- ✅ `transition-all`, `duration-300`
- ✅ `lg:col-span-2`, `md:flex`
- ✅ 모든 커스텀 색상: `bg-sidebar`, `text-muted-foreground`

## 📱 프로젝트 구조 (권장)

```
my-tget-app/
├── public/
├── src/
│   ├── assets/          # 이미지, 폰트 등
│   ├── components/
│   │   ├── ui/          # ShadCN 스타일 기본 컴포넌트
│   │   ├── CategoryRow.vue
│   │   ├── Header.vue
│   │   ├── MapModal.vue
│   │   └── ...
│   ├── pages/
│   │   ├── HomePage.vue
│   │   ├── LoginPage.vue
│   │   └── ...
│   ├── data/
│   │   └── ticketData.js
│   ├── utils/
│   │   └── seatDataGenerator.js
│   ├── styles/
│   │   └── globals.css
│   ├── router/
│   │   └── index.js
│   ├── App.vue
│   └── main.js
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── package.json
```

## 🔑 주요 차이점

### 1. 상태 관리
- **React**: `useState`, `useEffect`
- **Vue**: `ref`, `reactive`, `computed`, `watch`

### 2. 이벤트 처리
- **React**: `onClick`, `onChange`
- **Vue**: `@click`, `@change`

### 3. 조건부 렌더링
- **React**: `{condition && <div>...</div>}`
- **Vue**: `<div v-if="condition">...</div>`

### 4. 리스트 렌더링
- **React**: `items.map(item => <div key={item.id}>...)</div>)`
- **Vue**: `<div v-for="item in items" :key="item.id">...</div>`

### 5. Props
- **React**: `function Component({ title, onClick })`
- **Vue**: `defineProps<{ title: string, onClick: Function }>()`

## ✅ 체크리스트

마이그레이션 전 확인사항:
- [ ] Node.js 18+ 설치됨
- [ ] Vue 3.4+ 프로젝트 생성됨
- [ ] Tailwind CSS 3.4+ 설치됨
- [ ] 설정 파일 복사 완료
- [ ] 의존성 설치 완료
- [ ] `globals.css` import 확인
- [ ] 라우터 설정 완료
- [ ] 컴포넌트 변환 시작

## 📚 참고 문서

- [Vue.js 공식 문서](https://vuejs.org/)
- [Vue Router 공식 문서](https://router.vuejs.org/)
- [Tailwind CSS 공식 문서](https://tailwindcss.com/)
- [VueUse Motion](https://motion.vueuse.org/)
- [Lucide Vue](https://lucide.dev/guide/packages/lucide-vue-next)
- [VueUse](https://vueuse.org/)

## 💡 팁

1. **점진적 마이그레이션**: 한 번에 하나의 페이지/컴포넌트씩 변환
2. **TypeScript 사용**: Vue 3는 TypeScript와 완벽하게 통합됨
3. **Composition API 사용**: `<script setup>` 문법 권장
4. **Vue DevTools 설치**: 디버깅에 필수
5. **Vite 활용**: 빠른 개발 서버와 HMR 제공

## 🎯 다음 단계

1. Vue 프로젝트 생성
2. 설정 파일 복사 및 의존성 설치
3. 레이아웃 컴포넌트부터 변환 시작 (Header, Footer 등)
4. 페이지 컴포넌트 변환 (HomePage, LoginPage 등)
5. 복잡한 인터랙션 컴포넌트 변환 (MapModal, SeatSelectionModal 등)
6. 테스트 및 최적화

---

**준비 완료!** 🚀 Vue.js로 완벽하게 마이그레이션할 수 있는 모든 설정이 준비되었습니다!
