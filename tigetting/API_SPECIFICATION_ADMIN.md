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
    "todayReservations": 47
  }
}
```
**참고**: 현재 DB 스키마에는 결제/매출 정보가 없어 revenue 필드는 제외됩니다.

### 1.2 카테고리별 공연 통계

**Endpoint**: `GET /admin/stats/categories`

**설명**: 장르별 공연 수 및 비율 (genres 테이블 기준)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "genreId": 2,
      "genreName": "콘서트",
      "count": 18
    },
    {
      "genreId": 3,
      "genreName": "뮤지컬",
      "count": 15
    },
    {
      "genreId": 4,
      "genreName": "연극",
      "count": 12
    },
    {
      "genreId": 1,
      "genreName": "클래식",
      "count": 7
    }
  ]
}
```

### 1.3 지역별 공연 통계

**Endpoint**: `GET /admin/stats/regions`

**설명**: 지역별 공연 수 (performances.area 필드 기준)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "area": "서울",
      "count": 28
    },
    {
      "area": "경기",
      "count": 12
    },
    {
      "area": "부산",
      "count": 6
    }
  ]
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
        "mt20id": "PF001",
        "prfnm": "아이유 콘서트 2025",
        "poster": "https://example.com/poster.jpg",
        "genreName": "콘서트",
        "fcltynm": "올림픽공원 올림픽홀",
        "area": "서울",
        "prfpdfrom": "2025-03-01",
        "prfpdto": "2025-03-03",
        "prfstate": "공연예정",
        "mt10id": "FC001",
        "reservationCount": 250
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

**참고**: 실제 DB 필드명 사용 (mt20id=공연ID, prfnm=공연명, prfpdfrom/prfpdto=공연기간, fcltynm=공연장명, mt10id=공연장ID)

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
    "mt20id": "PF001",
    "prfnm": "아이유 콘서트 2025",
    "poster": "https://example.com/poster.jpg",
    "genreName": "콘서트",
    "fcltynm": "올림픽공원 올림픽홀",
    "mt10id": "FC001",
    "area": "서울",
    "prfpdfrom": "2025-03-01",
    "prfpdto": "2025-03-03",
    "prfstate": "공연예정",
    "prfcast": "아이유",
    "prfcrew": "EDAM엔터테인먼트",
    "prfruntime": "150",
    "prfage": "전체관람가",
    "pcseguidance": "VIP석 154,000원, R석 132,000원, S석 110,000원",
    "sty": "공연 소개 내용",
    "dtguidance": "화,수,목,금(19:30) 토,일,공휴일(14:00,18:00)",
    "styurls": [
      "https://example.com/intro1.jpg",
      "https://example.com/intro2.jpg"
    ],
    "reservationCount": 750
  }
}
```

**참고**: 
- performance_details 테이블의 상세 정보 포함 (prfcast, prfcrew, prfruntime, prfage, pcseguidance, sty, dtguidance)
- performance_styurls 테이블의 스틸 이미지 URL 배열
- 현재 DB에는 schedules 테이블이 없어 제외됨

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
        "mt10id": "FC001",
        "fcltynm": "올림픽공원 올림픽홀",
        "sidonm": "서울",
        "gugunnm": "송파구",
        "region": "수도권",
        "la": 37.5219,
        "lo": 127.1242,
        "mt13cnt": 3,
        "fcltychartr": "공연장",
        "performanceCount": 12
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

**참고**: venues 테이블 필드 사용 (mt10id=공연장ID, fcltynm=공연장명, sidonm=시도명, gugunnm=구군명, region=권역)

### 3.2 공연장 상세 조회

**Endpoint**: `GET /admin/venues/{venueId}`

**Response**:
```json
{
  "success": true,
  "data": {
    "mt10id": "FC001",
    "fcltynm": "올림픽공원 올림픽홀",
    "sidonm": "서울",
    "gugunnm": "송파구",
    "region": "수도권",
    "la": 37.5219,
    "lo": 127.1242,
    "mt13cnt": 3,
    "fcltychartr": "공연장",
    "adres": "서울 송파구 올림픽로 424",
    "telno": "02-410-1114",
    "seatscale": 3000,
    "performances": [
      {
        "mt20id": "PF001",
        "prfnm": "공연 제목",
        "prfpdfrom": "2025-03-01",
        "prfstate": "공연예정"
      }
    ],
    "performanceCount": 12
  }
}
```

**참고**: 
- venues 테이블 기본 정보 + venue_details 테이블 상세 정보 포함
- adres(주소), telno(전화번호), seatscale(좌석수)는 venue_details 테이블에서 조회

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
        "userid": 1,
        "email": "user@example.com",
        "name": "홍길동",
        "phone": "010-1234-5678",
        "roleName": "USER",
        "register": "2024-01-15T10:00:00",
        "reservationCount": 5
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

**참고**: 
- users 테이블 필드 사용 (userid, email, name, phone, register)
- roles 테이블과 JOIN하여 roleName 조회
- 현재 DB에는 status 필드가 없어 모든 사용자는 ACTIVE로 간주
- lastLogin 필드도 없어 제외됨

### 4.2 유저 권한 수정

**Endpoint**: `PATCH /api/admin/users/{userId}/role`

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
    "userid": 1,
    "roleName": "BUSINESS"
  }
}
```

### 4.3 유저 삭제

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
        "reservation_id": 1,
        "reservation_group_id": 100,
        "userid": 1,
        "userName": "홍길동",
        "userEmail": "user@example.com",
        "mt20id": "PF001",
        "prfnm": "아이유 콘서트 2025",
        "fcltynm": "올림픽공원 올림픽홀",
        "seat_section": "VIP",
        "seat_row": "A",
        "seat_number": "1",
        "price": 154000,
        "status": "CONFIRMED",
        "reserved_at": "2024-12-20T10:00:00"
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

**참고**: 
- reservations 테이블 필드 사용
- users, performances 테이블과 JOIN하여 사용자/공연 정보 포함
- 현재 DB에는 performanceDate, performanceTime 필드가 없음

### 5.2 예약 상세 조회

**Endpoint**: `GET /admin/reservations/{reservationId}`

**Response**:
```json
{
  "success": true,
  "data": {
    "reservation_id": 1,
    "reservation_group_id": 100,
    "userid": 1,
    "userName": "홍길동",
    "userEmail": "user@example.com",
    "userPhone": "010-1234-5678",
    "mt20id": "PF001",
    "prfnm": "아이유 콘서트 2025",
    "fcltynm": "올림픽공원 올림픽홀",
    "seat_section": "VIP",
    "seat_row": "A",
    "seat_number": "1",
    "price": 154000,
    "status": "CONFIRMED",
    "reserved_at": "2024-12-20T10:00:00"
  }
}
```

**참고**: 
- reservations 테이블은 개별 좌석 단위로 저장됨 (reservation_group_id로 그룹화)
- 현재 DB에는 paymentMethod, paymentId, queueToken 필드가 없음

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

