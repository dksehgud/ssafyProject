import { localAxios } from "@/util/http-commons"

const api = localAxios()

export const performanceService = {
    /**
     * 기업회원이 등록한 공연 목록 조회
     */
    async getMyPerformances(params) {
        const token = localStorage.getItem('accessToken')
        const response = await api.get('/performances/my', { 
            params,
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        return response.data
    },

    /**
     * 공연 상세 조회
     */
    async getPerformanceById(id) {
        const response = await api.get(`/performances/${id}`)
        return response.data
    },

    /**
     * 공연 등록
     */
    async createPerformance(performanceData) {
        const response = await api.post('/performances', performanceData)
        return response.data
    },

    /**
     * 공연 수정
     */
    async updatePerformance(id, performanceData) {
        const response = await api.put(`/performances/${id}`, performanceData)
        return response.data
    },

    /**
     * 공연 삭제
     */
    async deletePerformance(id) {
        const token = localStorage.getItem('accessToken')
        const response = await api.delete(`/performances/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        return response.data
    },

    /**
     * 공연 일괄 삭제
     */
    async deletePerformances(ids) {
        const response = await api.post('/performances/delete-batch', { ids })
        return response.data
    }
}
