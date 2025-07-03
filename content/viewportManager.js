/**
 * 뷰포트 기반 텍스트 관리
 * IntersectionObserver를 활용한 효율적인 번역 처리
 */

class ViewportManager {
  constructor(textExtractor) {
    this.textExtractor = textExtractor;
    this.observer = null;
    this.observedElements = new Set();
    this.viewportTexts = new Map(); // element -> TextInfo[]
    this.pendingTexts = new Set(); // 번역 대기 중인 텍스트
    this.translatedElements = new Set(); // 이미 번역된 요소들
    
    this.init();
  }
  
  init() {
    // IntersectionObserver 설정 (아직 관찰 시작 안함)
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        root: null, // 뷰포트 기준
        rootMargin: '200px', // 200px 미리 로드
        threshold: [0, 0.1, 0.5, 1.0] // 다양한 교차 지점에서 감지
      }
    );
    
    console.log('✅ ViewportManager 초기화 완료 (관찰 대기 중)');
  }
  
  /**
   * 페이지의 모든 번역 대상 요소를 관찰 시작
   */
  startObserving() {
    console.log('🔍 뷰포트 관찰 시작...');
    
    // 우선순위 높은 요소들부터 관찰
    const priorities = ['high', 'medium', 'low'];
    let totalElements = 0;
    
    priorities.forEach(priority => {
      const elements = this.getElementsForPriority(priority);
      elements.forEach(element => {
        if (!this.observedElements.has(element)) {
          this.observer.observe(element);
          this.observedElements.add(element);
          totalElements++;
        }
      });
    });
    
    console.log(`📊 총 ${totalElements}개 요소 관찰 시작`);
    return totalElements;
  }
  
  /**
   * 우선순위별 요소 선택
   */
  getElementsForPriority(priority) {
    const tags = this.textExtractor.priorityTags[priority] || [];
    const elements = [];
    
    tags.forEach(tagName => {
      const nodeList = document.getElementsByTagName(tagName);
      Array.from(nodeList).forEach(element => {
        if (this.textExtractor.shouldExtractFromElement(element)) {
          elements.push(element);
        }
      });
    });
    
    return elements;
  }
  
  /**
   * IntersectionObserver 콜백
   */
  handleIntersection(entries) {
    const visibleEntries = [];
    const hiddenEntries = [];
    
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        visibleEntries.push(entry);
      } else {
        hiddenEntries.push(entry);
      }
    });
    
    if (visibleEntries.length > 0) {
      console.log(`👁️ ${visibleEntries.length}개 요소가 뷰포트에 진입`);
      this.handleVisibleElements(visibleEntries);
    }
    
    if (hiddenEntries.length > 0) {
      console.log(`👻 ${hiddenEntries.length}개 요소가 뷰포트에서 벗어남`);
      this.handleHiddenElements(hiddenEntries);
    }
  }
  
  /**
   * 뷰포트에 보이는 요소 처리
   */
  handleVisibleElements(entries) {
    const newTextsToTranslate = [];
    
    entries.forEach(entry => {
      const element = entry.target;
      
      // 이미 번역된 요소는 스킵
      if (this.translatedElements.has(element)) {
        return;
      }
      
      // 이미 처리 중인 요소는 스킵
      if (this.viewportTexts.has(element)) {
        return;
      }
      
      // 번역용 텍스트 추출 (HTML 태그 처리 포함)
      const texts = this.textExtractor.extractTextForTranslation(element);
      
      if (texts.length > 0) {
        // 우선순위 및 태그 정보 추가
        const priority = this.getElementPriority(element);
        texts.forEach(textInfo => {
          textInfo.priority = priority;
          textInfo.tagName = element.tagName;
          textInfo.isVisible = true;
        });
        
        this.viewportTexts.set(element, texts);
        newTextsToTranslate.push(...texts);
        
        const displayText = texts[0]?.textForTranslation || texts[0]?.text || '';
        console.log(`📝 [${element.tagName}] ${texts.length}개 텍스트 추출: ${displayText.substring(0, 50)}...`);
        if (texts[0]?.needsHtmlRestoration) {
          console.log(`🏷️ HTML 태그 포함된 문장 감지`);
        }
      }
    });
    
    // 새로 발견된 텍스트들을 번역 큐에 추가
    if (newTextsToTranslate.length > 0) {
      this.queueForTranslation(newTextsToTranslate);
    }
  }
  
  /**
   * 뷰포트에서 벗어난 요소 처리 (우선순위 낮춤)
   */
  handleHiddenElements(entries) {
    entries.forEach(entry => {
      const element = entry.target;
      const texts = this.viewportTexts.get(element);
      
      if (texts) {
        texts.forEach(textInfo => {
          textInfo.isVisible = false;
        });
        
        console.log(`📤 [${element.tagName}] 뷰포트에서 벗어남 - 우선순위 낮춤`);
      }
    });
  }
  
  /**
   * 요소의 우선순위 판단
   */
  getElementPriority(element) {
    const tagName = element.tagName.toLowerCase();
    
    for (const [priority, tags] of Object.entries(this.textExtractor.priorityTags)) {
      if (tags.includes(tagName)) {
        return priority;
      }
    }
    
    return 'low';
  }
  
  /**
   * 번역할 텍스트를 큐에 추가
   */
  queueForTranslation(texts) {
    // 우선순위별로 정렬 (high > medium > low, visible > hidden)
    texts.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;
      
      // 우선순위가 다르면 우선순위로 정렬
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // 우선순위가 같으면 가시성으로 정렬
      if (a.isVisible !== b.isVisible) {
        return a.isVisible ? -1 : 1;
      }
      
      return 0;
    });
    
    texts.forEach(textInfo => {
      this.pendingTexts.add(textInfo);
    });
    
    console.log(`📋 번역 큐에 ${texts.length}개 텍스트 추가 (총 ${this.pendingTexts.size}개 대기)`);
    
    // 번역 시작 이벤트 발생
    this.triggerTranslation();
  }
  
  /**
   * 번역 프로세스 시작
   */
  triggerTranslation() {
    // Background Script로 번역 요청 메시지 전송
    const textsArray = Array.from(this.pendingTexts);
    const visibleTexts = textsArray.filter(t => t.isVisible);
    const backgroundTexts = textsArray.filter(t => !t.isVisible);
    
    console.log(`🚀 번역 요청: 보이는 텍스트 ${visibleTexts.length}개, 백그라운드 ${backgroundTexts.length}개`);
    
    // 우선 보이는 텍스트부터 번역 요청
    if (visibleTexts.length > 0) {
      browser.runtime.sendMessage({
        action: 'translateBatch',
        texts: visibleTexts.map(t => t.textForTranslation || t.text),
        priority: 'visible',
        textInfos: visibleTexts
      });
    }
    
    // 백그라운드 텍스트는 조금 후에 처리
    if (backgroundTexts.length > 0) {
      setTimeout(() => {
        browser.runtime.sendMessage({
          action: 'translateBatch',
          texts: backgroundTexts.map(t => t.textForTranslation || t.text),
          priority: 'background',
          textInfos: backgroundTexts
        });
      }, 2000); // 2초 후 백그라운드 처리
    }
  }
  
  /**
   * 현재 뷰포트 상태 정보
   */
  getViewportInfo() {
    // 관찰이 시작되지 않았으면 모든 값을 0으로 반환
    if (this.observedElements.size === 0) {
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
    
    const totalObserved = this.observedElements.size;
    const allTexts = Array.from(this.viewportTexts.values()).flat();
    const totalTexts = allTexts.length;
    const visibleTexts = allTexts.filter(t => t.isVisible).length;
    const pendingCount = this.pendingTexts.size;
    
    // Character count calculations
    const totalCharacters = allTexts.reduce((sum, textInfo) => sum + (textInfo.text?.length || 0), 0);
    const visibleCharacters = allTexts
      .filter(t => t.isVisible)
      .reduce((sum, textInfo) => sum + (textInfo.text?.length || 0), 0);
    const pendingCharacters = Array.from(this.pendingTexts)
      .reduce((sum, text) => sum + (text?.length || 0), 0);
    const translatedCharacters = Array.from(this.translatedElements)
      .reduce((sum, element) => {
        const textsForElement = this.viewportTexts.get(element) || [];
        return sum + textsForElement.reduce((charSum, textInfo) => charSum + (textInfo.text?.length || 0), 0);
      }, 0);
    
    return {
      observedElements: totalObserved,
      totalTexts: totalTexts,
      visibleTexts: visibleTexts,
      pendingTranslation: pendingCount,
      translatedElements: this.translatedElements.size,
      totalCharacters: totalCharacters,
      visibleCharacters: visibleCharacters,
      pendingCharacters: pendingCharacters,
      translatedCharacters: translatedCharacters
    };
  }
  
  /**
   * 번역 결과 적용
   */
  applyTranslationResult(element, translations) {
    const texts = this.viewportTexts.get(element);
    if (!texts || !translations || translations.length === 0) {
      return;
    }
    
    try {
      // 각 텍스트에 번역 적용
      texts.forEach((textInfo, index) => {
        if (index < translations.length) {
          const translatedText = translations[index];
          this.textExtractor.applyTranslation(textInfo, translatedText);
          
          console.log(`✅ 번역 적용: "${textInfo.textForTranslation || textInfo.text}" → "${translatedText}"`);
        }
      });
      
      // 번역 완료 처리
      this.markAsTranslated(element);
      
    } catch (error) {
      console.error('❌ 번역 적용 실패:', error);
    }
  }
  
  /**
   * 번역 완료 처리
   */
  markAsTranslated(element) {
    this.translatedElements.add(element);
    
    // 해당 요소의 텍스트들을 대기 큐에서 제거
    const texts = this.viewportTexts.get(element);
    if (texts) {
      texts.forEach(textInfo => {
        this.pendingTexts.delete(textInfo);
      });
    }
  }
  
  /**
   * 관찰 정리
   */
  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
      this.observedElements.clear();
      this.viewportTexts.clear();
      this.pendingTexts.clear();
      console.log('🧹 ViewportManager 정리 완료');
    }
  }
}

// 전역에서 사용할 수 있도록 내보내기
window.ViewportManager = ViewportManager; 