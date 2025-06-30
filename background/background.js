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
    case 'injectAndActivate':
      handleInjectAndActivate(message.tabId);
      break;
    case 'statsUpdate':
      // Content Script에서 받은 통계를 팝업으로 전달
      forwardStatsToPopup(message.stats);
      break;
    case 'translateBatch':
      console.log('배치 번역 요청:', message);
      // TODO: Gemini API 배치 호출
      break;
    default:
      console.log('알 수 없는 메시지:', message);
  }
  
  return true;
});

/**
 * 팝업에서 요청한 Content Script 주입 및 활성화
 */
async function handleInjectAndActivate(tabId) {
  try {
    console.log('🔄 팝업 요청으로 Content Script 주입 및 활성화:', tabId);
    
    // Content Script들을 주입
    await injectContentScripts(tabId);
    
    // 활성화 메시지 전송
    await browser.tabs.sendMessage(tabId, {
      action: 'activateTranslation'
    });
    
    console.log('✅ 팝업 요청 처리 완료');
    
  } catch (error) {
    console.error('❌ 팝업 요청 처리 실패:', error);
  }
}

/**
 * Content Script에서 받은 통계를 팝업으로 전달
 */
function forwardStatsToPopup(stats) {
  console.log('📊 통계를 팝업으로 전달:', stats);
  
  // 현재 활성 팝업이 있다면 메시지 전송
  // (팝업은 별도 프로세스이므로 direct messaging 불가)
  // 대신 storage를 통해 상태 공유하거나 content script를 통해 전달
  
  // 임시로 콘솔에만 출력 (팝업은 직접 content script와 통신)
}

console.log('웹 번역기 Background Script 로드 완료'); 