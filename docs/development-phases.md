# 개발 단계별 계획

## 📋 전체 개발 계획

### Phase 1: 텍스트 추출 시스템 ✅ (완료)
기본적인 애드온 구조와 효율적인 텍스트 추출 시스템 구축

### Phase 2: 번역 API 연동 🔄 (다음 단계)
Google Gemini API를 활용한 실제 번역 기능 구현

### Phase 3: 성능 최적화 📅 (향후)
IntersectionObserver와 Debounce 패턴을 활용한 성능 개선

### Phase 4: 사용자 경험 📅 (향후)
완성도 높은 UI/UX와 고급 기능 제공

### 핵심 개발 원칙
1. **우선순위 기반 개발**: 중요한 기능부터 단계별 구현
2. **사용자 피드백**: 각 단계별 테스트 및 피드백 수집
3. **성능 우선**: 안정성과 성능을 우선시한 개발
4. **확장 가능성**: 추후 기능 확장을 고려한 아키텍처

---

## 📋 Phase 1: MVP (Minimum Viable Product)

> **목표**: 기본적인 웹 페이지 번역 기능 구현  
> **기간**: 2-3주  
> **핵심**: 사용자가 실제로 사용할 수 있는 최소 기능

### 1.1 기반 구조 구축 (1주차)

#### 필수 구현 사항
- [ ] **manifest.json 설정**
  - 확장 프로그램 메타데이터
  - 필요한 권한 정의 (`activeTab`, `contextMenus`, `storage`)
  - Content script 및 background script 등록

- [ ] **background.js 구현**
  - 컨텍스트 메뉴 생성 ("페이지 번역" 메뉴)
  - 사용자 액션 감지 및 content script 주입
  - 기본 메시지 패싱 구조

- [ ] **기본 content script 구조**
  - `translator.js` - 메인 컨트롤러
  - `textExtractor.js` - 기본 텍스트 추출
  - `apiClient.js` - Gemini API 연동

#### 검증 기준
- [ ] Firefox에서 확장 프로그램 로드 성공
- [ ] 컨텍스트 메뉴 표시 및 클릭 동작
- [ ] Content script 주입 및 기본 DOM 접근 확인

### 1.2 기본 번역 기능 (2주차)

#### 핵심 구현
- [ ] **텍스트 추출 로직**
  ```javascript
  // 기본 텍스트 노드 추출 (복잡한 필터링 없이)
  function extractBasicTextNodes() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );
    // 기본 구현...
  }
  ```

- [ ] **Gemini API 연동**
  - API 키 입력 받기 (임시로 prompt 사용)
  - 기본 번역 요청 및 응답 처리
  - 간단한 에러 처리

- [ ] **텍스트 교체 구현**
  - 원본 텍스트를 번역된 텍스트로 교체
  - 기본적인 DOM 조작

#### 번역 프롬프트 (v1)
```
영어 텍스트를 자연스러운 한국어로 번역해주세요.

번역할 텍스트: [INPUT_TEXT]

번역 결과만 응답해주세요.
```

#### 검증 기준
- [ ] 간단한 웹 페이지에서 영어 → 한국어 번역 성공
- [ ] API 키 입력 및 저장 기능
- [ ] 기본적인 에러 처리 (API 키 없음, 네트워크 오류)

### 1.3 MVP 완성 및 테스트 (3주차)

#### 마무리 작업
- [ ] **설정 페이지 기본 구현**
  - `options.html/js` - API 키 설정
  - Chrome Storage API 활용

- [ ] **기본 UI/UX**
  - 번역 진행 중 표시 (간단한 console.log)
  - 완료 알림

- [ ] **안정성 개선**
  - 기본 에러 핸들링
  - 페이지별 동작 테스트

#### 테스트 사이트
1. **Wikipedia** - 긴 텍스트 문서
2. **GitHub** - 기술 용어 포함
3. **뉴스 사이트** - 다양한 HTML 구조

#### MVP 완료 기준
- [ ] 5개 이상의 다른 웹사이트에서 정상 작동
- [ ] API 키 설정 및 저장 기능 완성
- [ ] 기본적인 번역 품질 확보

---

## ⚡ Phase 2: 최적화 및 사용자 경험 개선

> **목표**: 성능 최적화 및 실사용 가능한 수준의 UX 구현  
> **기간**: 2-3주  
> **핵심**: IntersectionObserver, Debounce, 배치 처리

### 2.1 성능 최적화 (1주차)

#### 핵심 개선 사항
- [ ] **IntersectionObserver 구현**
  ```javascript
  class ViewportManager {
    constructor() {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        { rootMargin: '100px', threshold: 0.1 }
      );
    }
  }
  ```

- [ ] **뷰포트 우선순위 처리**
  - 현재 보이는 텍스트 우선 번역
  - 화면 밖 텍스트는 후순위 처리

- [ ] **텍스트 필터링 개선**
  - Script, style, noscript 태그 제외
  - 짧은 텍스트 (2글자 미만) 필터링
  - 숫자만 포함된 텍스트 제외

#### 성능 지표 목표
- [ ] 일반 페이지 번역 시작 시간: 3초 이내
- [ ] 뷰포트 내 텍스트 번역 완료: 10초 이내
- [ ] 메모리 사용량: 50MB 이하 유지

### 2.2 Debounce 및 스크롤 최적화 (1주차)

#### 스크롤 이벤트 처리
- [ ] **Debounce 구현**
  ```javascript
  class Debouncer {
    debounce(func, delay = 500) {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
      };
    }
  }
  ```

- [ ] **자동 스크롤 감지**
  - 스크롤 멈춤 감지 (500ms debounce)
  - 새로운 뷰포트 영역 자동 번역
  - 중복 번역 방지 로직

#### 배치 처리 시스템
- [ ] **번역 큐 구현**
  - 우선순위 큐 (뷰포트 vs 백그라운드)
  - 배치 크기 최적화 (10-15개 텍스트)
  - 동시 요청 수 제한 (최대 3개)

### 2.3 사용자 인터페이스 개선 (1주차)

#### 시각적 피드백
- [ ] **번역 상태 표시**
  - 진행률 표시 (간단한 프로그레스 바)
  - 번역 중인 텍스트 하이라이트
  - 완료된 텍스트 구분 표시

- [ ] **팝업 UI 구현**
  - `popup.html/js` - 번역 토글 버튼
  - 현재 상태 표시
  - 간단한 설정 바로가기

#### 에러 처리 개선
- [ ] **사용자 친화적 에러 메시지**
  - API 키 오류: "설정에서 API 키를 확인해주세요"
  - 네트워크 오류: "인터넷 연결을 확인해주세요"
  - Rate limit: "잠시 후 다시 시도해주세요"

---

## 🔥 Phase 3: 고급 기능 및 확장성

> **목표**: 프로덕션 레벨의 완성도 및 확장 가능한 구조  
> **기간**: 2-3주  
> **핵심**: 번역 품질 향상, 다국어 준비, 고급 기능

### 3.1 번역 품질 및 프롬프트 최적화 (1주차)

#### 고급 프롬프트 엔지니어링
- [ ] **컨텍스트별 번역 프롬프트**
  ```javascript
  const prompts = {
    'e-commerce': '쇼핑몰 컨텍스트에 맞는 번역...',
    'news': '뉴스 기사에 적합한 번역...',
    'documentation': '기술 문서 번역 가이드...'
  };
  ```

- [ ] **페이지 유형 자동 감지**
  - URL 패턴 분석
  - 메타 태그 확인
  - 콘텐츠 구조 분석

- [ ] **번역 캐시 시스템**
  - 동일 텍스트 재번역 방지
  - LRU 캐시 구현 (최대 1000 항목)
  - 세션별 캐시 관리

#### 번역 품질 검증
- [ ] **번역 결과 검증 로직**
  - 한글 포함 여부 확인
  - 원본 길이 대비 번역 길이 비율 검증
  - 신뢰도 스코어 계산

### 3.2 고급 UI/UX 및 설정 (1주차)

#### 설정 페이지 고도화
- [ ] **고급 설정 옵션**
  - 번역 속도 vs 품질 선택
  - 번역할 요소 유형 선택 (버튼, 본문, 메뉴 등)
  - 제외할 사이트 목록

- [ ] **사용 통계 및 모니터링**
  - 번역 완료 횟수
  - 평균 번역 시간
  - API 사용량 추적

#### 접근성 및 사용성
- [ ] **키보드 단축키**
  - Ctrl+Shift+T: 번역 토글
  - Ctrl+Shift+R: 번역 재시작

- [ ] **다크 모드 지원**
  - 진행률 표시 UI 다크 모드
  - 설정 페이지 테마 지원

### 3.3 확장성 및 다국어 준비 (1주차)

#### 다국어 지원 구조
- [ ] **언어 감지 기능**
  ```javascript
  class LanguageDetector {
    detectLanguage(text) {
      // 간단한 언어 감지 로직
      if (/[가-힣]/.test(text)) return 'ko';
      if (/[一-龯]/.test(text)) return 'zh';
      return 'en'; // 기본값
    }
  }
  ```

- [ ] **타겟 언어 선택**
  - 설정에서 목표 언어 선택 옵션
  - 언어별 번역 프롬프트 준비

#### 추가 번역 엔진 준비
- [ ] **API 클라이언트 팩토리 패턴**
  ```javascript
  class TranslationClientFactory {
    static create(type, config) {
      switch (type) {
        case 'gemini': return new GeminiClient(config);
        case 'openai': return new OpenAIClient(config);
        default: throw new Error('Unsupported API type');
      }
    }
  }
  ```

---

## 📊 각 단계별 검증 및 테스트

### Phase 1 검증 기준
- [ ] 기본 번역 기능 동작
- [ ] 5개 이상 웹사이트에서 테스트 통과
- [ ] API 키 설정 및 저장 기능
- [ ] 기본 에러 처리

### Phase 2 검증 기준
- [ ] 뷰포트 기반 우선순위 처리 확인
- [ ] 스크롤 이벤트 debounce 동작
- [ ] 번역 성능 목표 달성 (10초 이내)
- [ ] 사용자 피드백 UI 구현

### Phase 3 검증 기준
- [ ] 번역 품질 향상 확인
- [ ] 고급 설정 기능 완성
- [ ] 다국어 지원 구조 준비
- [ ] 전체 시스템 안정성 검증

## 🔧 개발 도구 및 환경

### 필수 개발 도구
- **web-ext**: Firefox 확장 개발 및 테스트
- **Git**: 버전 관리
- **VSCode**: 개발 환경

### 테스트 환경
- **Firefox Developer Edition**: 메인 테스트 브라우저
- **다양한 웹사이트**: Wikipedia, GitHub, 뉴스 사이트, 쇼핑몰 등

### 배포 준비
- **Firefox Add-ons**: 스토어 등록 준비
- **사용자 가이드**: 설치 및 사용 방법 문서화

## 📈 성공 지표

### 기술적 지표
- **번역 정확도**: 사용자 만족도 80% 이상
- **성능**: 일반 페이지 번역 완료 10초 이내
- **안정성**: 크래시 없이 연속 사용 1시간 이상

### 사용자 경험 지표
- **사용 편의성**: 3번의 클릭 이내로 번역 시작
- **번역 품질**: 수정 없이 읽을 수 있는 수준
- **응답성**: 사용자 액션에 3초 이내 반응 