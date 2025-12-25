# 관리자 API 명세서

## 📋 개요

TGet 관리자 페이지에서 사용하는 백엔드 API 명세서입니다.

**Base URL**: `/api/admin`

**인증**: 모든 요청에 JWT 토큰 필요 (ADMIN 권한 필수)

**공통 헤더**:
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

---

## 🎯 1. 대시보드 통계 API

### 1.1 전체 통계 조회

**Endpoint**: `GET /admin/stats`

**설명**: 관리자 대시보드에 표시할 전체 통계 데이터 조회

**Response**:
```json
{
  "success": true,
  "data": {
    "totalPerformances": 52,
    "totalVenues": 35,
    "totalUsers": 1247,
    "totalReservations": 3429,
    "todayReservations": 47,
    "revenue": {
      "today": 2450000,
      "thisMonth": 58920000,
      "growth": "+12.5%"
    }
  }
}
```

### 1.2 카테고리별 공연 통계

**Endpoint**: `GET /admin/stats/categories`

**설명**: 카테고리별 공연 수 및 비율

**Response**:
```json
{
  "success": true,
  "data": {
    "콘서트": 18,
    "뮤지컬": 15,
    "연극": 12,
    "클래식": 7
  }
}
```

### 1.3 지역별 공연 통계

**Endpoint**: `GET /admin/stats/regions`

**설명**: 지역별 공연 수 및 비율

**Response**:
```json
{
  "success": true,
  "data": {
    "서울": 28,
    "경기": 12,
    "부산": 6,
    "대구": 4,
    "인천": 2
  }
}
```

---

## 🎭 2. 공연 관리 API

### 2.1 전체 공연 목록 조회

**Endpoint**: `GET /admin/performances`

**설명**: 관리자용 전체 공연 목록 조회 (페이징, 검색, 필터링 지원)

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| page | number | X | 페이지 번호 (기본값: 1) |
| size | number | X | 페이지 크기 (기본값: 20) |
| search | string | X | 검색어 (공연명, 공연장명) |
| category | string | X | 카테고리 필터 (콘서트, 뮤지컬, 연극, 클래식) |
| status | string | X | 상태 필터 (공연예정, 공연중, 공연완료) |
| sortBy | string | X | 정렬 기준 (dateStart, title, facilityName) |
| sortOrder | string | X | 정렬 방향 (asc, desc) |

**Example Request**:
```
GET /admin/performances?page=1&size=20&category=콘서트&search=아이유
```

**Response**:
```json
{
  "success": true,
  "data": {
    "performances": [
      {
        "performanceId": "PF001",
        "title": "아이유 콘서트 2025",
        "poster": "https://example.com/poster.jpg",
        "category": "콘서트",
        "facilityName": "올림픽공원 올림픽홀",
        "area": "서울",
        "dateStart": "2025-03-01",
        "dateEnd": "2025-03-03",
        "ticketPrice": "VIP석 154,000원, R석 132,000원",
        "state": "공연예정",
        "reservationCount": 250,
        "totalSeats": 500
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 52,
      "itemsPerPage": 20
    }
  }
}
```

### 2.2 공연 상세 조회

**Endpoint**: `GET /admin/performances/{performanceId}`

**설명**: 특정 공연의 상세 정보 조회 (관리자용 추가 정보 포함)

**Path Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| performanceId | string | O | 공연 ID |

**Response**:
```json
{
  "success": true,
  "data": {
    "performanceId": "PF001",
    "title": "아이유 콘서트 2025",
    "poster": "https://example.com/poster.jpg",
    "category": "콘서트",
    "genre": "발라드",
    "facilityName": "올림픽공원 올림픽홀",
    "facilityId": "FC001",
    "area": "서울 송파구",
    "dateStart": "2025-03-01",
    "dateEnd": "2025-03-03",
    "runtime": "150",
    "ageLimit": "전체관람가",
    "ticketPrice": "VIP석 154,000원, R석 132,000원, S석 110,000원",
    "state": "공연예정",
    "cast": "아이유",
    "crew": "EDAM엔터테인먼트",
    "introImages": ["https://example.com/intro1.jpg", "https://example.com/intro2.jpg"],
    "schedules": [
      {
        "scheduleId": "SCH001",
        "performanceDate": "2025-03-01",
        "performanceTime": "19:00",
        "totalSeats": 500,
        "reservedSeats": 250,
        "availableSeats": 250
      }
    ],
    "reservationStats": {
      "total": 750,
      "confirmed": 700,
      "cancelled": 50
    },
    "createdAt": "2024-12-01T10:00:00Z",
    "updatedAt": "2024-12-20T15:30:00Z"
  }
}
```

### 2.3 공연 등록

**Endpoint**: `POST /admin/performances`

**설명**: 새로운 공연 등록

**Request Body**:
```json
{
  "title": "공연 제목",
  "poster": "https://example.com/poster.jpg",
  "category": "콘서트",
  "genre": "발라드",
  "facilityId": "FC001",
  "dateStart": "2025-03-01",
  "dateEnd": "2025-03-03",
  "runtime": "150",
  "ageLimit": "전체관람가",
  "ticketPrice": "VIP석 154,000원, R석 132,000원",
  "cast": "출연진",
  "crew": "제작사",
  "introImages": ["https://example.com/intro1.jpg"],
  "schedules": [
    {
      "performanceDate": "2025-03-01",
      "performanceTime": "19:00",
      "totalSeats": 500
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "공연이 등록되었습니다",
  "data": {
    "performanceId": "PF052",
    "title": "공연 제목",
    "createdAt": "2024-12-26T10:00:00Z"
  }
}
```

### 2.4 공연 수정

**Endpoint**: `PUT /admin/performances/{performanceId}`

**설명**: 기존 공연 정보 수정

**Path Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| performanceId | string | O | 공연 ID |

**Request Body**: 2.3과 동일 (수정할 필드만 포함 가능)

**Response**:
```json
{
  "success": true,
  "message": "공연 정보가 수정되었습니다",
  "data": {
    "performanceId": "PF001",
    "updatedAt": "2024-12-26T11:00:00Z"
  }
}
```

### 2.5 공연 삭제

**Endpoint**: `DELETE /admin/performances/{performanceId}`

**설명**: 공연 삭제 (예약이 없는 경우에만 가능)

**Path Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| performanceId | string | O | 공연 ID |

**Response**:
```json
{
  "success": true,
  "message": "공연이 삭제되었습니다"
}
```

**Error Response** (예약이 있는 경우):
```json
{
  "success": false,
  "message": "예약이 존재하는 공연은 삭제할 수 없습니다",
  "error": {
    "code": "PERFORMANCE_HAS_RESERVATIONS",
    "reservationCount": 50
  }
}
```

### 2.6 최근 등록 공연 조회

**Endpoint**: `GET /admin/performances/recent`

**설명**: 최근 등록된 공연 목록 조회

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| limit | number | X | 조회 개수 (기본값: 5, 최대: 20) |

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "performanceId": "PF052",
      "title": "공연 제목",
      "poster": "https://example.com/poster.jpg",
      "category": "콘서트",
      "facilityName": "올림픽공원 올림픽홀",
      "dateStart": "2025-03-01",
      "dateEnd": "2025-03-03",
      "ticketPrice": "VIP석 154,000원",
      "createdAt": "2024-12-26T10:00:00Z"
    }
  ]
}
```

---

## 🏛️ 3. 공연장 관리 API

### 3.1 전체 공연장 목록 조회

**Endpoint**: `GET /admin/venues`

**설명**: 관리자용 전체 공연장 목록 조회

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| page | number | X | 페이지 번호 (기본값: 1) |
| size | number | X | 페이지 크기 (기본값: 20) |
| search | string | X | 검색어 (공연장명, 주소) |
| region | string | X | 지역 필터 |

**Response**:
```json
{
  "success": true,
  "data": {
    "venues": [
      {
        "venueId": "FC001",
        "name": "올림픽공원 올림픽홀",
        "address": "서울 송파구 올림픽로 424",
        "region": "서울",
        "latitude": 37.5219,
        "longitude": 127.1242,
        "totalSeats": 3000,
        "facilities": "주차장, 휠체어석",
        "performanceCount": 12,
        "createdAt": "2020-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 35,
      "itemsPerPage": 20
    }
  }
}
```

### 3.2 공연장 상세 조회

**Endpoint**: `GET /admin/venues/{venueId}`

**Response**:
```json
{
  "success": true,
  "data": {
    "venueId": "FC001",
    "name": "올림픽공원 올림픽홀",
    "address": "서울 송파구 올림픽로 424",
    "region": "서울",
    "latitude": 37.5219,
    "longitude": 127.1242,
    "phone": "02-410-1114",
    "website": "https://example.com",
    "totalSeats": 3000,
    "facilities": "주차장, 휠체어석, 수유실",
    "seatLayout": {
      "type": "theater",
      "sections": ["VIP", "R", "S", "A"]
    },
    "performances": [
      {
        "performanceId": "PF001",
        "title": "공연 제목",
        "dateStart": "2025-03-01",
        "status": "공연예정"
      }
    ],
    "createdAt": "2020-01-01T00:00:00Z",
    "updatedAt": "2024-12-20T15:30:00Z"
  }
}
```

### 3.3 공연장 등록

**Endpoint**: `POST /admin/venues`

**Request Body**:
```json
{
  "name": "공연장명",
  "address": "서울 강남구 테헤란로 123",
  "region": "서울",
  "latitude": 37.5219,
  "longitude": 127.1242,
  "phone": "02-1234-5678",
  "website": "https://example.com",
  "totalSeats": 500,
  "facilities": "주차장, 휠체어석",
  "seatLayout": {
    "type": "theater",
    "sections": ["VIP", "R", "S"]
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "공연장이 등록되었습니다",
  "data": {
    "venueId": "FC036",
    "name": "공연장명"
  }
}
```

### 3.4 공연장 수정

**Endpoint**: `PUT /admin/venues/{venueId}`

**Request Body**: 3.3과 동일

### 3.5 공연장 삭제

**Endpoint**: `DELETE /admin/venues/{venueId}`

**Response**:
```json
{
  "success": true,
  "message": "공연장이 삭제되었습니다"
}
```

---

## 👥 4. 유저 관리 API

### 4.1 전체 유저 목록 조회

**Endpoint**: `GET /admin/users`

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| page | number | X | 페이지 번호 |
| size | number | X | 페이지 크기 |
| search | string | X | 검색어 (이름, 이메일, 전화번호) |
| role | string | X | 권한 필터 (USER, BUSINESS, ADMIN) |
| status | string | X | 상태 필터 (ACTIVE, SUSPENDED) |

**Response**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "userId": "U001",
        "email": "user@example.com",
        "name": "홍길동",
        "phone": "010-1234-5678",
        "roleType": "USER",
        "status": "ACTIVE",
        "joinDate": "2024-01-15T10:00:00Z",
        "lastLogin": "2024-12-26T09:00:00Z",
        "reservationCount": 5,
        "totalSpent": 450000
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 63,
      "totalItems": 1247,
      "itemsPerPage": 20
    }
  }
}
```

### 4.2 유저 상세 조회

**Endpoint**: `GET /admin/users/{userId}`

**Response**:
```json
{
  "success": true,
  "data": {
    "userId": "U001",
    "email": "user@example.com",
    "name": "홍길동",
    "phone": "010-1234-5678",
    "roleType": "USER",
    "status": "ACTIVE",
    "joinDate": "2024-01-15T10:00:00Z",
    "lastLogin": "2024-12-26T09:00:00Z",
    "reservations": [
      {
        "reservationId": "R001",
        "performanceTitle": "공연 제목",
        "performanceDate": "2025-03-01",
        "seats": ["A1", "A2"],
        "totalPrice": 200000,
        "status": "CONFIRMED",
        "createdAt": "2024-12-20T10:00:00Z"
      }
    ],
    "statistics": {
      "totalReservations": 5,
      "cancelledReservations": 1,
      "totalSpent": 450000,
      "favoriteCategory": "콘서트"
    }
  }
}
```

### 4.3 유저 권한 수정

**Endpoint**: `PATCH /admin/users/{userId}/role`

**Request Body**:
```json
{
  "roleType": "BUSINESS"
}
```

**Response**:
```json
{
  "success": true,
  "message": "유저 권한이 수정되었습니다",
  "data": {
    "userId": "U001",
    "roleType": "BUSINESS"
  }
}
```

### 4.4 유저 상태 변경

**Endpoint**: `PATCH /admin/users/{userId}/status`

**Request Body**:
```json
{
  "status": "SUSPENDED",
  "reason": "정책 위반"
}
```

**Response**:
```json
{
  "success": true,
  "message": "유저 상태가 변경되었습니다",
  "data": {
    "userId": "U001",
    "status": "SUSPENDED"
  }
}
```

### 4.5 유저 삭제

**Endpoint**: `DELETE /admin/users/{userId}`

**Response**:
```json
{
  "success": true,
  "message": "유저가 삭제되었습니다"
}
```

---

## 🎫 5. 예약 관리 API

### 5.1 전체 예약 목록 조회

**Endpoint**: `GET /admin/reservations`

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| page | number | X | 페이지 번호 |
| size | number | X | 페이지 크기 |
| search | string | X | 검색어 (예약번호, 유저명, 공연명) |
| status | string | X | 상태 필터 (CONFIRMED, CANCELLED) |
| dateFrom | string | X | 시작일 (YYYY-MM-DD) |
| dateTo | string | X | 종료일 (YYYY-MM-DD) |

**Response**:
```json
{
  "success": true,
  "data": {
    "reservations": [
      {
        "reservationId": "R001",
        "userId": "U001",
        "userName": "홍길동",
        "userEmail": "user@example.com",
        "performanceId": "PF001",
        "performanceTitle": "아이유 콘서트 2025",
        "performanceDate": "2025-03-01",
        "performanceTime": "19:00",
        "facilityName": "올림픽공원 올림픽홀",
        "seats": ["A1", "A2"],
        "totalPrice": 200000,
        "status": "CONFIRMED",
        "createdAt": "2024-12-20T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 172,
      "totalItems": 3429,
      "itemsPerPage": 20
    }
  }
}
```

### 5.2 예약 상세 조회

**Endpoint**: `GET /admin/reservations/{reservationId}`

**Response**:
```json
{
  "success": true,
  "data": {
    "reservationId": "R001",
    "userId": "U001",
    "userName": "홍길동",
    "userEmail": "user@example.com",
    "userPhone": "010-1234-5678",
    "performanceId": "PF001",
    "performanceTitle": "아이유 콘서트 2025",
    "performanceDate": "2025-03-01",
    "performanceTime": "19:00",
    "facilityName": "올림픽공원 올림픽홀",
    "seats": ["A1", "A2"],
    "seatDetails": [
      {
        "section": "VIP",
        "row": "A",
        "number": "1",
        "price": 100000
      }
    ],
    "totalPrice": 200000,
    "paymentMethod": "CARD",
    "paymentId": "PAY001",
    "status": "CONFIRMED",
    "queueToken": "TOKEN123",
    "createdAt": "2024-12-20T10:00:00Z",
    "cancelledAt": null,
    "cancelReason": null
  }
}
```

### 5.3 예약 강제 취소 (관리자)

**Endpoint**: `POST /admin/reservations/{reservationId}/cancel`

**Request Body**:
```json
{
  "reason": "관리자에 의한 취소 사유"
}
```

**Response**:
```json
{
  "success": true,
  "message": "예약이 취소되었습니다",
  "data": {
    "reservationId": "R001",
    "status": "CANCELLED",
    "cancelledAt": "2024-12-26T10:00:00Z",
    "refundAmount": 200000
  }
}
```

---

## 📊 공통 응답 형식

### 성공 응답
```json
{
  "success": true,
  "message": "요청이 성공했습니다",
  "data": {
    // 응답 데이터
  }
}
```

### 에러 응답
```json
{
  "success": false,
  "message": "에러 메시지",
  "error": {
    "code": "ERROR_CODE",
    "details": "상세 에러 정보"
  }
}
```

### 공통 에러 코드

| HTTP 상태 | 코드 | 설명 |
|----------|------|------|
| 400 | BAD_REQUEST | 잘못된 요청 |
| 401 | UNAUTHORIZED | 인증 실패 |
| 403 | FORBIDDEN | 권한 없음 (ADMIN 권한 필요) |
| 404 | NOT_FOUND | 리소스를 찾을 수 없음 |
| 409 | CONFLICT | 중복된 데이터 |
| 500 | INTERNAL_SERVER_ERROR | 서버 에러 |

---

## 🔐 인증 및 권한

모든 관리자 API는 다음 조건을 만족해야 합니다:

1. **JWT 토큰 필요**: Authorization 헤더에 Bearer 토큰 포함
2. **ADMIN 권한 필요**: 토큰의 roleType이 'ADMIN'이어야 함

**인증 실패 예시**:
```json
{
  "success": false,
  "message": "관리자 권한이 필요합니다",
  "error": {
    "code": "FORBIDDEN",
    "details": "ADMIN role required"
  }
}
```

---

## 📌 주의사항

1. **페이징**: 모든 목록 조회 API는 페이징을 지원하며, 기본값은 page=1, size=20입니다.
2. **검색**: search 파라미터는 여러 필드를 OR 조건으로 검색합니다.
3. **정렬**: sortBy와 sortOrder 파라미터로 정렬 가능합니다.
4. **삭제 제한**: 관련 데이터가 있는 경우 삭제가 제한될 수 있습니다.
5. **날짜 형식**: ISO 8601 형식 (YYYY-MM-DDTHH:mm:ssZ) 사용
6. **금액**: 원화(KRW) 기준, 정수형

---

## 🔄 버전 정보

- **API Version**: 1.0
- **최종 수정일**: 2024-12-26
- **작성자**: TGet Development Team

