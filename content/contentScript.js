/**
 * Content Script - 웹 페이지에 주입되어 실행
 * 텍스트 추출 및 번역 기능 담당
 */

class TranslationContentScript {
  constructor() {
    this.textExtractor = null;
    this.isEnabled = false;
    this.extractedTexts = [];
    
    this.init();
  }
  
  async init() {
    console.log('🔥 번역 애드온 Content Script 시작');
    
    // DOM이 로드되면 TextExtractor 초기화
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initTextExtractor());
    } else {
      this.initTextExtractor();
    }
    
    // Background script와의 메시지 통신 설정
    this.setupMessageListener();
  }
  
  initTextExtractor() {
    if (typeof TextExtractor !== 'undefined') {
      this.textExtractor = new TextExtractor();
      console.log('✅ TextExtractor 초기화 완료');
    } else {
      console.error('❌ TextExtractor를 찾을 수 없습니다');
    }
  }
  
  setupMessageListener() {
    // Background script로부터 메시지 수신
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('📩 메시지 수신:', message);
      
      switch (message.action) {
        case 'startTranslation':
          this.startTextExtraction();
          break;
        case 'extractTexts':
          this.extractAndDisplayTexts();
          break;
        default:
          console.log('알 수 없는 메시지:', message);
      }
      
      return true; // 비동기 응답을 위해
    });
  }
  
  /**
   * 텍스트 추출 시작
   */
  startTextExtraction() {
    if (!this.textExtractor) {
      console.error('❌ TextExtractor가 초기화되지 않았습니다');
      return;
    }
    
    console.log('🚀 텍스트 추출 시작...');
    
    // 우선순위별로 텍스트 추출
    this.extractTextsByPriority();
  }
  
  /**
   * 우선순위별 텍스트 추출 및 콘솔 출력
   */
  extractTextsByPriority() {
    const priorities = ['high', 'medium', 'low'];
    
    priorities.forEach(priority => {
      console.log(`\n=== ${priority.toUpperCase()} 우선순위 텍스트 ===`);
      
      const texts = this.textExtractor.extractTextByPriority(priority);
      
      if (texts.length === 0) {
        console.log(`${priority} 우선순위 텍스트가 없습니다.`);
        return;
      }
      
      console.log(`${priority} 우선순위 텍스트 ${texts.length}개 발견:`);
      
      texts.forEach((textInfo, index) => {
        console.group(`${index + 1}. [${textInfo.tagName}] ${textInfo.text.substring(0, 50)}${textInfo.text.length > 50 ? '...' : ''}`);
        console.log('전체 텍스트:', textInfo.text);
        console.log('태그:', textInfo.tagName);
        console.log('우선순위:', textInfo.priority);
        console.log('위치:', textInfo.position);
        console.log('요소:', textInfo.element);
        console.groupEnd();
      });
      
      // 전역 배열에 저장
      this.extractedTexts.push(...texts);
    });
  }
  
  /**
   * 모든 텍스트 추출 및 표시
   */
  extractAndDisplayTexts() {
    if (!this.textExtractor) {
      console.error('❌ TextExtractor가 초기화되지 않았습니다');
      return;
    }
    
    console.log('\n🔍 전체 텍스트 추출 결과:');
    
    const allTexts = this.textExtractor.extractAllTexts();
    const viewportTexts = this.textExtractor.extractViewportTexts();
    
    console.log(`📊 전체 추출된 텍스트: ${allTexts.length}개`);
    console.log(`👁️ 현재 화면에 보이는 텍스트: ${viewportTexts.length}개`);
    
    // 우선순위별 분류
    const byPriority = {
      high: allTexts.filter(t => t.priority === 'high'),
      medium: allTexts.filter(t => t.priority === 'medium'),
      low: allTexts.filter(t => t.priority === 'low')
    };
    
    console.log('\n📈 우선순위별 분류:');
    console.log(`🔴 High: ${byPriority.high.length}개`);
    console.log(`🟡 Medium: ${byPriority.medium.length}개`);
    console.log(`🟢 Low: ${byPriority.low.length}개`);
    
    // 상위 10개 텍스트만 상세 출력
    console.log('\n🎯 주요 텍스트 (상위 10개):');
    allTexts.slice(0, 10).forEach((textInfo, index) => {
      console.log(`${index + 1}. [${textInfo.priority}/${textInfo.tagName}] ${textInfo.text}`);
    });
    
    // 뷰포트 내 텍스트
    if (viewportTexts.length > 0) {
      console.log('\n👁️ 현재 화면의 텍스트:');
      viewportTexts.slice(0, 5).forEach((textInfo, index) => {
        console.log(`${index + 1}. [${textInfo.tagName}] ${textInfo.text}`);
      });
    }
    
    return {
      total: allTexts.length,
      viewport: viewportTexts.length,
      byPriority: {
        high: byPriority.high.length,
        medium: byPriority.medium.length,
        low: byPriority.low.length
      }
    };
  }
  
  /**
   * 페이지 정보 표시
   */
  displayPageInfo() {
    console.log('\n📄 페이지 정보:');
    console.log('URL:', window.location.href);
    console.log('제목:', document.title);
    console.log('언어:', document.documentElement.lang || '미지정');
    console.log('뷰포트 크기:', `${window.innerWidth}x${window.innerHeight}`);
  }
}

// Content Script 초기화
if (typeof browser === 'undefined') {
  // Chrome extension API 호환성
  window.browser = chrome;
}

// DOM이 준비되면 초기화
const translationScript = new TranslationContentScript(); 