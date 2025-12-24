import { localAxios } from "@/util/http-commons";

const api = localAxios();

export const bookingService = {
    /**
     * 공연 예매 요청
     * @param {Object} bookingData
     * @param {string} bookingData.performanceId
     * @param {number} bookingData.scheduleId
     * @param {Array} bookingData.seats - [{ section, row, number, price }]
     * @param {string} bookingData.token - Queue token
     */
    async bookTicket(bookingData) {
        // 헤더에 대기열 토큰 추가 (필요한 경우)
        const headers = {};
        if (bookingData.token) {
            headers['Queue-Token'] = bookingData.token;
        }

        // Authorization 헤더 추가
        const token = localStorage.getItem('accessToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await api.post('/reservations', bookingData, { headers });
        return response.data;
    },

    async getMyReservations() {
        // Authorization 헤더 추가
        const headers = {};
        const token = localStorage.getItem('accessToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await api.get('/reservations/my', { headers });
        return response.data;
    },

    async cancelReservation(reservationId) {
        // Authorization 헤더 추가
        const headers = {};
        const token = localStorage.getItem('accessToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await api.delete(`/reservations/${reservationId}`, { headers });
        return response.data;
    }
};
