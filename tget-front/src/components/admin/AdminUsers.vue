<template>
  <div class="space-y-6">
    <!-- 헤더 -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl text-white mb-2">유저 관리</h2>
        <p class="text-gray-400">총 {{ filteredUsers.length }}명의 유저</p>
      </div>
      <button
        @click="openAdd"
        class="bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg text-white flex gap-2"
      >
        <Plus class="w-5 h-5" /> 유저 추가
      </button>
    </div>

    <!-- 검색 / 필터 -->
    <div class="flex flex-col lg:flex-row gap-4">
      <div class="flex-1 relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          v-model="searchTerm"
          placeholder="이름 또는 이메일 검색..."
          class="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
        />
      </div>

      <div class="flex gap-2">
        <select v-model="selectedStatus" class="filter-select">
          <option value="all">전체 상태</option>
          <option value="active">활성</option>
          <option value="suspended">정지</option>
        </select>
        <select v-model="selectedRole" class="filter-select">
          <option value="all">전체 권한</option>
          <option value="user">일반</option>
          <option value="admin">관리자</option>
        </select>
      </div>
    </div>

    <!-- 테이블 -->
    <div class="bg-gray-900 rounded-xl border border-gray-700 overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-800/50">
          <tr class="border-b border-gray-700">
            <th class="th">이름</th>
            <th class="th">연락처</th>
            <th class="th">가입일</th>
            <th class="th">권한</th>
            <th class="th">상태</th>
            <th class="th">예약</th>
            <th class="th">총 결제</th>
            <th class="th">관리</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(user, index) in filteredUsers"
            :key="user.id"
            class="border-b border-gray-800 hover:bg-gray-800/50 transition-colors animate-fade-in"
            :style="{ animationDelay: `${index * 30}ms` }"
          >
            <td class="td">
              <p class="text-white">{{ user.name }}</p>
              <p class="text-sm text-gray-400">{{ user.email }}</p>
            </td>

            <td class="td text-gray-300">{{ user.phone }}</td>
            <td class="td text-gray-400">{{ user.joinDate }}</td>

            <td class="td">
              <span
                class="px-3 py-1 rounded-full text-sm"
                :class="user.role === 'admin'
                  ? 'bg-purple-600/20 text-purple-400'
                  : 'bg-gray-600/20 text-gray-400'"
              >
                {{ user.role === 'admin' ? '관리자' : '일반' }}
              </span>
            </td>

            <td class="td">
              <button
                @click="toggleStatus(user.id)"
                class="px-3 py-1 rounded-full text-sm"
                :class="user.status === 'active'
                  ? 'bg-green-600/20 text-green-400'
                  : 'bg-red-600/20 text-red-400'"
              >
                {{ user.status === 'active' ? '활성' : '정지' }}
              </button>
            </td>

            <td class="td text-white">{{ user.reservationCount }}건</td>
            <td class="td text-white">₩{{ user.totalSpent.toLocaleString() }}</td>

            <td class="td">
              <div class="flex gap-2">
                <button @click="openEdit(user)" class="icon-btn bg-blue-600">
                  <Edit class="w-4 h-4" />
                </button>
                <button @click="remove(user.id)" class="icon-btn bg-red-600">
                  <Trash2 class="w-4 h-4" />
                </button>
                </div>
              </td>
            </tr>
          </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Search, Edit, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

interface User {
  id: string
  name: string
  email: string
  phone: string
  joinDate: string
  role: 'user' | 'admin'
  status: 'active' | 'suspended'
  reservationCount: number
  totalSpent: number
}

const users = ref<User[]>([
  {
    id: 'u1',
    name: '김철수',
    email: 'kim@example.com',
    phone: '010-1234-5678',
    joinDate: '2024.01.15',
    role: 'user',
    status: 'active',
    reservationCount: 5,
    totalSpent: 450000,
  },
])

const searchTerm = ref('')
const selectedStatus = ref('all')
const selectedRole = ref('all')

const filteredUsers = computed(() =>
  users.value.filter(u => {
    const search =
      u.name.includes(searchTerm.value) ||
      u.email.includes(searchTerm.value)
    const status =
      selectedStatus.value === 'all' || u.status === selectedStatus.value
    const role =
      selectedRole.value === 'all' || u.role === selectedRole.value
    return search && status && role
  }),
)

const toggleStatus = (id: string) => {
  users.value = users.value.map(u =>
    u.id === id
      ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' }
      : u,
  )
}

const openAdd = () => {}
const openEdit = (_user: User) => {}
const remove = (id: string) => {
  users.value = users.value.filter(u => u.id !== id)
  toast.success('유저가 삭제되었습니다')
}
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out forwards;
}

.th { @apply text-left text-gray-400 p-4; }
.td { @apply p-4; }
.filter-select {
  @apply px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white;
}
.icon-btn {
  @apply p-2 rounded-lg text-white;
}
</style>
