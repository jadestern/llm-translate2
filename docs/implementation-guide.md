# 구현 가이드

## 📋 구현 현황

### ✅ 완료된 기능
- [x] 기본 Firefox 애드온 구조
- [x] 우선순위 기반 텍스트 추출
- [x] 텍스트 필터링 시스템
- [x] Content Script 주입 시스템
- [x] 테스트 페이지 및 환경
- [x] ViewportManager 뷰포트 관찰 시스템
- [x] 번역 대상 텍스트 시각적 표시 기능
- [x] 팝업 기반 번역 활성화/비활성화

### 🔄 진행 중
- [ ] Google Gemini API 연동
- [ ] 번역 결과 DOM 적용

### 📅 향후 계획
- [ ] Debounce 패턴 적용
- [ ] 배치 번역 처리
- [ ] 설정 페이지
- [ ] 컨텍스트 메뉴 복원 (선택사항)

## 🏗️ 핵심 클래스 인터페이스

### TextExtractor

```javascript
class TextExtractor {
  constructor()
  
  // 우선순위별 텍스트 추출
  extractTextByPriority(priority: 'high' | 'medium' | 'low'): TextInfo[]
  
  // 모든 텍스트 추출
  extractAllTexts(): TextInfo[]
  
  // 뷰포트 내 텍스트만 추출
  extractViewportTexts(): TextInfo[]
  
  // 텍스트 유효성 검사
  isValidText(text: string): boolean
  
  // 요소 추출 가능 여부 판단
  shouldExtractFromElement(element: HTMLElement): boolean
}

// TextInfo 인터페이스
interface TextInfo {
  text: string;
  node: Text;
  element: HTMLElement;
  priority: 'high' | 'medium' | 'low';
  tagName: string;
  position: {
    top: number;
    left: number;
    width: number;
    height: number;
    inViewport: boolean;
  };
}
```

### TranslationContentScript

```javascript
class TranslationContentScript {
  constructor()
  
  // 초기화
  init(): Promise<void>
  
  // TextExtractor 초기화
  initTextExtractor(): void
  
  // 메시지 리스너 설정
  setupMessageListener(): void
  
  // 텍스트 추출 시작
  startTextExtraction(): void
  
  // 우선순위별 텍스트 추출 및 출력
  extractTextsByPriority(): void
  
  // 모든 텍스트 추출 및 표시
  extractAndDisplayTexts(): ExtractionResult
  
  // 페이지 정보 표시
  displayPageInfo(): void
  
  // 번역 활성화 (팝업에서 호출)
  activateTranslation(): void
  
  // 번역 비활성화 (팝업에서 호출)
  deactivateTranslation(): void
  
  // 번역 대상 텍스트 시각적 표시
  showTranslationIndicators(): void
  
  // 번역 표시 제거
  hideTranslationIndicators(): void
  
  // 뷰포트 통계 전송
  sendViewportStats(): void
  
  // 뷰포트 테스트 실행
  runViewportTest(): void
}

// 추출 결과 인터페이스
interface ExtractionResult {
  total: number;
  viewport: number;
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
}
```

## 🔄 메시지 통신 API

### Background → Content Script

```javascript
// 번역 시작
{
  action: 'startTranslation'
}

// 텍스트 추출만 실행
{
  action: 'extractTexts'
}

// 번역 활성화 (팝업에서)
{
  action: 'activateTranslation'
}

// 번역 비활성화 (팝업에서)
{
  action: 'deactivateTranslation'
}

// 뷰포트 통계 요청
{
  action: 'getViewportStats'
}

// 뷰포트 테스트 실행
{
  action: 'runViewportTest'
}
```

### Content Script → Background

```javascript
// 텍스트 추출 완료
{
  action: 'textExtracted',
  data: TextInfo[]
}

// 번역 요청
{
  action: 'translationRequest',
  texts: string[]
}

// 뷰포트 통계 업데이트
{
  action: 'statsUpdate',
  stats: ViewportStats
}

// Content Script 주입 및 활성화 요청 (팝업에서)
{
  action: 'injectAndActivate',
  tabId: number
}
```

## 🎯 우선순위 설정

### 태그별 분류 규칙

```javascript
const priorityTags = {
  high: ['title', 'h1', 'h2', 'h3', 'main', 'article'],
  medium: ['h4', 'h5', 'h6', 'p', 'section', 'header', 'nav'],
  low: ['div', 'span', 'li', 'td', 'th', 'figcaption']
};
```

### 필터링 규칙

```javascript
// 제외할 태그
const excludedTags = [
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 
  'SELECT', 'OPTION', 'CODE', 'PRE', 'SVG', 'CANVAS'
];

// 제외할 클래스
const excludedClasses = [
  'notranslate', 'translate-no', 'skip-translate'
];
```

## 📝 텍스트 검증 로직

### 유효한 텍스트 조건
- 2글자 이상
- 숫자만 포함되지 않음
- 특수문자만 포함되지 않음
- 한글이 포함되지 않음 (중복 번역 방지)
- 단어 2개 이상 또는 10글자 이상 (문장 우선)

### 제외되는 패턴
```javascript
// 숫자만
/^\d+[\d\s\.,]*$/

// 특수문자만
/^[\s\-_=+*&^%$#@!~`\[\]{}|\\:";'<>?,.\/]*$/

// 한글 포함
/[가-힣]/
```

## 🚀 확장 방법

### 새로운 우선순위 추가
```javascript
// textExtractor.js에서 설정 수정
this.priorityTags.veryHigh = ['h1', 'title'];
this.priorityTags.veryLow = ['footer', 'aside'];
```

### 커스텀 필터 추가
```javascript
// 사용자 정의 검증 로직
customValidation(text, element) {
  // 커스텀 검증 로직
  return true;
}
```

### API 호출 추가 (향후)
```javascript
// background.js에서
async function translateTexts(texts) {
  // Gemini API 호출 로직
  return translatedTexts;
}
```

## 🧪 테스트 가이드

### 로컬 테스트 환경
```bash
# 웹서버 시작
pnpm dev

# 브라우저에서 접속
http://localhost:3000
```

### Firefox 애드온 로드
1. `about:debugging` 접속
2. "임시 확장 기능" → "로드"
3. `manifest.json` 선택

### 기능 테스트
1. 애드온 아이콘 클릭하여 팝업 열기
2. "번역 시작" 버튼 클릭
3. F12로 콘솔 확인하여 추출 결과 분석
4. 페이지에서 번역 대상 텍스트 시각적 표시 확인 (초록색 점선 + 🌐 아이콘)

### 컨텍스트 메뉴 테스트 (현재 비활성화)
- 우클릭 컨텍스트 메뉴는 현재 주석 처리됨
- 필요시 `background/background.js`에서 주석 해제하여 복원 가능

## 🔧 디버깅 팁

### 콘솔 로그 활용
- 우선순위별 분류 확인
- 필터링된 텍스트 확인
- 요소 위치 정보 확인

### 일반적인 문제
- Content Script 주입 실패 → 권한 확인
- 텍스트 추출 안됨 → 필터링 규칙 확인
- 메시지 통신 오류 → 리스너 설정 확인 