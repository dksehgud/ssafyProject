<template>
  <div class="p-6">
    <!-- 헤더 -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-white">유저 관리</h1>
    </div>

    <!-- 검색 및 필터 -->
    <div class="flex gap-4 mb-6">
      <div class="flex-1">
        <input
          v-model="searchTerm"
          @input="handleSearch"
          type="text"
          placeholder="이름 또는 이메일로 검색..."
          class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
        />
      </div>

      <div class="flex gap-2">
        <select v-model="selectedRole" @change="handleFilterChange" class="filter-select">
          <option value="all">전체 권한</option>
          <option value="USER">일반</option>
          <option value="BUSNIESS">기업 사용자</option>
          <option value="ADMIN">관리자</option>
        </select>
      </div>
    </div>

    <!-- 테이블 -->
    <div v-if="isLoading" class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
    </div>
    <div v-else class="bg-gray-900 rounded-xl border border-gray-700 overflow-x-auto max-h-[600px] overflow-y-auto" @scroll="handleScroll">
      <table class="w-full">
        <thead class="bg-gray-800 sticky top-0 z-10">
          <tr class="border-b border-gray-700">
            <th class="th bg-gray-800">이름</th>
            <th class="th bg-gray-800">연락처</th>
            <th class="th bg-gray-800">권한</th>
            <th class="th bg-gray-800">예약</th>
            <th class="th bg-gray-800">총 결제</th>
            <th class="th bg-gray-800">관리</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in filteredUsers"
            :key="user.userid"
            class="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
          >
            <td class="td">
              <p class="text-white font-medium">{{ user.name }}</p>
              <p class="text-sm text-gray-400">{{ user.email }}</p>
            </td>

            <td class="td text-gray-300">{{ user.phone || '-' }}</td>

            <td class="td">
              <span
                class="px-3 py-1 rounded-full text-sm"
                :class="getRoleClass(user.role)"
              >
                {{ getRoleLabel(user.role) }}
              </span>
            </td>

            <td class="td text-white">{{ user.reservationCount || 0 }}건</td>
            <td class="td text-white">-</td>

            <td class="td">
              <div class="flex gap-2">
                <button
                  @click="openEdit(user)"
                  class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  수정
                </button>
                <button
                  @click="remove(user.userid)"
                  class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                >
                  삭제
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 로딩 인디케이터 -->
      <div v-if="isLoadingMore" class="flex justify-center py-4">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
      </div>

    </div>

    <!-- 수정 모달 -->
    <UserEditModal
      :is-open="isEditModalOpen"
      :user="selectedUser"
      @close="closeEditModal"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import UserEditModal from './UserEditModal.vue'
import adminService from '@/api/adminService'

interface User {
  userid: number
  name: string
  email: string
  phone: string
  register: string
  roleid: number
  role: string
  reservationCount: number
}

const users = ref<User[]>([])
const searchTerm = ref('')
const selectedRole = ref('all')
const isLoading = ref(true)
const isLoadingMore = ref(false)
const hasMore = ref(true)
const currentPage = ref(0)
const totalCount = ref(0)

/* 모달 상태 */
const isEditModalOpen = ref(false)
const selectedUser = ref<any>(null)

let searchTimeout: NodeJS.Timeout | null = null

/* Role 헬퍼 함수 */
const getRoleLabel = (role?: string) => {
  // role 문자열만 사용
  const upperRole = role?.toUpperCase()

  if (upperRole === 'ADMIN') return '관리자'
  if (upperRole === 'BUSINESS' || upperRole === 'BUSNIESS') return '기업 사용자'
  if (upperRole === 'USER') return '일반'

  // role이 없으면 일반으로 표시
  return '일반'
}

const getRoleClass = (role?: string) => {
  // role 문자열만 사용
  const upperRole = role?.toUpperCase()

  if (upperRole === 'ADMIN') return 'bg-red-600/20 text-red-400'
  if (upperRole === 'BUSINESS' || upperRole === 'BUSNIESS') return 'bg-purple-600/20 text-purple-400'
  if (upperRole === 'USER') return 'bg-gray-600/20 text-gray-400'

  // role이 없으면 회색
  return 'bg-gray-600/20 text-gray-400'
}

/* 유저 목록 로드 */
const loadUsers = async (reset = false) => {
  if (reset) {
    currentPage.value = 0
    users.value = []
    hasMore.value = true
  }

  if (!hasMore.value && !reset) return

  try {
    if (reset) {
      isLoading.value = true
    } else {
      isLoadingMore.value = true
    }

    const params: any = {
      page: currentPage.value,
      size: 20
    }

    if (searchTerm.value) {
      params.search = searchTerm.value
    }

    if (selectedRole.value !== 'all') {
      params.role = selectedRole.value
    }

    const response = await adminService.getAdminUsers(params)
    const newUsers = response.data.users || []

    console.log('=== 유저 관리 디버깅 ===')
    console.log('백엔드 응답:', response.data)
    console.log('유저 목록:', newUsers)

    if (newUsers.length > 0) {
      console.log('\n첫 번째 유저 상세:')
      console.log('  - name:', newUsers[0].name)
      console.log('  - roleid:', newUsers[0].roleid, '(타입:', typeof newUsers[0].roleid, ')')
      console.log('  - role:', newUsers[0].role, '(타입:', typeof newUsers[0].role, ')')

      console.log('\n전체 유저 role 정보:')
      console.table(newUsers.map((u: any) => ({
        name: u.name,
        roleid: u.roleid,
        role: u.role,
        display: getRoleLabel(u.role)
      })))
    }
    console.log('======================\n')

    if (reset) {
      users.value = newUsers
    } else {
      users.value = [...users.value, ...newUsers]
    }

    totalCount.value = response.data.totalCount || 0
    hasMore.value = users.value.length < totalCount.value

    currentPage.value++
  } catch (error) {
    console.error('유저 목록 로드 실패:', error)
    toast.error('유저 목록을 불러오는데 실패했습니다')
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

/* 검색 핸들러 */
const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    loadUsers(true)
  }, 500)
}

/* 필터 변경 핸들러 */
const handleFilterChange = () => {
  loadUsers(true)
}

/* 무한 스크롤 */
const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement
  const scrollTop = target.scrollTop
  const scrollHeight = target.scrollHeight
  const clientHeight = target.clientHeight

  if (scrollTop + clientHeight >= scrollHeight - 100 && !isLoadingMore.value && hasMore.value) {
    loadUsers()
  }
}

const filteredUsers = computed(() => users.value)

const openEdit = (user: User) => {
  selectedUser.value = user
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
  selectedUser.value = null
}

const handleSave = async (data: any) => {
  try {
    await adminService.updateUser(data.userid, {
      name: data.name,
      email: data.email,
      phone: data.phone,
      roleid: data.roleid
    })
    toast.success('유저 정보가 수정되었습니다')
    closeEditModal()
    await loadUsers(true)
  } catch (error) {
    console.error('수정 실패:', error)
    toast.error('수정에 실패했습니다')
  }
}

const remove = async (userid: number) => {
  if (!confirm('정말 삭제하시겠습니까?')) return

  try {
    await adminService.deleteUser(String(userid))
    toast.success('유저가 삭제되었습니다')
    await loadUsers(true)
  } catch (error) {
    console.error('삭제 실패:', error)
    toast.error('삭제에 실패했습니다')
  }
}

onMounted(() => {
  loadUsers(true)
})
</script>

<style scoped>
.th {
  padding: 1rem 1.5rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgb(156 163 175);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.td {
  padding: 1rem 1.5rem;
  white-space: nowrap;
}

.filter-select {
  padding: 0.75rem 1rem;
  background-color: rgb(17 24 39);
  border: 1px solid rgb(55 65 81);
  border-radius: 0.5rem;
  color: white;
}

.filter-select:focus {
  outline: none;
  border-color: rgb(220 38 38);
}
</style>
