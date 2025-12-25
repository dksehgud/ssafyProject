/**
 * 관리자 API 서비스
 * @description 관리자 페이지에서 사용하는 API 호출 함수들
 */

import api from './axios'

const adminApi = api

/**
 * ===========================
 * 대시보드 통계 API
 * ===========================
 */

/**
 * 전체 통계 조회
 * @returns {Promise} 통계 데이터
 */
export const getAdminStats = async () => {
  try {
    const response = await adminApi.get('/api/admin/stats')
    return response.data
  } catch (error) {
    console.error('통계 조회 실패:', error)
    throw error
  }
}

/**
 * 카테고리별 공연 통계
 * @returns {Promise} 카테고리별 공연 수
 */
export const getCategoryStats = async () => {
  try {
    const response = await adminApi.get('/api/admin/stats/categories')
    return response.data
  } catch (error) {
    console.error('카테고리별 통계 조회 실패:', error)
    throw error
  }
}

/**
 * 지역별 공연 통계
 * @returns {Promise} 지역별 공연 수
 */
export const getRegionStats = async () => {
  try {
    const response = await adminApi.get('/api/admin/stats/regions')
    return response.data
  } catch (error) {
    console.error('지역별 통계 조회 실패:', error)
    throw error
  }
}

/**
 * ===========================
 * 공연 관리 API
 * ===========================
 */

/**
 * 전체 공연 목록 조회 (관리자용)
 * @param {Object} params - 검색 파라미터 (검색어, 카테고리, 페이지 등)
 * @returns {Promise} 공연 목록
 */
export const getAdminPerformances = async (params = {}) => {
  try {
    const response = await adminApi.get('/api/admin/performances', { params })
    return response.data
  } catch (error) {
    console.error('공연 목록 조회 실패:', error)
    throw error
  }
}

/**
 * 공연 상세 조회 (관리자용)
 * @param {string} performanceId - 공연 ID
 * @returns {Promise} 공연 상세 정보
 */
export const getAdminPerformanceDetail = async (performanceId) => {
  try {
    const response = await adminApi.get(`/api/admin/performances/${performanceId}`)
    return response.data
  } catch (error) {
    console.error('공연 상세 조회 실패:', error)
    throw error
  }
}

/**
 * 공연 등록
 * @param {Object} performanceData - 공연 데이터
 * @returns {Promise} 등록된 공연 정보
 */
export const createPerformance = async (performanceData) => {
  try {
    const response = await adminApi.post('/admin/performances', performanceData)
    return response.data
  } catch (error) {
    console.error('공연 등록 실패:', error)
    throw error
  }
}

/**
 * 공연 수정
 * @param {string} performanceId - 공연 ID
 * @param {Object} performanceData - 수정할 공연 데이터
 * @returns {Promise} 수정된 공연 정보
 */
export const updatePerformance = async (performanceId, performanceData) => {
  try {
    const response = await adminApi.put(`/api/admin/performances/${performanceId}`, performanceData)
    return response.data
  } catch (error) {
    console.error('공연 수정 실패:', error)
    throw error
  }
}

/**
 * 공연 삭제장
 * @param {string} performanceId - 공연 ID
 * @returns {Promise} 삭제 결과
 */
export const deletePerformance = async (performanceId) => {
  try {
    const response = await adminApi.delete(`/api/admin/performances/${performanceId}`)
    return response.data
  } catch (error) {
    console.error('공연 삭제 실패:', error)
    throw error
  }
}

/**
 * 최근 등록 공연 조회
 * @param {number} limit - 조회 개수 (기본값: 5)
 * @returns {Promise} 최근 공연 목록
 */
export const getRecentPerformances = async (limit = 5) => {
  try {
    const response = await adminApi.get('/api/admin/performances/recent', {
      params: { limit }
    })
    return response.data
  } catch (error) {
    console.error('최근 공연 조회 실패:', error)
    throw error
  }
}

/**
 * ===========================
 * 공연장 관리 API
 * ===========================
 */

/**
 * 전체 공연장 목록 조회 (관리자용)
 * @param {Object} params - 검색 파라미터
 * @returns {Promise} 공연장 목록
 */
export const getAdminVenues = async (params = {}) => {
  try {
    const response = await adminApi.get('/api/admin/venues', { params })
    return response.data
  } catch (error) {
    console.error('공연장 목록 조회 실패:', error)
    throw error
  }
}

/**
 * 공연장 상세 조회 (관리자용)
 * @param {string} venueId - 공연장 ID
 * @returns {Promise} 공연장 상세 정보
 */
export const getAdminVenueDetail = async (venueId) => {
  try {
    const response = await adminApi.get(`/api/admin/venues/${venueId}`)
    return response.data
  } catch (error) {
    console.error('공연장 상세 조회 실패:', error)
    throw error
  }
}

/**
 * 공연장 등록
 * @param {Object} venueData - 공연장 데이터
 * @returns {Promise} 등록된 공연장 정보
 */
export const createVenue = async (venueData) => {
  try {
    const response = await adminApi.post('/api/admin/venues', venueData)
    return response.data
  } catch (error) {
    console.error('공연장 등록 실패:', error)
    throw error
  }
}

/**
 * 공연장 수정
 * @param {string} venueId - 공연장 ID
 * @param {Object} venueData - 수정할 공연장 데이터
 * @returns {Promise} 수정된 공연장 정보
 */
export const updateVenue = async (venueId, venueData) => {
  try {
    const response = await adminApi.put(`/api/admin/venues/${venueId}`, venueData)
    return response.data
  } catch (error) {
    console.error('공연장 수정 실패:', error)
    throw error
  }
}

/**
 * 공연장 삭제
 * @param {string} venueId - 공연장 ID
 * @returns {Promise} 삭제 결과
 */
export const deleteVenue = async (venueId) => {
  try {
    const response = await adminApi.delete(`/api/admin/venues/${venueId}`)
    return response.data
  } catch (error) {
    console.error('공연장 삭제 실패:', error)
    throw error
  }
}

/**
 * ===========================
 * 유저 관리 API
 * ===========================
 */

/**
 * 전체 유저 목록 조회 (관리자용)
 * @param {Object} params - 검색 파라미터
 * @returns {Promise} 유저 목록
 */
export const getAdminUsers = async (params = {}) => {
  try {
    const response = await adminApi.get('/api/admin/users', { params })
    return response.data
  } catch (error) {
    console.error('유저 목록 조회 실패:', error)
    throw error
  }
}

/**
 * 유저 상세 조회 (관리자용)
 * @param {number} userId - 유저 ID
 * @returns {Promise} 유저 상세 정보
 */
export const getAdminUserDetail = async (userId) => {
  try {
    const response = await adminApi.get(`/api/admin/users/${userId}`)
    return response.data
  } catch (error) {
    console.error('유저 상세 조회 실패:', error)
    throw error
  }
}

/**
 * 유저 권한 수정
 * @param {string} userId - 유저 ID
 * @param {string} roleType - 권한 타입 (USER, BUSINESS, ADMIN)
 * @returns {Promise} 수정 결과
 */
export const updateUserRole = async (userId, roleType) => {
  try {
    const response = await adminApi.patch(`/admin/users/${userId}/role`, { roleType })
    return response.data
  } catch (error) {
    console.error('유저 권한 수정 실패:', error)
    throw error
  }
}

/**
 * 유저 상태 변경 (활성/정지)
 * @param {string} userId - 유저 ID
 * @param {string} status - 상태 (ACTIVE, SUSPENDED)
 * @returns {Promise} 변경 결과
 */
export const updateUserStatus = async (userId, status) => {
  try {
    const response = await adminApi.patch(`/admin/users/${userId}/status`, { status })
    return response.data
  } catch (error) {
    console.error('유저 상태 변경 실패:', error)
    throw error
  }
}

/**
 * 유저 삭제
 * @param {string} userId - 유저 ID
 * @returns {Promise} 삭제 결과
 */
export const deleteUser = async (userId) => {
  try {
    const response = await adminApi.delete(`/admin/users/${userId}`)
    return response.data
  } catch (error) {
    console.error('유저 삭제 실패:', error)
    throw error
  }
}

/**
 * ===========================
 * 예약 관리 API
 * ===========================
 */

/**
 * 전체 예약 목록 조회 (관리자용)
 * @param {Object} params - 검색 파라미터
 * @returns {Promise} 예약 목록
 */
export const getAdminReservations = async (params = {}) => {
  try {
    const response = await adminApi.get('/admin/reservations', { params })
    return response.data
  } catch (error) {
    console.error('예약 목록 조회 실패:', error)
    throw error
  }
}

/**
 * 예약 상세 조회 (관리자용)
 * @param {string} reservationId - 예약 ID
 * @returns {Promise} 예약 상세 정보
 */
export const getAdminReservationDetail = async (reservationId) => {
  try {
    const response = await adminApi.get(`/admin/reservations/${reservationId}`)
    return response.data
  } catch (error) {
    console.error('예약 상세 조회 실패:', error)
    throw error
  }
}

/**
 * 예약 강제 취소 (관리자용)
 * @param {string} reservationId - 예약 ID
 * @param {string} reason - 취소 사유
 * @returns {Promise} 취소 결과
 */
export const cancelReservationByAdmin = async (reservationId, reason) => {
  try {
    const response = await adminApi.post(`/admin/reservations/${reservationId}/cancel`, { reason })
    return response.data
  } catch (error) {
    console.error('예약 취소 실패:', error)
    throw error
  }
}

export const adminService = {
  // 대시보드
  getAdminStats,
  getCategoryStats,
  getRegionStats,
  getRecentPerformances,

  // 공연 관리
  getAdminPerformances,
  getAdminPerformanceDetail,
  createPerformance,
  updatePerformance,
  deletePerformance,

  // 공연장 관리
  getAdminVenues,
  getAdminVenueDetail,
  createVenue,
  updateVenue,
  deleteVenue,

  // 유저 관리
  getAdminUsers,
  getAdminUserDetail,
  updateUser: (userId, data) => api.put(`/api/admin/users/${userId}`, data),
  updateUserRole,
  updateUserStatus,
  deleteUser,

  // 예약 관리
  getAdminReservations,
  getAdminReservationDetail,
  cancelReservationByAdmin,
}

export default adminService

