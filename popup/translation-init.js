/**
 * 번역 컨트롤러 공통 초기화 스크립트
 * 팝업과 번역 창에서 공통으로 사용
 */

// Chrome extension API 호환성
if (typeof browser === 'undefined') {
  window.browser = chrome;
}

/**
 * TranslationController 초기화 함수 (DOM 로드 후 즉시 실행)
 * @param {Object} config - 초기화 설정
 * @param {string} config.containerId - 컨테이너 요소 ID
 * @param {boolean} config.isWindow - 번역 창인지 여부
 * @param {string} config.logMessage - 로그 메시지
 */
function createTranslationController(config) {
  console.log(config.logMessage);
  
  const container = document.getElementById(config.containerId);
  if (!container) {
    console.error(`❌ 컨테이너를 찾을 수 없습니다: ${config.containerId}`);
    return null;
  }
  
  const controller = new TranslationController(container, {
    isWindow: config.isWindow,
    showHeader: true,
    showNewWindowButton: !config.isWindow // 팝업에서만 새창 버튼 표시
  });
  
  // 전역에서 접근 가능하도록
  window.translationController = controller;
  
  return controller;
}

/**
 * 자동 감지 및 초기화
 */
function initAuto() {
  // DOM이 이미 로드되었는지 확인
  if (document.readyState === 'loading') {
    // DOM이 아직 로드 중이면 DOMContentLoaded 이벤트를 기다림
    document.addEventListener('DOMContentLoaded', performAutoInit);
  } else {
    // DOM이 이미 로드되었으면 즉시 실행
    performAutoInit();
  }
}

/**
 * 실제 자동 초기화 로직
 */
function performAutoInit() {
  console.log('🔍 자동 초기화 시작');
  
  const body = document.body;
  const type = body.dataset.translationType;
  
  console.log('📋 감지된 타입:', type);
  
  switch (type) {
    case 'popup':
      createTranslationController({
        containerId: 'popupContainer',
        isWindow: false,
        logMessage: '🎉 팝업 DOM 로드 완료 (타입 지정)'
      });
      break;
    case 'window':
      createTranslationController({
        containerId: 'windowContainer',
        isWindow: true,
        logMessage: '🪟 번역 창 DOM 로드 완료 (타입 지정)'
      });
      break;
    default:
      // 기본값: 컨테이너 ID로 자동 감지
      const hasPopupContainer = document.getElementById('popupContainer');
      const hasWindowContainer = document.getElementById('windowContainer');
      
      if (hasPopupContainer) {
        console.log('🔍 팝업 컨테이너 감지됨');
        createTranslationController({
          containerId: 'popupContainer',
          isWindow: false,
          logMessage: '🎉 팝업 DOM 로드 완료 (자동 감지)'
        });
      } else if (hasWindowContainer) {
        console.log('🔍 윈도우 컨테이너 감지됨');
        createTranslationController({
          containerId: 'windowContainer',
          isWindow: true,
          logMessage: '🪟 번역 창 DOM 로드 완료 (자동 감지)'
        });
      } else {
        console.error('❌ 알려진 컨테이너를 찾을 수 없습니다');
        console.log('📋 사용 가능한 요소들:', document.body.innerHTML.substring(0, 200));
      }
  }
}

/**
 * 팝업용 수동 초기화
 */
function initPopup() {
  createTranslationController({
    containerId: 'popupContainer',
    isWindow: false,
    logMessage: '🎉 팝업 수동 초기화 완료'
  });
}

/**
 * 번역 창용 수동 초기화
 */
function initWindow() {
  createTranslationController({
    containerId: 'windowContainer',
    isWindow: true,
    logMessage: '🪟 번역 창 수동 초기화 완료'
  });
}

// 전역에서 사용할 수 있도록 내보내기
window.TranslationInit = {
  initPopup,
  initWindow,
  initAuto,
  createTranslationController,
  performAutoInit
};

// 파일 로드 시 자동으로 초기화 실행
initAuto();