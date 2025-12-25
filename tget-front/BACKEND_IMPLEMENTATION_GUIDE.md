# 관리자 API 백엔드 구현 가이드

## 📋 개요

이 문서는 프론트엔드 개발이 완료된 TGet 관리자 페이지의 백엔드 API 구현 가이드입니다.

---

## 🏗️ 구현 우선순위

### 1단계: 필수 API (대시보드)
```
✅ GET /admin/stats - 전체 통계 조회
✅ GET /admin/stats/categories - 카테고리별 통계
✅ GET /admin/stats/regions - 지역별 통계
✅ GET /admin/performances/recent - 최근 공연 조회
```

### 2단계: 공연 관리 API
```
✅ GET /admin/performances - 공연 목록 조회
✅ GET /admin/performances/{id} - 공연 상세 조회
✅ POST /admin/performances - 공연 등록
✅ PUT /admin/performances/{id} - 공연 수정
✅ DELETE /admin/performances/{id} - 공연 삭제
```

### 3단계: 공연장/유저 관리 API
```
✅ GET /admin/venues - 공연장 목록
✅ GET /admin/venues/{id} - 공연장 상세
✅ POST /admin/venues - 공연장 등록
✅ PUT /admin/venues/{id} - 공연장 수정
✅ DELETE /admin/venues/{id} - 공연장 삭제

✅ GET /admin/users - 유저 목록
✅ GET /admin/users/{id} - 유저 상세
✅ PATCH /admin/users/{id}/role - 권한 수정
✅ PATCH /admin/users/{id}/status - 상태 변경
✅ DELETE /admin/users/{id} - 유저 삭제
```

### 4단계: 예약 관리 API
```
✅ GET /admin/reservations - 예약 목록
✅ GET /admin/reservations/{id} - 예약 상세
✅ POST /admin/reservations/{id}/cancel - 예약 강제 취소
```

---

## 🔐 인증 미들웨어 구현

### Spring Boot 예시

```java
@Component
public class AdminAuthInterceptor implements HandlerInterceptor {
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    @Override
    public boolean preHandle(HttpServletRequest request, 
                           HttpServletResponse response, 
                           Object handler) throws Exception {
        
        String token = resolveToken(request);
        
        if (token == null || !jwtTokenProvider.validateToken(token)) {
            throw new UnauthorizedException("유효하지 않은 토큰입니다");
        }
        
        String roleType = jwtTokenProvider.getRoleType(token);
        
        if (!"ADMIN".equals(roleType)) {
            throw new ForbiddenException("관리자 권한이 필요합니다");
        }
        
        return true;
    }
    
    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

### WebConfig 설정

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Autowired
    private AdminAuthInterceptor adminAuthInterceptor;
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(adminAuthInterceptor)
                .addPathPatterns("/api/admin/**");
    }
}
```

---

## 📊 1. 대시보드 API 구현

### 1.1 전체 통계 조회

```java
@RestController
@RequestMapping("/api/admin")
public class AdminStatsController {
    
    @Autowired
    private PerformanceRepository performanceRepository;
    
    @Autowired
    private VenueRepository venueRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ReservationRepository reservationRepository;
    
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStatsDto>> getAdminStats() {
        
        AdminStatsDto stats = AdminStatsDto.builder()
            .totalPerformances(performanceRepository.count())
            .totalVenues(venueRepository.count())
            .totalUsers(userRepository.count())
            .totalReservations(reservationRepository.count())
            .todayReservations(reservationRepository.countTodayReservations())
            .revenue(calculateRevenue())
            .build();
        
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
    
    private RevenueDto calculateRevenue() {
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);
        
        Long todayRevenue = reservationRepository.sumRevenueByDate(today);
        Long monthRevenue = reservationRepository.sumRevenueBetween(startOfMonth, today);
        
        return RevenueDto.builder()
            .today(todayRevenue)
            .thisMonth(monthRevenue)
            .growth(calculateGrowth(monthRevenue))
            .build();
    }
}
```

### DTO 클래스

```java
@Data
@Builder
public class AdminStatsDto {
    private Long totalPerformances;
    private Long totalVenues;
    private Long totalUsers;
    private Long totalReservations;
    private Long todayReservations;
    private RevenueDto revenue;
}

@Data
@Builder
public class RevenueDto {
    private Long today;
    private Long thisMonth;
    private String growth;
}
```

### 1.2 카테고리별 통계

```java
@GetMapping("/stats/categories")
public ResponseEntity<ApiResponse<Map<String, Long>>> getCategoryStats() {
    
    List<Object[]> results = performanceRepository.countByCategory();
    
    Map<String, Long> categoryCount = results.stream()
        .collect(Collectors.toMap(
            arr -> (String) arr[0],  // category
            arr -> (Long) arr[1]     // count
        ));
    
    return ResponseEntity.ok(ApiResponse.success(categoryCount));
}
```

### Repository 쿼리

```java
public interface PerformanceRepository extends JpaRepository<Performance, String> {
    
    @Query("SELECT p.category, COUNT(p) FROM Performance p GROUP BY p.category")
    List<Object[]> countByCategory();
    
    @Query("SELECT p.area, COUNT(p) FROM Performance p GROUP BY p.area")
    List<Object[]> countByRegion();
}
```

### 1.3 최근 공연 조회

```java
@GetMapping("/performances/recent")
public ResponseEntity<ApiResponse<List<PerformanceDto>>> getRecentPerformances(
    @RequestParam(defaultValue = "5") int limit) {
    
    PageRequest pageRequest = PageRequest.of(0, limit, Sort.by("createdAt").descending());
    
    List<Performance> performances = performanceRepository.findAll(pageRequest).getContent();
    
    List<PerformanceDto> dtos = performances.stream()
        .map(this::convertToDto)
        .collect(Collectors.toList());
    
    return ResponseEntity.ok(ApiResponse.success(dtos));
}
```

---

## 🎭 2. 공연 관리 API 구현

### 2.1 공연 목록 조회 (페이징, 검색, 필터)

```java
@GetMapping("/performances")
public ResponseEntity<ApiResponse<PageResponse<PerformanceDto>>> getPerformances(
    @RequestParam(defaultValue = "1") int page,
    @RequestParam(defaultValue = "20") int size,
    @RequestParam(required = false) String search,
    @RequestParam(required = false) String category,
    @RequestParam(required = false) String status,
    @RequestParam(defaultValue = "dateStart") String sortBy,
    @RequestParam(defaultValue = "desc") String sortOrder) {
    
    // Specification을 사용한 동적 쿼리
    Specification<Performance> spec = Specification.where(null);
    
    if (search != null && !search.isEmpty()) {
        spec = spec.and((root, query, cb) -> 
            cb.or(
                cb.like(root.get("title"), "%" + search + "%"),
                cb.like(root.get("facilityName"), "%" + search + "%")
            )
        );
    }
    
    if (category != null && !category.isEmpty()) {
        spec = spec.and((root, query, cb) -> 
            cb.equal(root.get("category"), category)
        );
    }
    
    if (status != null && !status.isEmpty()) {
        spec = spec.and((root, query, cb) -> 
            cb.equal(root.get("state"), status)
        );
    }
    
    Sort sort = Sort.by(
        sortOrder.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC,
        sortBy
    );
    
    PageRequest pageRequest = PageRequest.of(page - 1, size, sort);
    
    Page<Performance> performancePage = performanceRepository.findAll(spec, pageRequest);
    
    PageResponse<PerformanceDto> response = PageResponse.<PerformanceDto>builder()
        .items(performancePage.getContent().stream()
            .map(this::convertToDto)
            .collect(Collectors.toList()))
        .currentPage(page)
        .totalPages(performancePage.getTotalPages())
        .totalItems(performancePage.getTotalElements())
        .itemsPerPage(size)
        .build();
    
    return ResponseEntity.ok(ApiResponse.success(response));
}
```

### 2.2 공연 등록

```java
@PostMapping("/performances")
public ResponseEntity<ApiResponse<PerformanceDto>> createPerformance(
    @Valid @RequestBody CreatePerformanceRequest request) {
    
    // 공연장 존재 여부 확인
    Venue venue = venueRepository.findById(request.getFacilityId())
        .orElseThrow(() -> new NotFoundException("공연장을 찾을 수 없습니다"));
    
    // Performance 엔티티 생성
    Performance performance = Performance.builder()
        .title(request.getTitle())
        .poster(request.getPoster())
        .category(request.getCategory())
        .genre(request.getGenre())
        .venue(venue)
        .facilityName(venue.getName())
        .area(venue.getAddress())
        .dateStart(request.getDateStart())
        .dateEnd(request.getDateEnd())
        .runtime(request.getRuntime())
        .ageLimit(request.getAgeLimit())
        .ticketPrice(request.getTicketPrice())
        .cast(request.getCast())
        .crew(request.getCrew())
        .introImages(request.getIntroImages())
        .state("공연예정")
        .build();
    
    Performance saved = performanceRepository.save(performance);
    
    // 스케줄 등록
    if (request.getSchedules() != null && !request.getSchedules().isEmpty()) {
        List<Schedule> schedules = request.getSchedules().stream()
            .map(scheduleReq -> Schedule.builder()
                .performance(saved)
                .performanceDate(scheduleReq.getPerformanceDate())
                .performanceTime(scheduleReq.getPerformanceTime())
                .totalSeats(scheduleReq.getTotalSeats())
                .reservedSeats(0)
                .build())
            .collect(Collectors.toList());
        
        scheduleRepository.saveAll(schedules);
    }
    
    return ResponseEntity.ok(ApiResponse.success("공연이 등록되었습니다", convertToDto(saved)));
}
```

### Request DTO

```java
@Data
@Validated
public class CreatePerformanceRequest {
    
    @NotBlank(message = "공연 제목은 필수입니다")
    private String title;
    
    @NotBlank(message = "포스터 이미지는 필수입니다")
    private String poster;
    
    @NotBlank(message = "카테고리는 필수입니다")
    private String category;
    
    private String genre;
    
    @NotBlank(message = "공연장 ID는 필수입니다")
    private String facilityId;
    
    @NotNull(message = "공연 시작일은 필수입니다")
    private LocalDate dateStart;
    
    @NotNull(message = "공연 종료일은 필수입니다")
    private LocalDate dateEnd;
    
    private String runtime;
    private String ageLimit;
    private String ticketPrice;
    private String cast;
    private String crew;
    private List<String> introImages;
    private List<ScheduleRequest> schedules;
}

@Data
public class ScheduleRequest {
    private LocalDate performanceDate;
    private String performanceTime;
    private Integer totalSeats;
}
```

### 2.3 공연 삭제 (예약 체크)

```java
@DeleteMapping("/performances/{performanceId}")
public ResponseEntity<ApiResponse<Void>> deletePerformance(@PathVariable String performanceId) {
    
    Performance performance = performanceRepository.findById(performanceId)
        .orElseThrow(() -> new NotFoundException("공연을 찾을 수 없습니다"));
    
    // 예약이 있는지 확인
    long reservationCount = reservationRepository.countByPerformanceId(performanceId);
    
    if (reservationCount > 0) {
        throw new ConflictException(
            "예약이 존재하는 공연은 삭제할 수 없습니다",
            Map.of("reservationCount", reservationCount)
        );
    }
    
    performanceRepository.delete(performance);
    
    return ResponseEntity.ok(ApiResponse.success("공연이 삭제되었습니다"));
}
```

---

## 👥 3. 유저 관리 API 구현

### 3.1 유저 권한 수정

```java
@PatchMapping("/users/{userId}/role")
public ResponseEntity<ApiResponse<UserDto>> updateUserRole(
    @PathVariable String userId,
    @Valid @RequestBody UpdateRoleRequest request) {
    
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new NotFoundException("유저를 찾을 수 없습니다"));
    
    // 권한 변경
    user.setRoleType(RoleType.valueOf(request.getRoleType()));
    
    User updated = userRepository.save(user);
    
    return ResponseEntity.ok(ApiResponse.success(
        "유저 권한이 수정되었습니다",
        convertToDto(updated)
    ));
}
```

### 3.2 유저 상태 변경

```java
@PatchMapping("/users/{userId}/status")
public ResponseEntity<ApiResponse<UserDto>> updateUserStatus(
    @PathVariable String userId,
    @Valid @RequestBody UpdateStatusRequest request) {
    
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new NotFoundException("유저를 찾을 수 없습니다"));
    
    user.setStatus(UserStatus.valueOf(request.getStatus()));
    user.setSuspendReason(request.getReason());
    
    if (UserStatus.SUSPENDED.equals(user.getStatus())) {
        user.setSuspendedAt(LocalDateTime.now());
    }
    
    User updated = userRepository.save(user);
    
    return ResponseEntity.ok(ApiResponse.success(
        "유저 상태가 변경되었습니다",
        convertToDto(updated)
    ));
}
```

---

## 🎫 4. 예약 관리 API 구현

### 4.1 예약 강제 취소

```java
@PostMapping("/reservations/{reservationId}/cancel")
@Transactional
public ResponseEntity<ApiResponse<ReservationDto>> cancelReservationByAdmin(
    @PathVariable String reservationId,
    @Valid @RequestBody CancelReservationRequest request) {
    
    Reservation reservation = reservationRepository.findById(reservationId)
        .orElseThrow(() -> new NotFoundException("예약을 찾을 수 없습니다"));
    
    if (reservation.getStatus() == ReservationStatus.CANCELLED) {
        throw new ConflictException("이미 취소된 예약입니다");
    }
    
    // 예약 취소 처리
    reservation.setStatus(ReservationStatus.CANCELLED);
    reservation.setCancelledAt(LocalDateTime.now());
    reservation.setCancelReason("관리자 취소: " + request.getReason());
    
    // 좌석 복구
    List<Seat> seats = seatRepository.findByReservationId(reservationId);
    seats.forEach(seat -> {
        seat.setStatus(SeatStatus.AVAILABLE);
        seat.setReservation(null);
    });
    seatRepository.saveAll(seats);
    
    // 환불 처리
    Long refundAmount = reservation.getTotalPrice();
    // TODO: 실제 환불 로직 구현 (PG사 연동)
    
    Reservation updated = reservationRepository.save(reservation);
    
    // 유저에게 알림 발송
    notificationService.sendCancellationNotice(
        reservation.getUser(),
        reservation,
        request.getReason()
    );
    
    ReservationDto dto = convertToDto(updated);
    dto.setRefundAmount(refundAmount);
    
    return ResponseEntity.ok(ApiResponse.success("예약이 취소되었습니다", dto));
}
```

---

## 📦 공통 응답 클래스

```java
@Data
@Builder
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private ErrorInfo error;
    
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .data(data)
            .build();
    }
    
    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .message(message)
            .data(data)
            .build();
    }
    
    public static <T> ApiResponse<T> error(String message, ErrorInfo error) {
        return ApiResponse.<T>builder()
            .success(false)
            .message(message)
            .error(error)
            .build();
    }
}

@Data
@Builder
public class ErrorInfo {
    private String code;
    private Object details;
}

@Data
@Builder
public class PageResponse<T> {
    private List<T> items;
    private int currentPage;
    private int totalPages;
    private long totalItems;
    private int itemsPerPage;
}
```

---

## 🔍 예외 처리

```java
@ControllerAdvice
public class AdminExceptionHandler {
    
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(NotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error(e.getMessage(), 
                ErrorInfo.builder().code("NOT_FOUND").build()));
    }
    
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiResponse<Void>> handleConflict(ConflictException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ApiResponse.error(e.getMessage(),
                ErrorInfo.builder()
                    .code("CONFLICT")
                    .details(e.getDetails())
                    .build()));
    }
    
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthorized(UnauthorizedException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ApiResponse.error(e.getMessage(),
                ErrorInfo.builder().code("UNAUTHORIZED").build()));
    }
    
    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiResponse<Void>> handleForbidden(ForbiddenException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ApiResponse.error(e.getMessage(),
                ErrorInfo.builder().code("FORBIDDEN").build()));
    }
}
```

---

## 🧪 테스트 코드 예시

```java
@SpringBootTest
@AutoConfigureMockMvc
class AdminStatsControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private PerformanceRepository performanceRepository;
    
    @Test
    @WithMockUser(roles = "ADMIN")
    void getAdminStats_Success() throws Exception {
        // Given
        when(performanceRepository.count()).thenReturn(52L);
        
        // When & Then
        mockMvc.perform(get("/api/admin/stats")
                .header("Authorization", "Bearer " + generateAdminToken()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.totalPerformances").value(52));
    }
    
    @Test
    @WithMockUser(roles = "USER")
    void getAdminStats_Forbidden() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/admin/stats")
                .header("Authorization", "Bearer " + generateUserToken()))
            .andExpect(status().isForbidden());
    }
}
```

---

## 📝 체크리스트

### 필수 구현 사항
- [ ] JWT 인증 미들웨어
- [ ] ADMIN 권한 체크
- [ ] 대시보드 통계 API (4개)
- [ ] 공연 관리 API (5개)
- [ ] 공연장 관리 API (5개)
- [ ] 유저 관리 API (5개)
- [ ] 예약 관리 API (3개)

### 추가 고려사항
- [ ] API 로깅 (관리자 작업 이력)
- [ ] 데이터 백업 전 삭제
- [ ] 트랜잭션 관리
- [ ] 대량 데이터 처리 최적화
- [ ] 캐싱 적용 (통계 데이터)
- [ ] API Rate Limiting
- [ ] 감사 로그 (Audit Log)

---

## 🔧 개발 환경 설정

### application.yml
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    
admin:
  auth:
    required-role: ADMIN
  
logging:
  level:
    com.tget.admin: DEBUG
```

---

## 📞 문의

백엔드 구현 중 문의사항이 있으면 프론트엔드 팀에 연락 부탁드립니다.

**프론트엔드 API 서비스**: `/src/api/adminService.js`
**API 명세서**: `API_SPECIFICATION_ADMIN.md`

