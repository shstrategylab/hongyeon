# 洪烟 마스터 (HongYeon Master)

홍연기문(洪烟奇門) 기반 운세 분석 서비스입니다.  
생년월일시를 입력하면 구궁도를 포국하고, AI 심층풀이 프롬프트를 자동 생성합니다.

---

## 파일 구조

```
hongyeon-master/
├── index.html          # 생년월일시 입력 폼
├── result.html         # 구궁도 결과 화면
├── premium.html        # 유료 십신·육친 심층 풀이
├── prompt.html         # AI 프롬프트 생성 및 복사
│
├── css/
│   └── style.css       # 전체 공통 스타일
│
└── js/
    ├── data-jeolgi.js  # 24절기 기준국수 테이블 (DB)
    ├── data-ganji.js   # 천간·지지 선천수 매핑 (DB)
    ├── data-gugung.js  # 구궁 오행·방위·해석 텍스트 (DB)
    ├── data-yukhin.js  # 십신·육친 매핑 — 유료 (DB)
    ├── engine.js       # 핵심 연산 엔진 (포국·해석·프롬프트)
    └── firebase.js     # Firebase Realtime DB 연동
```

---

## 시작하기

### 1. Firebase 설정

1. [Firebase 콘솔](https://console.firebase.google.com)에서 프로젝트 생성
2. **Realtime Database** 생성 (테스트 모드로 시작)
3. **프로젝트 설정 → 내 앱 → 웹 앱 추가** 후 설정값 복사
4. `js/firebase.js` 파일을 열어 아래 부분에 붙여넣기:

```js
const FIREBASE_CONFIG = {
  apiKey:            "복사한_API_KEY",
  authDomain:        "복사한_AUTH_DOMAIN",
  databaseURL:       "복사한_DATABASE_URL",
  projectId:         "복사한_PROJECT_ID",
  storageBucket:     "복사한_STORAGE_BUCKET",
  messagingSenderId: "복사한_MESSAGING_SENDER_ID",
  appId:             "복사한_APP_ID",
};
```

### 2. Firebase Realtime DB 보안 규칙 설정

Firebase 콘솔 → Realtime Database → 규칙 탭에 아래 내용 붙여넣고 **게시**:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth == null || auth.uid == $uid",
        ".write": "auth == null || auth.uid == $uid"
      }
    }
  }
}
```

> 현재는 로그인 없이 로컬스토리지 기반 익명 ID를 사용합니다.  
> 추후 Firebase Auth 연동 시 규칙을 강화하세요.

### 3. GitHub Pages 배포

1. GitHub 저장소에 모든 파일 푸시
2. 저장소 **Settings → Pages → Branch: main / (root)** 선택 후 저장
3. `https://[username].github.io/[repo-name]/` 로 접속

---

## 사용 흐름

```
index.html  →  result.html  →  premium.html
    │                               │
    └──────────── prompt.html ──────┘
                  (AI 프롬프트 복사 → Claude/ChatGPT에 붙여넣기)
```

---

## 결제 연동 (추후 작업)

`premium.html`의 `handlePayment()` 함수에 결제 모듈을 연동합니다.

**추천 PG사:**
- [토스페이먼츠](https://docs.tosspayments.com) — 국내 간편결제
- [아임포트(포트원)](https://developers.portone.io) — 다양한 PG 통합

결제 성공 콜백에서 `setPremiumStatus(true)` 를 호출하면 자동으로 잠금 해제됩니다.

```js
// 결제 성공 시 호출
await setPremiumStatus(true);
```

---

## 주의사항

- 절기 날짜는 연도별 ±1일 오차가 있습니다. 정밀도를 높이려면 한국천문연구원 API 연동을 권장합니다.
- 사주팔자 간지를 직접 입력하면 더 정확한 포국이 가능합니다 (만세력 참고).
- 1987~1988년 출생자는 썸머타임(+1시간) 적용으로 실제 시간보다 1시간 늦게 입력하세요.
