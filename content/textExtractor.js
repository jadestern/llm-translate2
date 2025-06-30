/**
 * 텍스트 추출 유틸리티
 * 우선순위 기반으로 번역 대상 텍스트를 추출
 */

class TextExtractor {
  constructor() {
    // 우선순위별 태그 정의
    this.priorityTags = {
      high: ['title', 'h1', 'h2', 'h3', 'main', 'article'],
      medium: ['h4', 'h5', 'h6', 'p', 'section', 'header', 'nav'],
      low: ['div', 'span', 'li', 'td', 'th', 'figcaption']
    };
    
    // 제외할 태그들
    this.excludedTags = new Set([
      'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 
      'SELECT', 'OPTION', 'CODE', 'PRE', 'SVG', 'CANVAS'
    ]);
    
    // 제외할 클래스들
    this.excludedClasses = new Set([
      'notranslate', 'translate-no', 'skip-translate'
    ]);
  }
  
  /**
   * 메인 텍스트 추출 함수
   * @param {string} priority - 'high' | 'medium' | 'low'
   * @returns {Array} 추출된 텍스트 노드 정보
   */
  extractTextByPriority(priority = 'high') {
    const targetTags = this.priorityTags[priority] || this.priorityTags.high;
    const extractedTexts = [];
    
    targetTags.forEach(tagName => {
      const elements = document.getElementsByTagName(tagName);
      
      Array.from(elements).forEach(element => {
        if (this.shouldExtractFromElement(element)) {
          const texts = this.extractTextFromElement(element);
          texts.forEach(textInfo => {
            textInfo.priority = priority;
            textInfo.tagName = tagName.toUpperCase();
            extractedTexts.push(textInfo);
          });
        }
      });
    });
    
    return extractedTexts;
  }
  
  /**
   * 요소에서 텍스트 추출 여부 판단
   */
  shouldExtractFromElement(element) {
    // 제외할 태그인지 확인
    if (this.excludedTags.has(element.tagName)) {
      return false;
    }
    
    // 제외할 클래스가 있는지 확인
    if (element.classList && 
        Array.from(element.classList).some(cls => this.excludedClasses.has(cls))) {
      return false;
    }
    
    // 숨겨진 요소 확인
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }
    
    return true;
  }
  
  /**
   * 요소에서 실제 텍스트 추출
   */
  extractTextFromElement(element) {
    const texts = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // 부모가 제외 태그인지 확인
          let parent = node.parentElement;
          while (parent && parent !== element) {
            if (this.excludedTags.has(parent.tagName)) {
              return NodeFilter.FILTER_REJECT;
            }
            parent = parent.parentElement;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    let textNode;
    while (textNode = walker.nextNode()) {
      const text = textNode.textContent.trim();
      
      if (this.isValidText(text)) {
        texts.push({
          text: text,
          node: textNode,
          element: textNode.parentElement,
          position: this.getElementPosition(textNode.parentElement)
        });
      }
    }
    
    return texts;
  }
  
  /**
   * 텍스트가 번역 대상인지 판단
   */
  isValidText(text) {
    // 빈 텍스트 제외
    if (!text || text.length < 2) {
      return false;
    }
    
    // 숫자만 포함된 텍스트 제외
    if (/^\d+[\d\s\.,]*$/.test(text)) {
      return false;
    }
    
    // 특수문자만 포함된 텍스트 제외
    if (/^[\s\-_=+*&^%$#@!~`\[\]{}|\\:";'<>?,.\/]*$/.test(text)) {
      return false;
    }
    
    // 이미 한글이 포함된 텍스트 제외 (중복 번역 방지)
    if (/[가-힣]/.test(text)) {
      return false;
    }
    
    // 문장 우선 - 공백이 포함된 텍스트 우선시
    // 단어 하나만 있는 경우는 낮은 우선순위
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 2 && text.length < 10) {
      return false; // 단어 단위는 나중에 처리
    }
    
    return true;
  }
  
  /**
   * 요소의 화면상 위치 계산
   */
  getElementPosition(element) {
    try {
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
        inViewport: rect.top >= 0 && rect.top <= window.innerHeight
      };
    } catch (error) {
      return { top: 0, left: 0, width: 0, height: 0, inViewport: false };
    }
  }
  
  /**
   * 모든 우선순위의 텍스트 추출
   */
  extractAllTexts() {
    const allTexts = [];
    
    // 우선순위별로 텍스트 추출
    ['high', 'medium', 'low'].forEach(priority => {
      const texts = this.extractTextByPriority(priority);
      allTexts.push(...texts);
    });
    
    // 중복 제거 (같은 텍스트 내용)
    const uniqueTexts = [];
    const seenTexts = new Set();
    
    allTexts.forEach(textInfo => {
      const key = textInfo.text.toLowerCase().trim();
      if (!seenTexts.has(key)) {
        seenTexts.add(key);
        uniqueTexts.push(textInfo);
      }
    });
    
    return uniqueTexts;
  }
  
  /**
   * 뷰포트 내 텍스트만 추출
   */
  extractViewportTexts() {
    const allTexts = this.extractAllTexts();
    return allTexts.filter(textInfo => textInfo.position.inViewport);
  }
}

// 전역에서 사용할 수 있도록 내보내기
window.TextExtractor = TextExtractor; 