/**
 * 웹 번역기 팝업 컨트롤러
 */

class TranslationPopup {
  constructor() {
    this.isTranslationActive = false;
    this.currentTab = null;
    
    this.init();
  }
  
  async init() {
    console.log('🔥 Translation Popup 초기화 시작');
    
    // DOM 요소들 가져오기
    this.elements = {
      toggle: document.getElementById('translationToggle'),
      statusText: document.getElementById('statusText'),
      statsSection: document.getElementById('statsSection'),
      refreshBtn: document.getElementById('refreshBtn'),
      testBtn: document.getElementById('testBtn'),
      observedElements: document.getElementById('observedElements'),
      visibleTexts: document.getElementById('visibleTexts'),
      totalTexts: document.getElementById('totalTexts'),
      pendingTranslation: document.getElementById('pendingTranslation'),
      totalCharacters: document.getElementById('totalCharacters'),
      visibleCharacters: document.getElementById('visibleCharacters'),
      pendingCharacters: document.getElementById('pendingCharacters'),
      translatedCharacters: document.getElementById('translatedCharacters')
    };
    
    // 현재 탭 정보 가져오기
    await this.getCurrentTab();
    
    // 이벤트 리스너 설정
    this.setupEventListeners();
    
    // 초기 상태 확인
    await this.loadCurrentState();
    
    console.log('✅ Translation Popup 초기화 완료');
  }
  
  async getCurrentTab() {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tabs[0];
      console.log('📋 현재 탭:', this.currentTab.url);
    } catch (error) {
      console.error('❌ 현재 탭 정보 가져오기 실패:', error);
    }
  }
  
  setupEventListeners() {
    // 번역 토글 스위치
    this.elements.toggle.addEventListener('change', (e) => {
      this.handleToggleChange(e.target.checked);
    });
    
    // 새로고침 버튼
    this.elements.refreshBtn.addEventListener('click', () => {
      this.refreshStats();
    });
    
    // 테스트 버튼
    this.elements.testBtn.addEventListener('click', () => {
      this.runViewportTest();
    });
    
    // Background script로부터 메시지 수신
    browser.runtime.onMessage.addListener((message) => {
      this.handleBackgroundMessage(message);
    });
  }
  
  async loadCurrentState() {
    try {
      // 저장된 번역 상태 확인
      const result = await browser.storage.local.get(['translationActive']);
      const isActive = result.translationActive === true; // 명시적으로 true인 경우만 활성화
      
      this.updateToggleState(isActive);
      
      // 활성화 상태일 때만 통계 요청
      if (isActive) {
        this.requestStats();
      } else {
        // 비활성화 상태일 때는 통계 초기화
        this.clearStats();
      }
    } catch (error) {
      console.error('❌ 상태 로드 실패:', error);
    }
  }
  
  async handleToggleChange(isChecked) {
    console.log(`🔄 번역 토글 변경: ${isChecked ? 'ON' : 'OFF'}`);
    
    this.isTranslationActive = isChecked;
    this.updateToggleState(isChecked);
    
    // 상태 저장
    await browser.storage.local.set({ translationActive: isChecked });
    
    if (isChecked) {
      // 번역 활성화
      await this.activateTranslation();
    } else {
      // 번역 비활성화
      await this.deactivateTranslation();
    }
  }
  
  updateToggleState(isActive) {
    this.elements.toggle.checked = isActive;
    this.elements.statusText.textContent = isActive ? '활성' : '비활성';
    this.elements.statusText.className = isActive ? 'toggle-status active' : 'toggle-status';
    
    // 통계 섹션 표시/숨김
    this.elements.statsSection.style.display = isActive ? 'block' : 'none';
    
    // 버튼 활성화/비활성화
    this.elements.refreshBtn.disabled = !isActive;
    this.elements.testBtn.disabled = !isActive;
  }
  
  async activateTranslation() {
    if (!this.currentTab) {
      console.error('❌ 현재 탭 정보가 없습니다');
      return;
    }
    
    try {
      console.log('🚀 번역 기능 활성화 중...');
      
      // Content Script에 활성화 메시지 전송
      await browser.tabs.sendMessage(this.currentTab.id, {
        action: 'activateTranslation'
      });
      
      // 잠시 후 통계 요청
      setTimeout(() => {
        this.requestStats();
      }, 1000);
      
    } catch (error) {
      console.error('❌ 번역 활성화 실패:', error);
      
      // Content Script가 주입되지 않았을 수 있으므로 Background에서 주입 요청
      browser.runtime.sendMessage({
        action: 'injectAndActivate',
        tabId: this.currentTab.id
      });
    }
  }
  
  async deactivateTranslation() {
    if (!this.currentTab) return;
    
    try {
      console.log('⏹️ 번역 기능 비활성화 중...');
      
      // Content Script에 비활성화 메시지 전송
      await browser.tabs.sendMessage(this.currentTab.id, {
        action: 'deactivateTranslation'
      });
      
      // 통계 초기화
      this.clearStats();
      
    } catch (error) {
      console.error('❌ 번역 비활성화 실패:', error);
    }
  }
  
  async requestStats() {
    if (!this.currentTab || !this.isTranslationActive) return;
    
    try {
      // Content Script에서 현재 통계 요청
      await browser.tabs.sendMessage(this.currentTab.id, {
        action: 'getViewportStats'
      });
    } catch (error) {
      console.error('❌ 통계 요청 실패:', error);
      // 통계 요청 실패 시 통계 초기화
      this.clearStats();
    }
  }
  
  async refreshStats() {
    console.log('🔄 통계 새로고침');
    this.elements.refreshBtn.textContent = '🔄 새로고침 중...';
    this.elements.refreshBtn.disabled = true;
    
    await this.requestStats();
    
    setTimeout(() => {
      this.elements.refreshBtn.textContent = '🔄 상태 새로고침';
      this.elements.refreshBtn.disabled = false;
    }, 1000);
  }
  
  async runViewportTest() {
    console.log('🧪 뷰포트 테스트 실행');
    this.elements.testBtn.textContent = '🧪 테스트 중...';
    this.elements.testBtn.disabled = true;
    
    if (!this.currentTab) return;
    
    try {
      // Content Script에 테스트 요청
      await browser.tabs.sendMessage(this.currentTab.id, {
        action: 'runViewportTest'
      });
    } catch (error) {
      console.error('❌ 뷰포트 테스트 실패:', error);
    }
    
    setTimeout(() => {
      this.elements.testBtn.textContent = '🧪 뷰포트 테스트';
      this.elements.testBtn.disabled = false;
    }, 2000);
  }
  
  handleBackgroundMessage(message) {
    console.log('📩 Background에서 메시지 수신:', message);
    
    switch (message.action) {
      case 'statsUpdate':
        this.updateStats(message.stats);
        break;
      case 'translationProgress':
        this.updateProgress(message.progress);
        break;
      default:
        console.log('알 수 없는 메시지:', message);
    }
  }
  
  updateStats(stats) {
    if (!stats) return;
    
    console.log('📊 통계 업데이트:', stats);
    
    this.elements.observedElements.textContent = stats.observedElements || 0;
    this.elements.visibleTexts.textContent = stats.visibleTexts || 0;
    this.elements.totalTexts.textContent = stats.totalTexts || 0;
    this.elements.pendingTranslation.textContent = stats.pendingTranslation || 0;
    this.elements.totalCharacters.textContent = stats.totalCharacters || 0;
    this.elements.visibleCharacters.textContent = stats.visibleCharacters || 0;
    this.elements.pendingCharacters.textContent = stats.pendingCharacters || 0;
    this.elements.translatedCharacters.textContent = stats.translatedCharacters || 0;
  }
  
  updateProgress(progress) {
    console.log('📈 진행률 업데이트:', progress);
    // 향후 진행률 바 구현 시 사용
  }
  
  clearStats() {
    this.elements.observedElements.textContent = '0';
    this.elements.visibleTexts.textContent = '0';
    this.elements.totalTexts.textContent = '0';
    this.elements.pendingTranslation.textContent = '0';
    this.elements.totalCharacters.textContent = '0';
    this.elements.visibleCharacters.textContent = '0';
    this.elements.pendingCharacters.textContent = '0';
    this.elements.translatedCharacters.textContent = '0';
  }
}

// 팝업 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎉 팝업 DOM 로드 완료');
  
  // Chrome extension API 호환성
  if (typeof browser === 'undefined') {
    window.browser = chrome;
  }
  
  // 팝업 컨트롤러 초기화
  const popup = new TranslationPopup();
  
  // 전역에서 접근 가능하도록
  window.translationPopup = popup;
}); 