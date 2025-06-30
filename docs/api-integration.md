# API 연동 가이드

## 📋 현재 구현 상태

### ✅ 완료된 기능
- 텍스트 추출 엔진 (TextExtractor)
- 우선순위 기반 분류 시스템
- Background ↔ Content Script 통신
- 테스트 환경 구축

### 🔄 다음 단계: Gemini API 연동
현재 텍스트 추출이 완료되었으므로, 다음 단계는 추출된 텍스트를 Gemini API로 번역하는 것입니다.

## 🚀 Gemini API 연동 계획

### 1. API 클라이언트 구현

```javascript
// content/apiClient.js (향후 구현 예정)
class GeminiAPIClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://generativeai.googleapis.com/v1beta/models';
    this.model = 'gemini-1.5-flash-latest';
  }

  async translateTexts(texts, targetLanguage = 'ko') {
    // 배치 번역 구현
  }

  async translateSingle(text, targetLanguage = 'ko') {
    // 단일 텍스트 번역
  }
}
```

### 2. 메시지 통신 확장

```javascript
// 추가될 메시지 타입들
const MessageTypes = {
  // 기존
  START_TRANSLATION: 'startTranslation',
  EXTRACT_TEXTS: 'extractTexts',
  
  // 추가 예정
  TRANSLATE_BATCH: 'translateBatch',
  TRANSLATION_COMPLETE: 'translationComplete',
  TRANSLATION_ERROR: 'translationError',
  UPDATE_PROGRESS: 'updateProgress'
};
```

### 3. 번역 결과 적용

```javascript
// content/domUpdater.js (향후 구현 예정)
class DOMUpdater {
  constructor() {
    this.originalTexts = new Map();
    this.translatedNodes = new Set();
  }

  applyTranslation(textInfo, translatedText) {
    // DOM에 번역 결과 적용
  }

  restoreOriginal(textInfo) {
    // 원본 텍스트 복원
  }
}
```

## 🔧 API 요청 최적화

### 배치 처리 전략

```javascript
// 우선순위별 배치 처리
const batchStrategy = {
  high: {
    maxBatchSize: 5,
    maxDelay: 100, // ms
    priority: 1
  },
  medium: {
    maxBatchSize: 10,
    maxDelay: 500,
    priority: 2
  },
  low: {
    maxBatchSize: 20,
    maxDelay: 2000,
    priority: 3
  }
};
```

### 에러 처리 및 재시도

```javascript
// 에러 타입별 처리 전략
const errorHandling = {
  RATE_LIMIT: {
    retryAfter: 60000, // 1분 후 재시도
    backoffMultiplier: 2
  },
  NETWORK_ERROR: {
    maxRetries: 3,
    retryDelay: 1000
  },
  API_ERROR: {
    maxRetries: 1,
    fallback: 'show_error_message'
  }
};
```

## 📊 성능 최적화

### 캐싱 시스템

```javascript
// 번역 결과 캐싱
class TranslationCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 1000;
    this.expiryTime = 24 * 60 * 60 * 1000; // 24시간
  }

  get(text) {
    const entry = this.cache.get(text);
    if (entry && Date.now() - entry.timestamp < this.expiryTime) {
      return entry.translation;
    }
    return null;
  }

  set(text, translation) {
    // LRU 캐시 구현
  }
}
```

### 요청 최적화

```javascript
// 텍스트 전처리 및 최적화
const textOptimization = {
  // 중복 텍스트 제거
  deduplication: true,
  
  // 텍스트 병합 (연속된 문장)
  mergeAdjacent: true,
  
  // 최소 텍스트 길이
  minLength: 3,
  
  // 최대 배치 크기
  maxBatchSize: 20
};
```

## 🔐 보안 고려사항

### API 키 관리

```javascript
// background/storage.js (향후 구현 예정)
class SecureStorage {
  async setAPIKey(apiKey) {
    // 브라우저 저장소에 안전하게 저장
    await browser.storage.local.set({
      'gemini_api_key': apiKey
    });
  }

  async getAPIKey() {
    const result = await browser.storage.local.get('gemini_api_key');
    return result.gemini_api_key;
  }

  async validateAPIKey(apiKey) {
    // API 키 유효성 검사
  }
}
```

### 요청 보안

```javascript
// 안전한 API 요청 구성
const securityConfig = {
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Firefox-Translation-Extension/1.0'
  },
  timeout: 30000,
  validateStatus: (status) => status < 500
};
```

## 🎯 구현 우선순위

### Phase 1: 기본 번역 (다음 단계)
1. **API 클라이언트 구현**
   - 단일 텍스트 번역
   - 기본 에러 처리
   - API 키 관리

2. **DOM 업데이트**
   - 번역 결과 적용
   - 원본 텍스트 보존
   - 기본 스타일 유지

3. **메시지 통신 확장**
   - 번역 요청/응답 처리
   - 진행률 피드백

### Phase 2: 최적화
1. **배치 처리**
   - 우선순위별 배치
   - 요청 최적화
   - 캐싱 시스템

2. **에러 처리 강화**
   - 재시도 로직
   - 사용자 피드백
   - 오프라인 처리

### Phase 3: 고급 기능
1. **IntersectionObserver 통합**
   - 뷰포트 기반 처리
   - 동적 로딩

2. **사용자 인터페이스**
   - 설정 페이지
   - 번역 토글
   - 진행률 표시

## 📝 테스트 계획

### API 통합 테스트

```javascript
// tests/api-integration.test.js (향후 작성 예정)
describe('Gemini API Integration', () => {
  test('단일 텍스트 번역', async () => {
    const client = new GeminiAPIClient(TEST_API_KEY);
    const result = await client.translateSingle('Hello World', 'ko');
    expect(result).toContain('안녕');
  });

  test('배치 번역 처리', async () => {
    const texts = ['Hello', 'World', 'How are you?'];
    const results = await client.translateTexts(texts, 'ko');
    expect(results).toHaveLength(3);
  });

  test('API 키 검증', async () => {
    const client = new GeminiAPIClient('invalid-key');
    await expect(client.translateSingle('test')).rejects.toThrow();
  });
});
```

### 성능 테스트

```javascript
// 대용량 텍스트 처리 테스트
const performanceTest = {
  smallPage: 50,      // 텍스트 노드 수
  mediumPage: 200,
  largePage: 1000,
  
  maxResponseTime: 10000, // 10초
  maxMemoryUsage: 50,     // 50MB
  maxAPICallsPerMinute: 60
};
```

## 🚀 배포 준비

### 환경 설정

```javascript
// config/environment.js (향후 작성 예정)
const config = {
  development: {
    apiBaseURL: 'https://generativeai.googleapis.com/v1beta',
    timeout: 30000,
    retryAttempts: 3,
    enableLogging: true
  },
  production: {
    apiBaseURL: 'https://generativeai.googleapis.com/v1beta',
    timeout: 15000,
    retryAttempts: 2,
    enableLogging: false
  }
};
```

### 성능 모니터링

```javascript
// 성능 메트릭 수집
const metrics = {
  translationLatency: [],
  apiCallCount: 0,
  errorRate: 0,
  cacheHitRate: 0,
  memoryUsage: 0
};
```

이제 텍스트 추출 기능이 완료되었으므로, 다음 단계로 Gemini API 연동을 진행할 수 있습니다. 현재 구현된 TextExtractor에서 추출된 텍스트 정보를 활용하여 효율적인 번역 시스템을 구축할 예정입니다. 