export const BASE_QUEUE_DURATION = 1000; // 대기자 1명일 때 기본 3초
export const ADDITIONAL_DURATION_PER_PERSON = 1000; // 추가 대기자당 +1초

export const calculateQueueDuration = (queueNumber: number): number => {
  if (queueNumber === 0) return 0;
  if (queueNumber === 1) return BASE_QUEUE_DURATION;
  return BASE_QUEUE_DURATION + (queueNumber - 1) * ADDITIONAL_DURATION_PER_PERSON;
};
