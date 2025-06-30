# 개발 가이드

## 🚀 Firefox에서 애드온 테스트하기

### 1. 임시 애드온 로드
1. Firefox를 열고 주소창에 `about:debugging` 입력
2. "이 Firefox"를 클릭
3. "임시 확장 기능 로드" 버튼 클릭
4. 이 프로젝트의 `manifest.json` 파일 선택

### 2. 테스트 서버 실행 (선택사항)
로컬 테스트 페이지를 사용하려면:
```bash
pnpm install
pnpm dev
```
브라우저에서 `http://localhost:3000` 접속

### 3. 동작 확인
1. 테스트 페이지 또는 아무 웹 페이지에서 우클릭
2. 컨텍스트 메뉴에 "이 페이지 번역하기" 항목이 보이는지 확인
3. 메뉴 클릭 시 콘솔에 로그가 출력되는지 확인
   - `F12` → 콘솔 탭에서 확인

### 4. 디버깅
- **콘솔 로그 확인**: `F12` → 콘솔 탭
- **백그라운드 스크립트 디버깅**: `about:debugging` → 해당 확장의 "검사" 버튼 클릭

### 5. 코드 수정 후 적용
1. 코드 수정
2. `about:debugging`에서 "새로고침" 버튼 클릭
3. 또는 "제거" 후 다시 로드

## 📁 현재 파일 구조
```
llm-translate2/
├── manifest.json           # 확장 프로그램 설정
├── background/
│   └── background.js      # 백그라운드 스크립트
├── icons/
│   ├── icon-128.png       # 애드온 아이콘 (모든 사이즈)
│   └── README.md          # 아이콘 파일 안내
├── test-pages/
│   └── index.html         # 테스트용 웹페이지
├── package.json           # Node.js 프로젝트 설정
├── DEVELOPMENT.md         # 이 파일
└── docs/                  # 상세 설계 문서들
```

## ✅ 현재 구현된 기능
- [x] 기본 manifest.json 설정
- [x] 컨텍스트 메뉴 생성
- [x] 메뉴 클릭 이벤트 처리 (콘솔 로그만)
- [x] 테스트용 웹페이지 (`test-pages/index.html`)
- [x] 로컬 웹서버 설정 (pnpm + serve)
- [x] 애드온 아이콘 설정 (`icon-128.png`)
- [ ] 실제 번역 기능 (다음 단계에서 구현)

## 🔧 다음 단계 개발 계획
1. Content script 추가
2. 텍스트 추출 로직
3. Gemini API 연동
4. 설정 페이지 