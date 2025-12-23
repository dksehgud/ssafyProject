import axios from './axios'

const QUEUE_URL = '/queue'

export const queueService = {
    /**
     * 대기열 진입 (토큰 발급 요청)
     * @param {string} performanceId
     * @param {number} scheduleId (optional for now, but good to have)
     */
    async checkQueue(performanceId, scheduleId) {
        const response = await axios.post(`${QUEUE_URL}/check`, {
            performanceId,
            scheduleId: scheduleId || 1 // Default to 1 if not provided, or handle as needed
        })
        return response.data
    },

    /**
     * 토큰 상태 조회
     * @param {string} token
     * @param {string} performanceId
     */
    async getQueueStatus(token, performanceId) {
        // GET request usually doesn't have body, pass params or headers if needed
        // Backend QueueController expects PathVariable token
        // And Header "performanceId" (from our test script experience)
        const response = await axios.get(`${QUEUE_URL}/status/${token}`, {
            headers: {
                performanceId: performanceId
            }
        })
        return response.data
    },

    /**
     * 토큰 활성화 (필요한 경우)
     */
    async activateToken(token, performanceId, scheduleId) {
        const response = await axios.post(`${QUEUE_URL}/activate`, {
            token,
            performanceId,
            scheduleId
        })
        return response.data
    },

    /**
     * Heartbeat (세션 유지)
     */
    async sendHeartbeat(performanceId, scheduleId) {
        const response = await axios.post(`${QUEUE_URL}/heartbeat`, {
            performanceId,
            scheduleId
        })
        return response.data
    }
}
