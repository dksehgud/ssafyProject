export interface Performance {
  mt20id: string;
  prfnm: string;
  poster?: string;
  // 필요한 다른 필드들(예: genre, place 등)을 여기에 추가하세요.
  [key: string]: any;
}

export type RecommendationType = 'base' | 'personalized';

export interface PagePerformanceResponse {
  allPerformances: Performance[];
  recommendations: Performance[]; // AI 추천 10개
  recommendationType: RecommendationType;
}
