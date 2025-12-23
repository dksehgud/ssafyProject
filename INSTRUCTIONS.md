# 티켓팅 프로젝트(Tiget) 실행 가이드

## 1. 사전 준비물 (Prerequisites)

- **Java 21** (JDK 21)
- **Docker & Docker Compose** (DB 실행용)
- **Node.js** (프론트엔드 실행용)

---

## 2. 데이터베이스 실행 (MySQL + Redis)

이 프로젝트는 Docker를 사용하여 DB를 실행합니다. 복잡한 설치 없이 아래 명령어만 입력하세요.

1. **DB 실행하기** (프로젝트 루트 폴더에서)

    ```bash
    docker-compose up -d
    ```

2. **초기 데이터 넣기** (최초 1회만 필요)
    DB가 실행된 후, 약 10초 정도 기다렸다가 아래 명령어를 차례대로 복사해서 터미널에 붙여넣으세요. (비밀번호 `ssafy` 입력 불필요, 자동 처리됨)

    ```bash
    # 1. 테이블 생성 (스키마 적용)
    cat tigetting/src/main/resources/db/Tget_Schema_v2.sql | docker exec -i tget-db mysql -u ssafy -p"ssafy" tget

    # 2. 데이터 넣기 (공연 정보 등)
    cat tigetting/src/main/resources/db/insert_all_data.sql | docker exec -i tget-db mysql -u ssafy -p"ssafy" tget
    ```

---

## 3. 서버 실행 방법

### 백엔드 (Spring Boot)

터미널을 열고 `tigetting` 폴더로 이동 후 실행합니다.

```bash
cd tigetting
./gradlew bootRun
```

* 서버 주소: `http://localhost:8080`
- Swagger API 문서: `http://localhost:8080/swagger-ui/index.html` (예상)

### 프론트엔드 (Vue.js)

새 터미널을 열고 `tget-front` 폴더로 이동 후 실행합니다.

```bash
cd tget-front
npm install    # 최초 1회만
npm run dev
```

* 접속 주소: `http://localhost:5173`

---

## 4. 계정 정보 (테스트용)

| 구분 | 아이디 (Email) | 비밀번호 |
| :--- | :--- | :--- |
| **관리자** | `admin@ssafy.com` | `1234` |
| **일반유저** | `user@ssafy.com` | `1234` |

---

## 5. 자주 묻는 질문 (FAQ)

**Q. DB 연결 에러가 계속 나요!**
A. `docker ps` 명령어로 `tget-db` 컨테이너가 켜져 있는지 확인하세요. 만약 꺼져있다면 `docker-compose up -d`를 다시 실행해주세요.
