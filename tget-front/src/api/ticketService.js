import { localAxios } from "@/util/http-commons";

const api = localAxios();

export const ticketService = {
  async getTickets(params, token) {
    // params can include category, area, etc.
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.get("/performances/main", { params, headers });
    return response.data;
  },

  async getTicketById(id) {
    // response = await api.get(`/tickets/${id}`)
    const response = await api.get(`/performances/${id}`);
    return response.data;
  },

  async searchTickets(query) {
    // const response = await api.get('/tickets/search', { params: { q: query } })
    const response = await api.get("/performances/search", { params: { q: query } });
    return response.data;
  },

  async getFeaturedTickets() {
    // const response = await api.get('/tickets/featured')
    const response = await api.get("/performances/featured");
    return response.data;
  },

  // 대기열 조회 추가
  async getQueueInfo(performanceId) {
    const response = await api.get(`/performances/${performanceId}/queue`);
    return response.data;
  },

  // 지역별 공연장 조회
  async getVenuesByRegion(region, genreId) {
    // 쿼리 파라미터 객체
    const params = {
      region: region,
      genreId: genreId,
    };

    // API 요청
    const response = await api.get(`/api/venues/region`, { params });
    return response.data;
  },

  // 공연장 상세 정보 조회
  async getVenueDetail(venueId, genreId, region) {
    // 쿼리 파라미터 객체
    const params = {
      genreId: genreId,
      region: region,
    };

    // API 요청: /api/venues/detail/{venueId}
    const response = await api.get(`/api/venues/detail/${venueId}`, { params });
    return response.data;
  },

  // 공연 상세 - 추천 공연 조회
  async getRecommendations(performanceId, token) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.get(`/performances/${performanceId}/recommendations`, { headers });
    return response.data;
  },
};
