# 웹 번역기 Firefox 애드온

웹 페이지의 영어 텍스트를 한국어로 번역하는 Firefox 확장 프로그램입니다.

## 🚀 빠른 시작

### 개발 환경에서 테스트

**1. 테스트 서버 실행 (선택사항)**
```bash
pnpm install
pnpm dev
```
브라우저에서 `http://localhost:3000` 접속

**2. Firefox 애드온 로드**
1. Firefox에서 `about:debugging` 이동
2. "임시 확장 기능 로드" 클릭
3. 프로젝트의 `manifest.json` 파일 선택
4. 웹 페이지에서 우클릭 → "이 페이지 번역하기" 메뉴 확인

자세한 개발 가이드는 [DEVELOPMENT.md](DEVELOPMENT.md)를 참고하세요.

## 📋 현재 상태

**개발 초기 단계**: 기본 구조만 구현된 상태입니다.

- ✅ 기본 확장 프로그램 구조
- ✅ 컨텍스트 메뉴 추가
- ✅ 테스트용 웹페이지 및 로컬 서버
- ✅ 애드온 아이콘 설정
- ⏳ 텍스트 추출 기능 (예정)
- ⏳ Gemini API 연동 (예정)
- ⏳ 번역 기능 (예정)

## 🎯 목표 기능

- 웹 페이지 텍스트 실시간 번역 (영어 → 한국어)
- 뷰포트 기반 우선순위 번역
- Google Gemini API 활용
- 자연스러운 번역 품질

## 📖 문서

- [DEVELOPMENT.md](DEVELOPMENT.md) - 개발 및 테스트 가이드
- [docs/](docs/) - 상세 설계 문서들

---

> 이 프로젝트는 현재 개발 중입니다. 단계별로 기능을 추가해나갈 예정입니다. 