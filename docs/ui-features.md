# UI 기능 가이드

## 🎨 시각적 표시 시스템

### 번역 대상 텍스트 표시
번역이 활성화되면 번역 가능한 텍스트 요소에 다음과 같은 시각적 표시가 추가됩니다:

#### 스타일 속성
- **테두리**: 1px 초록색 점선 (`#4CAF50`)
- **배경색**: 반투명 초록색 (`rgba(76, 175, 80, 0.1)`)
- **아이콘**: 🌐 (우상단 모서리)
- **아이콘 스타일**: 
  - 배경: 초록색 원형 (`#4CAF50`)
  - 크기: 16x16px
  - 위치: 요소 우상단 (-8px, -8px)
  - z-index: 9999

#### CSS 클래스
```css
.translation-target {
  border: 1px dashed #4CAF50 !important;
  background: rgba(76, 175, 80, 0.1) !important;
  position: relative !important;
}

.translation-target::after {
  content: "🌐";
  position: absolute;
  top: -8px;
  right: -8px;
  background: #4CAF50;
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
```

### 표시 제한
- 성능 최적화를 위해 상위 10개 우선순위 텍스트에만 표시
- 우선순위 순서: High → Medium → Low

## 🔄 상태 관리

#### API 인터페이스
```typescript
interface TranslationContentScript {
  // 활성화/비활성화
  activateTranslation(): void;
  deactivateTranslation(): void;
  
  // 시각적 표시 관리
  showTranslationIndicators(): void;
  hideTranslationIndicators(): void;
}
```

#### 상태 흐름
1. **활성화**: `isEnabled = true` → 텍스트 추출 → 시각적 표시
2. **비활성화**: `isEnabled = false` → 뷰포트 정리 → 표시 제거

## 🎯 사용자 경험

### 장점
- **즉시 피드백**: 번역 활성화 시 즉시 대상 텍스트 확인 가능
- **명확한 구분**: 번역 대상과 비대상 텍스트 명확히 구분
- **일관된 디자인**: 초록색 테마로 번역 기능 통합

### 성능 고려사항
- 상위 10개 요소만 표시하여 DOM 조작 최소화
- CSS !important 사용으로 기존 스타일 충돌 방지
- z-index 9999로 아이콘 가시성 보장

## 🔧 커스터마이징

### 설정 가능한 속성
- **테마 색상**: `#4CAF50` (초록색)
- **배경 투명도**: `0.1` (10% 투명도)
- **표시 개수**: `10` (상위 N개 요소)
- **아이콘**: `🌐` (지구본)

### 확장 포인트
- CSS 변수를 통한 테마 커스터마이징
- 설정 패널을 통한 동적 조정
- 사용자 정의 아이콘 지원

## 🚀 향후 개선사항

### 계획된 기능
- [ ] 번역 진행 상태 표시 (로딩 애니메이션)
- [ ] 번역 완료 후 원문/번역문 토글 기능
- [ ] 사용자 설정 가능한 테마 색상
- [ ] 번역 품질 표시 (신뢰도 점수)

### 고려사항
- 모바일 환경에서의 터치 인터페이스 최적화
- 다양한 웹사이트 레이아웃과의 호환성
- 접근성(Accessibility) 향상