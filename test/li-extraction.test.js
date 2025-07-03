/**
 * LI 요소 추출 문제 진단 테스트
 */

const fs = require('fs');
const path = require('path');

// TextExtractor 코드 로드
const textExtractorCode = fs.readFileSync(
  path.join(__dirname, '../content/textExtractor.js'),
  'utf8'
);
eval(textExtractorCode);
const TextExtractor = global.TextExtractor || window.TextExtractor;

describe('LI 요소 추출 문제 진단', () => {
  let textExtractor;

  beforeEach(() => {
    textExtractor = new TextExtractor();
    document.body.innerHTML = '';
  });

  test('실제 test-pages HTML의 li 요소들 테스트', () => {
    // 실제 test-pages/index.html의 문제가 되는 부분 재현
    document.body.innerHTML = `
      <div class="instructions">
        <h3>🧪 How to Test the Extension</h3>
        <ol>
          <li>Load this extension in Firefox using <code>about:debugging</code></li>
          <li>Right-click anywhere on this page</li>
          <li>Select <strong>"이 페이지 번역하기"</strong> from the context menu</li>
          <li>Open browser console (F12) to see detailed extraction results</li>
          <li>Check the console logs for priority classifications and extracted texts</li>
        </ol>
      </div>
    `;

    const liElements = document.querySelectorAll('ol li');
    console.log(`\n🔍 발견된 li 요소: ${liElements.length}개`);

    // 각 li 요소별로 테스트
    liElements.forEach((element, index) => {
      const innerHTML = element.innerHTML;
      const textContent = element.textContent.trim();
      
      console.log(`\n📝 LI ${index + 1}:`);
      console.log(`  HTML: ${innerHTML}`);
      console.log(`  텍스트: "${textContent}"`);

      // 1. extractTextFromElement 테스트
      const extractedTexts = textExtractor.extractTextFromElement(element);
      console.log(`  직접 추출: ${extractedTexts.length}개`);
      extractedTexts.forEach((t, i) => {
        console.log(`    ${i+1}. "${t.text}"`);
      });

      // 2. isValidText 테스트
      const isValid = textExtractor.isValidText(textContent);
      console.log(`  isValidText: ${isValid}`);

      // 3. 한글 비율 체크 (혼합 언어인 경우)
      const koreanChars = textContent.match(/[가-힣]/g);
      if (koreanChars) {
        const koreanRatio = koreanChars.length / textContent.replace(/\s/g, '').length;
        console.log(`  한글 비율: ${(koreanRatio * 100).toFixed(1)}%`);
      }

      // 기대값 검증
      if (index === 0) {
        // "Load this extension in Firefox using about:debugging"
        expect(isValid).toBe(true);
        expect(extractedTexts.length).toBeGreaterThan(0);
      } else if (index === 1) {
        // "Right-click anywhere on this page"
        expect(isValid).toBe(true);
        expect(extractedTexts.length).toBeGreaterThan(0);
      } else if (index === 2) {
        // 혼합 언어 - 한글 비율이 낮으므로 유효해야 함
        expect(isValid).toBe(true);
      }
    });
  });

  test('extractTextByPriority로 low 우선순위 테스트', () => {
    document.body.innerHTML = `
      <ol>
        <li>Load this extension in Firefox using <code>about:debugging</code></li>
        <li>Right-click anywhere on this page</li>
        <li>Select <strong>"이 페이지 번역하기"</strong> from the context menu</li>
      </ol>
    `;

    console.log('\n🎯 extractTextByPriority("low") 테스트:');
    
    // low 우선순위 추출
    const lowTexts = textExtractor.extractTextByPriority('low');
    console.log(`low 우선순위 텍스트: ${lowTexts.length}개`);
    
    lowTexts.forEach((textInfo, index) => {
      console.log(`  ${index + 1}. [${textInfo.tagName}] "${textInfo.text}"`);
      console.log(`     우선순위: ${textInfo.priority}`);
    });

    // li 요소가 3개 있으므로 최소 0개 이상이어야 함 (필터링에 따라 달라질 수 있음)
    expect(lowTexts.length).toBeGreaterThanOrEqual(0);
    
    // li 태그가 포함되어 있는지 확인
    const liTexts = lowTexts.filter(t => t.tagName === 'LI');
    console.log(`실제 LI 태그로 추출된 것: ${liTexts.length}개`);
    
    // 최소 영어 문장들은 추출되어야 함
    expect(liTexts.length).toBeGreaterThan(0);
  });

  test('extractAllTexts로 전체 추출 테스트', () => {
    document.body.innerHTML = `
      <h1>High Priority Title</h1>
      <p>Medium priority paragraph</p>
      <ol>
        <li>Load this extension in Firefox using <code>about:debugging</code></li>
        <li>Right-click anywhere on this page</li>
        <li>Select <strong>"이 페이지 번역하기"</strong> from the context menu</li>
      </ol>
    `;

    console.log('\n📊 extractAllTexts() 테스트:');
    
    const allTexts = textExtractor.extractAllTexts();
    console.log(`전체 추출된 텍스트: ${allTexts.length}개`);
    
    // 우선순위별 분류
    const byPriority = {
      high: allTexts.filter(t => t.priority === 'high'),
      medium: allTexts.filter(t => t.priority === 'medium'),
      low: allTexts.filter(t => t.priority === 'low')
    };
    
    console.log(`  High: ${byPriority.high.length}개`);
    console.log(`  Medium: ${byPriority.medium.length}개`);
    console.log(`  Low: ${byPriority.low.length}개`);
    
    // 모든 텍스트 출력
    allTexts.forEach((textInfo, index) => {
      console.log(`  ${index + 1}. [${textInfo.priority}/${textInfo.tagName}] "${textInfo.text}"`);
    });

    // 최소한 h1, p, li 요소들이 추출되어야 함
    expect(allTexts.length).toBeGreaterThan(0);
    expect(byPriority.high.length).toBeGreaterThan(0); // h1
    expect(byPriority.medium.length).toBeGreaterThan(0); // p
    
    // li 요소들도 추출되어야 함
    const liElements = allTexts.filter(t => t.tagName === 'LI');
    console.log(`LI 요소로 추출된 것: ${liElements.length}개`);
    expect(liElements.length).toBeGreaterThan(0);
  });

  test('새로운 extractTextFromElement 로직 상세 분석', () => {
    document.body.innerHTML = `
      <li>Load this extension in Firefox using <code>about:debugging</code></li>
    `;

    const liElement = document.querySelector('li');
    console.log('\n🔬 extractTextFromElement 상세 분석:');
    console.log(`요소: ${liElement.tagName}`);
    console.log(`HTML: ${liElement.innerHTML}`);
    console.log(`텍스트: "${liElement.textContent.trim()}"`);

    // 자식 노드 분석
    console.log('\n자식 노드 분석:');
    Array.from(liElement.childNodes).forEach((node, i) => {
      if (node.nodeType === Node.TEXT_NODE) {
        console.log(`  ${i}: TEXT_NODE: "${node.textContent.trim()}"`);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        console.log(`  ${i}: ELEMENT_NODE: ${node.tagName} = "${node.textContent.trim()}"`);
      }
    });

    // 추출 결과
    const texts = textExtractor.extractTextFromElement(liElement);
    console.log(`\n추출 결과: ${texts.length}개`);
    texts.forEach((textInfo, i) => {
      console.log(`  ${i+1}. "${textInfo.text}"`);
      console.log(`      isCompleteSentence: ${textInfo.isCompleteSentence}`);
      console.log(`      containsInlineTags: ${textInfo.containsInlineTags}`);
    });

    // 검증
    expect(texts.length).toBeGreaterThan(0);
    if (texts.length > 0) {
      expect(texts[0].text).toContain('Load this extension');
      expect(texts[0].text).toContain('about:debugging');
    }
  });

  test('혼합 언어 처리 테스트', () => {
    document.body.innerHTML = `
      <li>Select <strong>"이 페이지 번역하기"</strong> from the context menu</li>
    `;

    const liElement = document.querySelector('li');
    const fullText = liElement.textContent.trim();
    
    console.log('\n🌐 혼합 언어 테스트:');
    console.log(`텍스트: "${fullText}"`);

    // 한글 비율 계산
    const koreanChars = fullText.match(/[가-힣]/g);
    const koreanRatio = koreanChars ? koreanChars.length / fullText.replace(/\s/g, '').length : 0;
    console.log(`한글 비율: ${(koreanRatio * 100).toFixed(1)}%`);

    // isValidText 테스트
    const isValid = textExtractor.isValidText(fullText);
    console.log(`isValidText 결과: ${isValid}`);

    // 추출 테스트
    const texts = textExtractor.extractTextFromElement(liElement);
    console.log(`추출 결과: ${texts.length}개`);

    // 혼합 언어 처리 테스트
    const mixedResult = textExtractor.extractTranslatableParts(fullText);
    console.log('혼합 언어 처리:');
    console.log(`  번역용 텍스트: "${mixedResult.textForTranslation}"`);
    console.log(`  한글 플레이스홀더: ${mixedResult.koreanPlaceholders.length}개`);

    // 검증: 한글 비율이 낮으므로 유효해야 함
    expect(koreanRatio).toBeLessThan(0.5); // 50% 미만
    expect(isValid).toBe(true);
  });
});