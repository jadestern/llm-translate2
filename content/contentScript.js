/**
 * Content Script - 웹 페이지에 주입되어 실행
 * 텍스트 추출 및 번역 기능 담당
 */

class TranslationContentScript {
  constructor() {
    this.textExtractor = null;
    this.viewportManager = null;
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
    
    // 저장된 번역 상태 확인하여 자동 활성화
    this.checkStoredTranslationState();
  }

  initTextExtractor() {
    if (typeof TextExtractor !== 'undefined') {
      this.textExtractor = new TextExtractor();
      console.log('✅ TextExtractor 초기화 완료');

      // ViewportManager는 번역 활성화 시에만 초기화
      console.log('📋 ViewportManager는 번역 활성화 시에 초기화됩니다');
    } else {
      console.error('❌ TextExtractor를 찾을 수 없습니다');
    }
  }

  setupMessageListener() {
    // Background script로부터 메시지 수신
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('📩 메시지 수신:', message);

      switch (message.action) {
        case 'ping':
          // Content Script 존재 확인용
          sendResponse({ pong: true });
          break;
        case 'startTranslation':
          this.startTextExtraction();
          break;
        case 'extractTexts':
          this.extractAndDisplayTexts();
          break;
        case 'activateTranslation':
          this.activateTranslation();
          break;
        case 'deactivateTranslation':
          this.deactivateTranslation();
          break;
        case 'getViewportStats':
          const stats = this.getViewportStats();
          sendResponse(stats);
          break;
        case 'runViewportTest':
          this.runViewportTest();
          break;
        default:
          console.log('알 수 없는 메시지:', message);
      }

      return true; // 비동기 응답을 위해
    });
  }

  /**
   * 텍스트 추출 시작 (ViewportManager 사용)
   */
  startTextExtraction() {
    if (!this.textExtractor || !this.viewportManager) {
      console.error('❌ TextExtractor 또는 ViewportManager가 초기화되지 않았습니다');
      return;
    }

    console.log('🚀 뷰포트 기반 텍스트 추출 시작...');

    // ViewportManager로 관찰 시작
    const observedCount = this.viewportManager.startObserving();

    // 현재 뷰포트 상태 출력
    setTimeout(() => {
      const info = this.viewportManager.getViewportInfo();
      console.log('📊 뷰포트 상태:', info);
    }, 1000);

    return observedCount;
  }

  /**
   * 우선순위별 텍스트 추출 및 콘솔 출력 (새로운 방식 포함)
   */
  extractTextsByPriority() {
    const priorities = ['high', 'medium', 'low'];

    console.log('\n🧪 === 새로운 완전한 문장 추출 테스트 ===');

    // 문제가 되는 특정 li 요소들 먼저 테스트
    const problemElements = document.querySelectorAll('ol li');
    console.log(`\n🔍 문제 요소 분석: ${problemElements.length}개의 ol > li 요소 발견`);

    Array.from(problemElements).slice(0, 3).forEach((element, index) => {
      console.log(`\n📝 문제 요소 ${index + 1}: ${element.tagName}`);
      console.log(`원본 HTML: ${element.innerHTML}`);
      console.log(`텍스트 내용: "${element.textContent.trim()}"`);

      // 개별 노드 분석
      console.log('자식 노드 분석:');
      Array.from(element.childNodes).forEach((node, i) => {
        if (node.nodeType === Node.TEXT_NODE) {
          console.log(`  ${i}: TEXT_NODE: "${node.textContent.trim()}"`);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          console.log(`  ${i}: ELEMENT_NODE: ${node.tagName} = "${node.textContent.trim()}"`);
        }
      });

      try {
        const extractedTexts = this.textExtractor.extractTextForTranslation(element);
        console.log(`추출 결과: ${extractedTexts.length}개`);
        extractedTexts.forEach((textInfo, i) => {
          console.log(`  ${i + 1}. "${textInfo.textForTranslation || textInfo.text}"`);
          if (textInfo.needsHtmlRestoration) {
            console.log(`     🏷️ HTML 복원 필요`);
          }
        });

        // isValidText 체크
        const fullText = element.textContent.trim();
        console.log(`isValidText("${fullText}"): ${this.textExtractor.isValidText(fullText)}`);

      } catch (error) {
        console.error(`❌ 텍스트 추출 실패:`, error);
      }
    });

    // 기존 테스트도 계속
    const testElements = document.querySelectorAll('li, p, h1, h2, h3, h4, h5');
    Array.from(testElements).slice(3, 8).forEach((element, index) => {
      console.log(`\n📝 테스트 요소 ${index + 1}: ${element.tagName}`);
      console.log(`원본 HTML: ${element.innerHTML.substring(0, 100)}...`);

      try {
        const extractedTexts = this.textExtractor.extractTextForTranslation(element);
        extractedTexts.forEach((textInfo, i) => {
          console.log(`  ${i + 1}. 추출된 텍스트: "${textInfo.textForTranslation || textInfo.text}"`);
          if (textInfo.needsHtmlRestoration) {
            console.log(`     🏷️ HTML 복원 필요, 플레이스홀더 수: ${textInfo.placeholders?.length || 0}`);
            if (textInfo.placeholders && textInfo.placeholders.length > 0) {
              textInfo.placeholders.forEach(p => {
                console.log(`       - ${p.placeholder} → ${p.originalTag}`);
              });
            }
          }
        });
      } catch (error) {
        console.error(`❌ 텍스트 추출 실패:`, error);
      }
    });

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

    // Character count calculations
    const totalCharacters = allTexts.reduce((sum, textInfo) => sum + (textInfo.text?.length || 0), 0);
    const viewportCharacters = viewportTexts.reduce((sum, textInfo) => sum + (textInfo.text?.length || 0), 0);
    const priorityCharacters = {
      high: byPriority.high.reduce((sum, textInfo) => sum + (textInfo.text?.length || 0), 0),
      medium: byPriority.medium.reduce((sum, textInfo) => sum + (textInfo.text?.length || 0), 0),
      low: byPriority.low.reduce((sum, textInfo) => sum + (textInfo.text?.length || 0), 0)
    };

    return {
      total: allTexts.length,
      viewport: viewportTexts.length,
      byPriority: {
        high: byPriority.high.length,
        medium: byPriority.medium.length,
        low: byPriority.low.length
      },
      totalCharacters: totalCharacters,
      viewportCharacters: viewportCharacters,
      byPriorityCharacters: priorityCharacters
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

  /**
   * 팝업에서 번역 활성화 요청
   */
  activateTranslation() {
    console.log('🎯 팝업에서 번역 활성화 요청');
    this.isEnabled = true;

    // ViewportManager 초기화 (활성화 시에만)
    if (!this.viewportManager && typeof ViewportManager !== 'undefined') {
      this.viewportManager = new ViewportManager(this.textExtractor);
      console.log('✅ ViewportManager 초기화 완료');
    } else if (!this.viewportManager) {
      console.error('❌ ViewportManager를 찾을 수 없습니다');
      return;
    }

    this.startTextExtraction();
    
    // 디버깅: 문제가 되는 li 요소들 직접 테스트
    this.debugLiElements();
    
    this.showTranslationIndicators();
    
    // 번역 활성화 시 즉시 통계 업데이트
    setTimeout(() => {
      this.sendViewportStats();
    }, 100);
  }

  /**
   * li 요소들을 직접 테스트하는 디버깅 함수
   */
  debugLiElements() {
    console.log('🔍 === LI 요소 디버깅 시작 ===');
    
    const liElements = document.querySelectorAll('ol li');
    console.log(`발견된 ol > li 요소: ${liElements.length}개`);
    
    Array.from(liElements).slice(0, 3).forEach((element, index) => {
      console.log(`\n📝 LI 요소 ${index + 1}:`);
      console.log(`HTML: ${element.innerHTML}`);
      console.log(`텍스트: "${element.textContent.trim()}"`);
      
      // 직접 텍스트 추출 테스트
      try {
        const texts = this.textExtractor.extractTextFromElement(element);
        console.log(`직접 추출 결과: ${texts.length}개`);
        texts.forEach((t, i) => console.log(`  ${i+1}. "${t.text}"`));
        
        // isValidText 체크
        const fullText = element.textContent.trim();
        const isValid = this.textExtractor.isValidText(fullText);
        console.log(`isValidText("${fullText}"): ${isValid}`);
        
        // 우선순위 확인
        const priority = this.textExtractor.priorityTags.low.includes('li');
        console.log(`li가 low 우선순위에 포함됨: ${priority}`);
        
      } catch (error) {
        console.error(`❌ 추출 실패:`, error);
      }
    });
    
    // extractTextByPriority로 low 우선순위 직접 테스트
    console.log('\n🎯 low 우선순위 직접 테스트:');
    try {
      const lowTexts = this.textExtractor.extractTextByPriority('low');
      console.log(`low 우선순위 텍스트: ${lowTexts.length}개`);
      lowTexts.slice(0, 3).forEach((t, i) => {
        console.log(`  ${i+1}. [${t.tagName}] "${t.text.substring(0, 50)}..."`);
      });
    } catch (error) {
      console.error('❌ low 우선순위 추출 실패:', error);
    }
  }

  /**
   * 번역 가능한 텍스트에 시각적 표시 추가
   */
  showTranslationIndicators() {
    console.log('🎯 showTranslationIndicators 시작...');
    
    if (!this.textExtractor) {
      console.error('❌ textExtractor가 없습니다');
      return;
    }

    const allTexts = this.textExtractor.extractAllTexts();
    console.log(`📊 extractAllTexts 결과: ${allTexts.length}개 텍스트`);
    
    if (allTexts.length === 0) {
      console.warn('⚠️ 추출된 텍스트가 없습니다');
      return;
    }
    
    // 처음 5개 텍스트 로깅
    allTexts.slice(0, 5).forEach((textInfo, index) => {
      console.log(`  ${index + 1}. [${textInfo.tagName}] "${textInfo.text}" - element:`, textInfo.element);
    });
    const style = document.createElement('style');
    style.id = 'translation-indicators';
    style.textContent = `
      .translation-target {
        border: 2px dashed #FF5722 !important;
        background: rgba(255, 87, 34, 0.15) !important;
        position: relative !important;
        margin: 2px !important;
        padding: 2px !important;
        box-shadow: 0 0 5px rgba(255, 87, 34, 0.3) !important;
      }
      .translation-target::after {
        content: "🌐";
        position: absolute !important;
        top: -10px !important;
        right: -10px !important;
        background: #FF5722 !important;
        color: white !important;
        border-radius: 50% !important;
        width: 20px !important;
        height: 20px !important;
        font-size: 12px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 99999 !important;
        border: 2px solid white !important;
      }
      .translation-target::before {
        content: "번역대상" !important;
        position: absolute !important;
        top: -5px !important;
        left: -5px !important;
        background: #FF5722 !important;
        color: white !important;
        font-size: 8px !important;
        padding: 1px 3px !important;
        border-radius: 3px !important;
        z-index: 99998 !important;
      }
    `;

    document.head.appendChild(style);

    // 우선순위별로 분류
    const byPriority = {
      high: allTexts.filter(t => t.priority === 'high'),
      medium: allTexts.filter(t => t.priority === 'medium'),
      low: allTexts.filter(t => t.priority === 'low')
    };
    
    console.log(`우선순위별 분류: High ${byPriority.high.length}, Medium ${byPriority.medium.length}, Low ${byPriority.low.length}`);
    
    // Low 우선순위 중 li 요소들 확인
    const lowLiTexts = byPriority.low.filter(t => t.tagName === 'LI');
    console.log(`Low 우선순위 중 LI 요소: ${lowLiTexts.length}개`);
    lowLiTexts.forEach((textInfo, i) => {
      console.log(`  LI ${i+1}: "${textInfo.text.substring(0, 50)}..."`);
    });
    
    // 각 우선순위별로 몇 개씩 선택해서 클래스 추가
    const selectedTexts = [
      ...byPriority.high.slice(0, 3),    // high 우선순위 3개
      ...byPriority.medium.slice(0, 3),  // medium 우선순위 3개  
      ...byPriority.low.slice(0, 4)      // low 우선순위 4개 (li 요소들 포함)
    ];
    
    console.log(`선택된 텍스트: ${selectedTexts.length}개`);
    
    let addedCount = 0;
    selectedTexts.forEach((textInfo, index) => {
      console.log(`  시도 중 ${index + 1}: [${textInfo.priority}/${textInfo.tagName}] "${textInfo.text.substring(0, 30)}..."`);
      
      if (textInfo.element) {
        try {
          textInfo.element.classList.add('translation-target');
          console.log(`    ✅ 클래스 추가 성공`);
          addedCount++;
        } catch (error) {
          console.error(`    ❌ 클래스 추가 실패:`, error);
        }
      } else {
        console.error(`    ❌ element가 null입니다!`);
      }
    });

    console.log(`✅ ${addedCount}/${Math.min(allTexts.length, 10)}개 요소에 번역 표시 추가`);
    
    // 실제로 추가되었는지 확인
    const addedElements = document.querySelectorAll('.translation-target');
    console.log(`🔍 .translation-target 클래스를 가진 요소: ${addedElements.length}개`);
    
    const addedLiElements = document.querySelectorAll('li.translation-target');
    console.log(`📝 .translation-target 클래스를 가진 li 요소: ${addedLiElements.length}개`);
  }

  /**
   * 팝업에서 번역 비활성화 요청
   */
  deactivateTranslation() {
    console.log('⏹️ 팝업에서 번역 비활성화 요청');
    this.isEnabled = false;

    if (this.viewportManager) {
      this.viewportManager.cleanup();
    }

    this.hideTranslationIndicators();
  }

  /**
   * 번역 표시 제거
   */
  hideTranslationIndicators() {
    const style = document.getElementById('translation-indicators');
    if (style) style.remove();

    document.querySelectorAll('.translation-target').forEach(el => {
      el.classList.remove('translation-target');
    });

    console.log('✅ 번역 표시 제거 완료');
  }

  /**
   * 뷰포트 통계를 팝업으로 전송
   */
  sendViewportStats() {
    const stats = this.getViewportStats();
    
    // 팝업으로 통계 전송 (Background를 통해)
    browser.runtime.sendMessage({
      action: 'statsUpdate',
      stats: stats
    });
  }

  /**
   * 뷰포트 통계 반환 (동기 방식)
   */
  getViewportStats() {
    if (!this.viewportManager || !this.isEnabled) {
      console.warn('⚠️ ViewportManager가 초기화되지 않았거나 번역이 비활성화 상태입니다');

      // 비활성화 상태일 때는 0으로 초기화된 통계 반환
      return {
        observedElements: 0,
        totalTexts: 0,
        visibleTexts: 0,
        pendingTranslation: 0,
        translatedElements: 0,
        totalCharacters: 0,
        visibleCharacters: 0,
        pendingCharacters: 0,
        translatedCharacters: 0
      };
    }

    const stats = this.viewportManager.getViewportInfo();
    console.log('📊 뷰포트 통계 반환:', stats);
    return stats;
  }

  /**
   * 저장된 번역 상태 확인하여 자동 활성화
   */
  async checkStoredTranslationState() {
    try {
      const currentUrl = window.location.href;
      const result = await browser.storage.local.get(['translationStates']);
      const translationStates = result.translationStates || {};
      const isActive = translationStates[currentUrl] === true;
      
      console.log(`📋 현재 URL: ${currentUrl}`);
      console.log(`📦 저장된 번역 상태: ${isActive ? '활성' : '비활성'}`);
      
      if (isActive) {
        console.log('📦 이 URL에 대한 번역 상태 발견: 자동 활성화');
        // DOM이 준비되면 활성화
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => this.activateTranslation(), 100);
          });
        } else {
          // 이미 준비되어 있으면 즉시 활성화
          setTimeout(() => this.activateTranslation(), 100);
        }
      } else {
        console.log('📦 이 URL에 대한 번역 상태: 비활성화');
      }
    } catch (error) {
      console.error('❌ 저장된 번역 상태 확인 실패:', error);
    }
  }

  /**
   * 뷰포트 테스트 실행
   */
  runViewportTest() {
    console.log('🧪 뷰포트 테스트 시작');

    if (!this.viewportManager || !this.isEnabled) {
      console.error('❌ ViewportManager가 초기화되지 않았거나 번역이 비활성화 상태입니다');
      return;
    }

    // 현재 뷰포트 정보 출력
    const stats = this.viewportManager.getViewportInfo();
    console.log('📊 현재 뷰포트 통계:', stats);

    // 뷰포트에 있는 모든 텍스트 출력
    const viewportTexts = Array.from(this.viewportManager.viewportTexts.values()).flat();
    const visibleTexts = viewportTexts.filter(t => t.isVisible);

    console.log('\n👁️ 현재 보이는 텍스트들:');
    visibleTexts.forEach((textInfo, index) => {
      console.log(`${index + 1}. [${textInfo.tagName}/${textInfo.priority}] ${textInfo.text.substring(0, 100)}...`);
    });

    console.log(`\n✅ 총 ${visibleTexts.length}개의 뷰포트 텍스트 확인 완료`);

    // 통계 업데이트
    this.sendViewportStats();
  }
}

// Content Script 초기화
if (typeof browser === 'undefined') {
  // Chrome extension API 호환성
  window.browser = chrome;
}

// DOM이 준비되면 초기화
const translationScript = new TranslationContentScript(); 