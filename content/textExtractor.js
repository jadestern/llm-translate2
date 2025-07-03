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
    
    // 완전히 제외할 태그들 (텍스트 추출하지 않음)
    this.excludedTags = new Set([
      'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 
      'SELECT', 'OPTION', 'SVG', 'CANVAS'
    ]);
    
    // 번역하지 않을 태그들 (텍스트는 추출하되 번역 시 보존)
    this.preserveTags = new Set([
      'CODE', 'PRE', 'KBD', 'SAMP', 'VAR'
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
   * 요소에서 실제 텍스트 추출 (완전한 문장 단위)
   */
  extractTextFromElement(element) {
    const texts = [];
    
    // 1. 직접 자식 노드들을 확인하여 문장 단위로 추출
    const childNodes = Array.from(element.childNodes);
    let currentSentence = '';
    let sentenceElements = [];
    
    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes[i];
      
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) {
          currentSentence += text;
          sentenceElements.push(node);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE && !this.excludedTags.has(node.tagName)) {
        // 인라인 요소인지 확인 (block 요소는 문장을 분리)
        const style = window.getComputedStyle(node);
        const isInline = style.display === 'inline' || style.display === 'inline-block' || 
                        this.isInlineTag(node.tagName);
        
        if (isInline) {
          // 인라인 요소의 텍스트를 현재 문장에 추가
          const inlineText = this.extractInlineText(node);
          if (inlineText) {
            currentSentence += inlineText;
            sentenceElements.push(node);
          }
        } else {
          // 블록 요소: 현재 문장 완료 후 재귀적으로 처리
          if (currentSentence.trim() && this.isValidText(currentSentence.trim())) {
            texts.push({
              text: currentSentence.trim(),
              node: sentenceElements[0],
              element: element,
              position: this.getElementPosition(element),
              isCompleteSentence: true,
              containsInlineTags: sentenceElements.some(el => el.nodeType === Node.ELEMENT_NODE)
            });
          }
          
          // 블록 요소 내부 재귀 처리
          const childTexts = this.extractTextFromElement(node);
          texts.push(...childTexts);
          
          // 문장 초기화
          currentSentence = '';
          sentenceElements = [];
        }
      }
    }
    
    // 마지막 문장 처리
    if (currentSentence.trim() && this.isValidText(currentSentence.trim())) {
      texts.push({
        text: currentSentence.trim(),
        node: sentenceElements[0],
        element: element,
        position: this.getElementPosition(element),
        isCompleteSentence: true,
        containsInlineTags: sentenceElements.some(el => el.nodeType === Node.ELEMENT_NODE)
      });
    }
    
    // 2. 요소에 직접적인 텍스트가 없고 단일 블록 자식만 있는 경우
    if (texts.length === 0) {
      const fullText = this.getCleanTextContent(element);
      if (fullText && this.isValidText(fullText)) {
        texts.push({
          text: fullText,
          node: element.firstChild,
          element: element,
          position: this.getElementPosition(element),
          isCompleteSentence: true,
          containsInlineTags: this.hasInlineTags(element)
        });
      }
    }
    
    return texts;
  }
  
  /**
   * 인라인 태그인지 판단
   */
  isInlineTag(tagName) {
    const inlineTags = new Set([
      'A', 'ABBR', 'ACRONYM', 'B', 'BDI', 'BDO', 'BIG', 'BR', 'BUTTON', 'CITE', 'CODE',
      'DFN', 'EM', 'I', 'IMG', 'INPUT', 'KBD', 'LABEL', 'MAP', 'MARK', 'METER', 'NOSCRIPT',
      'OBJECT', 'OUTPUT', 'PROGRESS', 'Q', 'RUBY', 'S', 'SAMP', 'SCRIPT', 'SELECT', 'SMALL',
      'SPAN', 'STRONG', 'SUB', 'SUP', 'TEXTAREA', 'TIME', 'TT', 'U', 'VAR', 'WBR'
    ]);
    return inlineTags.has(tagName.toUpperCase());
  }
  
  /**
   * 인라인 요소에서 텍스트 추출
   */
  extractInlineText(element) {
    // 완전히 제외할 태그 확인
    if (this.excludedTags.has(element.tagName)) {
      return '';
    }
    
    // 보존 태그의 경우 원본 그대로 반환 (번역하지 않음)
    if (this.preserveTags.has(element.tagName)) {
      // 태그와 함께 반환하여 번역 시 보존되도록 함
      return element.outerHTML;
    }
    
    // 일반 인라인 태그: textContent 사용하여 모든 하위 텍스트 가져오기
    const text = element.textContent || '';
    return text.trim();
  }
  
  /**
   * 요소에서 깨끗한 텍스트 내용 추출
   */
  getCleanTextContent(element) {
    // 제외할 하위 요소들을 임시로 숨기고 텍스트 추출
    const excludedElements = [];
    
    // 제외 태그들 찾기
    this.excludedTags.forEach(tagName => {
      const elements = element.getElementsByTagName(tagName);
      Array.from(elements).forEach(el => {
        excludedElements.push({ element: el, display: el.style.display });
        el.style.display = 'none';
      });
    });
    
    // 텍스트 추출
    const text = element.textContent || '';
    
    // 원래 상태 복원
    excludedElements.forEach(({ element: el, display }) => {
      el.style.display = display;
    });
    
    return text.trim();
  }
  
  /**
   * 요소에 인라인 태그가 포함되어 있는지 확인
   */
  hasInlineTags(element) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          if (this.excludedTags.has(node.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          return this.isInlineTag(node.tagName) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
      }
    );
    
    return walker.nextNode() !== null;
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
    
    // 한글 포함 텍스트 분석
    const koreanChars = text.match(/[가-힣]/g);
    if (koreanChars) {
      const koreanRatio = koreanChars.length / text.replace(/\s/g, '').length;
      
      // 한글 비율이 70% 이상이면 번역 제외 (이미 한국어로 된 텍스트)
      if (koreanRatio > 0.7) {
        return false;
      }
      
      // 한글 비율이 낮으면 혼합 언어로 간주하여 번역 대상 포함
      console.log(`🌐 혼합 언어 텍스트 감지 (한글 비율: ${(koreanRatio * 100).toFixed(1)}%): "${text.substring(0, 50)}..."`);
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
   * 혼합 언어 텍스트에서 번역 가능한 부분 추출
   */
  extractTranslatableParts(text) {
    // 한글 구간을 플레이스홀더로 치환
    let translationText = text;
    const koreanPlaceholders = [];
    let placeholderIndex = 0;
    
    // 한글 구간을 찾아서 플레이스홀더로 변환
    translationText = translationText.replace(/[가-힣\s]+/g, (match) => {
      const placeholder = `__KOREAN_${placeholderIndex}__`;
      koreanPlaceholders.push({
        placeholder: placeholder,
        originalText: match
      });
      placeholderIndex++;
      return placeholder;
    });
    
    return {
      textForTranslation: translationText,
      koreanPlaceholders: koreanPlaceholders,
      hasMixedLanguage: koreanPlaceholders.length > 0
    };
  }
  
  /**
   * 번역된 텍스트에서 한글 플레이스홀더 복원
   */
  restoreKoreanText(translatedText, koreanPlaceholders) {
    let restoredText = translatedText;
    
    koreanPlaceholders.forEach(({ placeholder, originalText }) => {
      restoredText = restoredText.replace(
        new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
        originalText
      );
    });
    
    return restoredText;
  }
  
  /**
   * HTML 태그를 플레이스홀더로 변환하여 번역 준비
   */
  prepareTextForTranslation(htmlText) {
    const placeholders = [];
    let placeholderIndex = 0;
    
    // 완전한 인라인 태그(내용 포함)를 플레이스홀더로 변환
    const processedText = htmlText.replace(/<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>(.*?)<\/\1>/g, (match, tagName, content) => {
      // 인라인 태그만 처리
      if (this.isInlineTag(tagName)) {
        const placeholder = `__PLACEHOLDER_${placeholderIndex}__`;
        placeholders.push({
          placeholder: placeholder,
          originalTag: match,
          tagName: tagName.toUpperCase(),
          content: content
        });
        placeholderIndex++;
        return placeholder;
      }
      return match;
    });
    
    return {
      text: processedText,
      placeholders: placeholders
    };
  }
  
  /**
   * 번역된 텍스트에서 플레이스홀더를 원본 HTML 태그로 복원
   */
  restoreHtmlTags(translatedText, placeholders) {
    let restoredText = translatedText;
    
    // 플레이스홀더를 원본 태그로 복원
    placeholders.forEach(({ placeholder, originalTag }) => {
      restoredText = restoredText.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), originalTag);
    });
    
    return restoredText;
  }
  
  /**
   * 요소에서 HTML 구조가 포함된 완전한 텍스트 추출 (번역용)
   */
  extractTextForTranslation(element) {
    const texts = this.extractTextFromElement(element);
    
    return texts.map(textInfo => {
      if (textInfo.containsInlineTags) {
        // HTML 구조가 포함된 경우 innerHTML 사용
        const htmlContent = element.innerHTML;
        const prepared = this.prepareTextForTranslation(htmlContent);
        
        return {
          ...textInfo,
          originalHtml: htmlContent,
          textForTranslation: prepared.text,
          placeholders: prepared.placeholders,
          needsHtmlRestoration: true
        };
      } else {
        // 일반 텍스트인 경우
        return {
          ...textInfo,
          textForTranslation: textInfo.text,
          needsHtmlRestoration: false
        };
      }
    });
  }
  
  /**
   * 번역 결과를 원본 요소에 적용
   */
  applyTranslation(textInfo, translatedText) {
    if (textInfo.needsHtmlRestoration && textInfo.placeholders) {
      // HTML 태그 복원
      const restoredHtml = this.restoreHtmlTags(translatedText, textInfo.placeholders);
      textInfo.element.innerHTML = restoredHtml;
    } else {
      // 일반 텍스트 교체
      if (textInfo.node && textInfo.node.nodeType === Node.TEXT_NODE) {
        textInfo.node.textContent = translatedText;
      } else {
        textInfo.element.textContent = translatedText;
      }
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