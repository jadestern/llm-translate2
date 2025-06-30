/**
 * 웹 번역기 Background Script
 * 텍스트 추출 및 번역 기능
 */

// 확장 프로그램 설치 시 컨텍스트 메뉴 생성
browser.runtime.onInstalled.addListener(() => {
  console.log('웹 번역기 확장 프로그램이 설치되었습니다.');
  
  // 컨텍스트 메뉴 항목 생성
  browser.contextMenus.create({
    id: "translate-page",
    title: "이 페이지 번역하기",
    contexts: ["page", "selection"]
  });
});

// 컨텍스트 메뉴 클릭 이벤트 처리
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "translate-page") {
    console.log('번역 메뉴가 클릭되었습니다:', {
      pageUrl: tab.url,
      tabId: tab.id,
      selectedText: info.selectionText || '선택된 텍스트 없음'
    });
    
    try {
      // Content Script들을 페이지에 주입
      await injectContentScripts(tab.id);
      
      // 텍스트 추출 시작
      await browser.tabs.sendMessage(tab.id, {
        action: 'startTranslation'
      });
      
      console.log('✅ 텍스트 추출 요청 전송 완료');
      
    } catch (error) {
      console.error('❌ 번역 처리 중 오류:', error);
    }
  }
});

/**
 * Content Script들을 탭에 주입
 */
async function injectContentScripts(tabId) {
  try {
    console.log('📝 Content Script 주입 시작...');
    
    // TextExtractor 먼저 주입
    await browser.tabs.executeScript(tabId, {
      file: 'content/textExtractor.js'
    });
    
    // ContentScript 주입
    await browser.tabs.executeScript(tabId, {
      file: 'content/contentScript.js'
    });
    
    console.log('✅ Content Script 주입 완료');
    
  } catch (error) {
    console.error('❌ Content Script 주입 실패:', error);
    throw error;
  }
}

// 탭 업데이트 이벤트 (페이지 새로고침 등)
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('moz-extension://')) {
    // 페이지가 완전히 로드되면 준비 상태 로그
    console.log('페이지 로드 완료:', tab.url);
  }
});

// Content Script로부터 메시지 수신
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background에서 메시지 수신:', message);
  
  // 여기서 추후 API 호출 등을 처리할 예정
  switch (message.action) {
    case 'textExtracted':
      console.log('텍스트 추출 완료:', message.data);
      break;
    case 'translationRequest':
      console.log('번역 요청:', message.texts);
      // TODO: Gemini API 호출
      break;
    default:
      console.log('알 수 없는 메시지:', message);
  }
  
  return true;
});

console.log('웹 번역기 Background Script 로드 완료'); 