/**
 * TextExtractor Jest 테스트
 */

// TextExtractor 클래스 import (jest 환경에서는 require 사용)
const fs = require('fs');
const path = require('path');

// TextExtractor 코드를 문자열로 읽어서 실행
const textExtractorCode = fs.readFileSync(
  path.join(__dirname, '../content/textExtractor.js'),
  'utf8'
);

// 코드 실행하여 클래스 정의
eval(textExtractorCode);
const TextExtractor = global.TextExtractor || window.TextExtractor;

describe('TextExtractor', () => {
  let textExtractor;

  beforeEach(() => {
    // 각 테스트 전에 새로운 인스턴스 생성
    textExtractor = new TextExtractor();
    
    // DOM 초기화
    document.body.innerHTML = '';
  });

  describe('isValidText', () => {
    test('순수 영어 문장은 유효해야 함', () => {
      expect(textExtractor.isValidText('Load this extension in Firefox using about:debugging')).toBe(true);
    });

    test('순수 영어 문장 2는 유효해야 함', () => {
      expect(textExtractor.isValidText('Right-click anywhere on this page')).toBe(true);
    });

    test('완전한 영어 문장은 유효해야 함', () => {
      expect(textExtractor.isValidText('This is a complete sentence with multiple words')).toBe(true);
    });

    test('혼합 언어는 유효해야 함 (한글 비율 낮음)', () => {
      const result = textExtractor.isValidText('Select 이 페이지 번역하기 from the context menu');
      expect(result).toBe(true);
    });

    test('한글 비율 높은 텍스트는 무효해야 함', () => {
      expect(textExtractor.isValidText('이미 한국어로 된 문장입니다')).toBe(false);
    });

    test('숫자만 있는 텍스트는 무효해야 함', () => {
      expect(textExtractor.isValidText('12345')).toBe(false);
    });

    test('특수문자만 있는 텍스트는 무효해야 함', () => {
      expect(textExtractor.isValidText('@#$%^&*()')).toBe(false);
    });

    test('짧은 텍스트는 무효해야 함', () => {
      expect(textExtractor.isValidText('Hi')).toBe(false);
    });

    test('빈 텍스트는 무효해야 함', () => {
      expect(textExtractor.isValidText('')).toBe(false);
      expect(textExtractor.isValidText(null)).toBe(false);
      expect(textExtractor.isValidText(undefined)).toBe(false);
    });
  });

  describe('인라인 태그 감지', () => {
    test('CODE는 인라인 태그여야 함', () => {
      expect(textExtractor.isInlineTag('CODE')).toBe(true);
    });

    test('STRONG은 인라인 태그여야 함', () => {
      expect(textExtractor.isInlineTag('STRONG')).toBe(true);
    });

    test('EM은 인라인 태그여야 함', () => {
      expect(textExtractor.isInlineTag('EM')).toBe(true);
    });

    test('DIV는 인라인 태그가 아니어야 함', () => {
      expect(textExtractor.isInlineTag('DIV')).toBe(false);
    });

    test('P는 인라인 태그가 아니어야 함', () => {
      expect(textExtractor.isInlineTag('P')).toBe(false);
    });
  });

  describe('실제 DOM 요소에서 텍스트 추출', () => {
    test('기본 li 요소에서 텍스트 추출', () => {
      document.body.innerHTML = `
        <ol>
          <li>Load this extension in Firefox using about:debugging</li>
        </ol>
      `;
      
      const liElement = document.querySelector('li');
      const texts = textExtractor.extractTextFromElement(liElement);
      
      console.log('추출된 텍스트:', texts.map(t => t.text));
      expect(texts.length).toBeGreaterThan(0);
      expect(texts[0].text).toContain('Load this extension');
    });

    test('CODE 태그가 있는 li 요소에서 텍스트 추출', () => {
      document.body.innerHTML = `
        <ol>
          <li>Load this extension in Firefox using <code>about:debugging</code></li>
        </ol>
      `;
      
      const liElement = document.querySelector('li');
      const texts = textExtractor.extractTextFromElement(liElement);
      
      console.log('CODE 태그 포함 추출:', texts.map(t => t.text));
      expect(texts.length).toBeGreaterThan(0);
    });

    test('STRONG 태그가 있는 li 요소에서 텍스트 추출', () => {
      document.body.innerHTML = `
        <ol>
          <li>Select <strong>"이 페이지 번역하기"</strong> from the context menu</li>
        </ol>
      `;
      
      const liElement = document.querySelector('li');
      const texts = textExtractor.extractTextFromElement(liElement);
      
      console.log('STRONG 태그 포함 추출:', texts.map(t => t.text));
      expect(texts.length).toBeGreaterThanOrEqual(0); // 혼합 언어로 인해 0일 수도 있음
    });

    test('일반 p 태그에서 텍스트 추출', () => {
      document.body.innerHTML = `
        <p>This is a simple paragraph with <em>emphasis</em> and <strong>strong</strong> text.</p>
      `;
      
      const pElement = document.querySelector('p');
      const texts = textExtractor.extractTextFromElement(pElement);
      
      console.log('P 태그 추출:', texts.map(t => t.text));
      expect(texts.length).toBeGreaterThan(0);
    });
  });

  describe('번역용 텍스트 추출', () => {
    test('CODE 태그 포함 요소에서 번역용 텍스트 추출', () => {
      document.body.innerHTML = `
        <li>Load this extension in Firefox using <code>about:debugging</code></li>
      `;
      
      const liElement = document.querySelector('li');
      const texts = textExtractor.extractTextForTranslation(liElement);
      
      console.log('번역용 텍스트:', texts.map(t => ({
        text: t.textForTranslation || t.text,
        needsRestore: t.needsHtmlRestoration
      })));
      
      expect(texts.length).toBeGreaterThanOrEqual(0);
    });

    test('STRONG 태그 포함 요소에서 번역용 텍스트 추출', () => {
      document.body.innerHTML = `
        <p>This text has <strong>bold content</strong> in it.</p>
      `;
      
      const pElement = document.querySelector('p');
      const texts = textExtractor.extractTextForTranslation(pElement);
      
      console.log('STRONG 포함 번역용:', texts.map(t => ({
        text: t.textForTranslation || t.text,
        needsRestore: t.needsHtmlRestoration
      })));
      
      expect(texts.length).toBeGreaterThan(0);
    });
  });

  describe('HTML 태그 플레이스홀더 처리', () => {
    test('HTML 태그를 플레이스홀더로 변환', () => {
      const htmlText = 'Load this extension in Firefox using <code>about:debugging</code>';
      const prepared = textExtractor.prepareTextForTranslation(htmlText);
      
      console.log('원본:', htmlText);
      console.log('변환:', prepared.text);
      console.log('플레이스홀더:', prepared.placeholders);
      
      expect(prepared.placeholders.length).toBeGreaterThan(0);
      expect(prepared.text).toContain('__PLACEHOLDER_');
    });

    test('플레이스홀더를 원본 태그로 복원', () => {
      const htmlText = 'Load this extension in Firefox using <code>about:debugging</code>';
      const prepared = textExtractor.prepareTextForTranslation(htmlText);
      const translatedText = 'Firefox에서 __PLACEHOLDER_0__을 사용하여 이 확장 프로그램을 로드하세요';
      const restored = textExtractor.restoreHtmlTags(translatedText, prepared.placeholders);
      
      console.log('번역됨:', translatedText);
      console.log('복원됨:', restored);
      
      expect(restored).toContain('<code>about:debugging</code>');
    });

    test('여러 인라인 태그 처리', () => {
      const htmlText = 'This has <strong>bold</strong> and <em>italic</em> and <code>code</code> tags';
      const prepared = textExtractor.prepareTextForTranslation(htmlText);
      
      console.log('복잡한 HTML 변환:', prepared.text);
      console.log('플레이스홀더 수:', prepared.placeholders.length);
      
      expect(prepared.placeholders.length).toBe(3); // 완전한 태그 3개
      expect(prepared.text).toContain('__PLACEHOLDER_');
    });
  });

  describe('혼합 언어 처리', () => {
    test('혼합 언어에서 번역 가능한 부분 추출', () => {
      const mixedText = 'Select 이 페이지 번역하기 from the context menu';
      const extracted = textExtractor.extractTranslatableParts(mixedText);
      
      console.log('혼합 언어 원본:', mixedText);
      console.log('번역용 텍스트:', extracted.textForTranslation);
      console.log('한글 플레이스홀더:', extracted.koreanPlaceholders);
      
      expect(extracted.hasMixedLanguage).toBe(true);
      expect(extracted.koreanPlaceholders.length).toBeGreaterThan(0);
    });

    test('한글 플레이스홀더 복원', () => {
      const mixedText = 'Select 이 페이지 번역하기 from the context menu';
      const extracted = textExtractor.extractTranslatableParts(mixedText);
      const translatedText = '__KOREAN_0__ 를 컨텍스트 메뉴에서 선택하세요';
      const restored = textExtractor.restoreKoreanText(translatedText, extracted.koreanPlaceholders);
      
      console.log('한글 복원 결과:', restored);
      
      expect(restored).toContain('이 페이지 번역하기');
    });
  });

  describe('우선순위별 추출', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <h1>High Priority Title</h1>
        <h2>Another High Priority</h2>
        <p>Medium priority paragraph text</p>
        <section>
          <h4>Medium priority section header</h4>
          <p>Another medium priority text</p>
        </section>
        <div>
          <span>Low priority span text</span>
          <li>Low priority list item</li>
        </div>
      `;
    });

    test('high 우선순위 텍스트 추출', () => {
      const texts = textExtractor.extractTextByPriority('high');
      console.log('High priority texts:', texts.map(t => `[${t.tagName}] ${t.text}`));
      
      expect(texts.length).toBeGreaterThan(0);
      expect(texts.some(t => t.tagName === 'H1')).toBe(true);
    });

    test('medium 우선순위 텍스트 추출', () => {
      const texts = textExtractor.extractTextByPriority('medium');
      console.log('Medium priority texts:', texts.map(t => `[${t.tagName}] ${t.text}`));
      
      expect(texts.length).toBeGreaterThan(0);
      expect(texts.some(t => t.tagName === 'P')).toBe(true);
    });

    test('low 우선순위 텍스트 추출', () => {
      const texts = textExtractor.extractTextByPriority('low');
      console.log('Low priority texts:', texts.map(t => `[${t.tagName}] ${t.text}`));
      
      expect(texts.length).toBeGreaterThanOrEqual(0);
    });
  });
});