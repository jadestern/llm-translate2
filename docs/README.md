# LLM 번역 Firefox 애드온

## 📋 프로젝트 개요

영어 웹 페이지를 한국어로 자동 번역하는 Firefox 애드온입니다. 우선순위 기반 텍스트 추출과 Google Gemini Flash 2.5 API를 활용하여 효율적이고 정확한 번역을 제공합니다.

## 🎯 핵심 특징

### ✅ 현재 구현된 기능

- **우선순위 기반 텍스트 추출**: 페이지 요소의 중요도에 따른 3단계 분류
- **지능적 필터링**: 번역 불필요한 텍스트 자동 제외 (숫자, 특수문자, 한글 등)
- **컨텍스트 메뉴 통합**: 우클릭으로 간편한 번역 실행
- **상세한 디버깅**: 콘솔을 통한 추출 결과 확인
- **완전한 테스트 환경**: 로컬 서버와 테스트 페이지 제공

### 🔄 개발 예정 기능

- **Google Gemini Flash 2.5 연동**: 고품질 한국어 번역
- **DOM 실시간 업데이트**: 번역 결과를 페이지에 직접 적용
- **성능 최적화**: IntersectionObserver와 Debounce 패턴 활용
- **사용자 인터페이스**: 설정 페이지 및 번역 상태 관리

## 🚀 빠른 시작

### 1. 개발 환경 설정

```bash
# 저장소 클론
git clone [repository-url]
cd llm-translate2

# 의존성 설치
pnpm install

# 로컬 테스트 서버 시작
pnpm dev
```

### 2. Firefox 애드온 로드

1. Firefox에서 `about:debugging` 접속
2. "임시 확장 기능" → "로드" 클릭
3. 프로젝트 루트의 `manifest.json` 선택

### 3. 기능 테스트

1. 브라우저에서 `http://localhost:3000` 접속
2. 테스트 페이지에서 우클릭
3. "이 페이지 번역하기" 선택
4. F12로 개발자 도구 열고 콘솔 확인

## 📁 파일 구조

```
llm-translate2/
├── manifest.json              # Firefox 애드온 설정
├── background/
│   └── background.js         # 백그라운드 스크립트
├── content/
│   ├── textExtractor.js      # 텍스트 추출 엔진
│   └── contentScript.js      # 페이지 주입 스크립트
├── icons/
│   └── icon-128.png         # 애드온 아이콘
├── test-pages/
│   └── index.html           # 테스트 페이지
├── docs/                    # 프로젝트 문서
└── package.json            # 개발 환경 설정
```

## 🔧 기술 스택

### 현재 사용 중
- **Firefox WebExtensions API**: Manifest V2 기반
- **JavaScript ES6+**: 클래스 기반 모듈 설계
- **DOM API**: 효율적인 텍스트 추출
- **pnpm**: 패키지 관리 및 개발 서버

### 향후 도입 예정
- **Google Gemini API**: AI 기반 번역
- **IntersectionObserver**: 뷰포트 최적화
- **Web Storage API**: 설정 및 캐시 관리

## 📊 텍스트 추출 시스템

### 우선순위 분류

| 우선순위 | 대상 요소 | 설명 |
|---------|-----------|------|
| **High** | `title`, `h1-h3`, `main`, `article` | 페이지 핵심 내용 |
| **Medium** | `h4-h6`, `p`, `section`, `header`, `nav` | 보조 정보 및 네비게이션 |
| **Low** | `div`, `span`, `li`, `td`, `th` | 세부 정보 및 구조적 요소 |

### 필터링 규칙

- ✅ **포함**: 2단어 이상의 영어 문장
- ❌ **제외**: 숫자만, 특수문자만, 한글 포함, 단어 하나
- 🚫 **스킵**: `<script>`, `<style>`, `.notranslate` 클래스

## 🧪 테스트 가이드

### 콘솔 출력 예시

```
🔥 번역 애드온 Content Script 시작
✅ TextExtractor 초기화 완료
🚀 텍스트 추출 시작...

=== HIGH 우선순위 텍스트 ===
high 우선순위 텍스트 3개 발견:
1. [H1] Advanced Web Translation Test
2. [H2] Priority Testing: High Priority Elements  
3. [H3] Main Article Title

📊 전체 추출된 텍스트: 25개
👁️ 현재 화면에 보이는 텍스트: 15개
🔴 High: 3개 🟡 Medium: 12개 🟢 Low: 10개
```

### 테스트 시나리오

1. **기본 기능**: 텍스트 추출 및 우선순위 분류
2. **필터링**: 불필요한 텍스트 제외 확인
3. **다양한 페이지**: 뉴스, 블로그, 상품 페이지 등
4. **에러 처리**: 권한 오류, 스크립트 주입 실패 등

## 📈 개발 로드맵

### Phase 1: 텍스트 추출 ✅ (완료)
- [x] 우선순위 기반 텍스트 추출
- [x] 지능적 필터링 시스템
- [x] Content Script 주입
- [x] 테스트 환경 구축

### Phase 2: 번역 연동 🔄 (진행 예정)
- [ ] Gemini API 클라이언트 구현
- [ ] 배치 번역 처리
- [ ] DOM 업데이트 시스템
- [ ] 에러 처리 및 재시도

### Phase 3: 성능 최적화 📅 (향후)
- [ ] IntersectionObserver 통합
- [ ] 번역 결과 캐싱
- [ ] Debounce 패턴 적용
- [ ] 메모리 사용량 최적화

### Phase 4: 사용자 경험 📅 (향후)
- [ ] 설정 페이지 UI
- [ ] 번역 진행률 표시
- [ ] 원본/번역 토글
- [ ] 다국어 지원 확장

## 🔧 개발 가이드

### 새로운 필터링 규칙 추가

```javascript
// content/textExtractor.js에서
isValidText(text) {
  // 커스텀 필터링 로직 추가
  if (yourCustomCondition(text)) {
    return false;
  }
  return true;
}
```

### 우선순위 태그 수정

```javascript
// TextExtractor 생성자에서
this.priorityTags = {
  high: ['title', 'h1', 'h2', 'h3', 'main', 'article'],
  medium: ['h4', 'h5', 'h6', 'p', 'section', 'header', 'nav'],
  low: ['div', 'span', 'li', 'td', 'th', 'figcaption'],
  custom: ['your-tags'] // 새로운 우선순위 추가
};
```

## 🐛 문제 해결

### 일반적인 문제

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| 텍스트가 추출되지 않음 | 필터링 규칙에 걸림 | 콘솔 로그 확인, 필터링 조건 완화 |
| 컨텍스트 메뉴가 안 보임 | 권한 문제 | manifest.json 권한 확인 |
| Content Script 오류 | 주입 실패 | about:debugging에서 애드온 재로드 |

### 디버깅 팁

```javascript
// 상세 로깅 활성화
const DEBUG = true;
if (DEBUG) {
  console.log('디버그 정보:', data);
}
```

## 📚 관련 문서

- [📖 기술 요구사항](requirements.md)
- [🏗️ 시스템 아키텍처](architecture.md)
- [🔧 구현 가이드](implementation-guide.md)
- [🔌 API 연동 가이드](api-integration.md)
- [📅 개발 단계 계획](development-phases.md)

## 🤝 기여하기

1. 이슈 확인 및 버그 리포트
2. 기능 제안 및 개선사항
3. 코드 리뷰 및 테스트
4. 문서 개선 및 번역

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

**현재 상태**: 텍스트 추출 완료 ✅ | **다음 단계**: Gemini API 연동 🔄
