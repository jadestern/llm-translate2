/**
 * 번역 컨트롤러 - 공통 UI 컴포넌트
 * 팝업과 번역 창에서 공통으로 사용
 */

class TranslationController {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = {
      isWindow: false, // 번역 창인지 팝업인지 구분
      showHeader: true,
      showNewWindowButton: true,
      ...options
    };
    
    this.isTranslationActive = false;
    this.currentTab = null;
    this.elements = {};
    
    this.init();
  }
  
  async init() {
    console.log('🔥 TranslationController 초기화 시작');
    
    // UI 렌더링
    this.render();
    
    // 현재 탭 정보 가져오기 (팝업에서만)
    if (!this.options.isWindow) {
      await this.getCurrentTab();
    } else {
      // 윈도우의 경우 URL 파라미터에서 탭 ID 가져오기
      const urlParams = new URLSearchParams(window.location.search);
      const tabId = urlParams.get('tabId');
      if (tabId) {
        this.currentTab = { id: parseInt(tabId) };
      }
    }
    
    // 이벤트 리스너 설정
    this.setupEventListeners();
    
    // 초기 상태 로드
    await this.loadCurrentState();
    
    // 윈도우의 경우 정기적 업데이트
    if (this.options.isWindow) {
      setInterval(() => {
        if (this.isTranslationActive) {
          this.requestStats();
        }
      }, 2000);
    }
    
    console.log('✅ TranslationController 초기화 완료');
  }
  
  render() {
    const headerHtml = this.options.showHeader ? `
      <div class="header">
        <h1>${this.options.isWindow ? '🌐 번역 상태' : '🌐 웹 번역기'}</h1>
        <div class="header-actions">
          ${this.options.isWindow ? '<button class="close-btn" id="closeBtn">✕</button>' : '<div class="version">v0.1.0</div>'}
        </div>
      </div>
    ` : '';
    
    const newWindowButtonHtml = this.options.showNewWindowButton && !this.options.isWindow ? `
      <button id="openWindowBtn" class="action-btn window-btn">
        🪟 새창 열기
      </button>
    ` : '';
    
    this.container.innerHTML = `
      <div class="translation-controller">
        ${headerHtml}
        
        <div class="main-controls">
          <div class="toggle-section">
            <div class="toggle-info">
              <span class="toggle-label">번역 활성화</span>
              <span class="toggle-status" id="statusText">비활성</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="translationToggle">
              <span class="slider"></span>
            </label>
          </div>
        </div>
        
        <div class="stats-section" id="statsSection" style="display: none;">
          <h3>📊 번역 상태</h3>
          <div class="stat-item">
            <span class="stat-label">관찰 중인 요소:</span>
            <span class="stat-value" id="observedElements">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">화면 문장:</span>
            <span class="stat-value" id="visibleTexts">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">전체 문장:</span>
            <span class="stat-value" id="totalTexts">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">대기 문장:</span>
            <span class="stat-value" id="pendingTranslation">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">전체 글자:</span>
            <span class="stat-value" id="totalCharacters">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">화면 글자:</span>
            <span class="stat-value" id="visibleCharacters">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">대기 글자:</span>
            <span class="stat-value" id="pendingCharacters">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">번역 완료:</span>
            <span class="stat-value" id="translatedCharacters">0</span>
          </div>
        </div>
        
        <div class="actions-section">
          <button id="refreshBtn" class="action-btn secondary" disabled>
            🔄 상태 새로고침
          </button>
          <button id="testBtn" class="action-btn primary" disabled>
            🧪 뷰포트 테스트
          </button>
          ${newWindowButtonHtml}
        </div>
        
        ${this.options.isWindow ? `
          <div class="live-info">
            <h3>📝 실시간 정보</h3>
            <div class="info-text" id="liveInfo">
              번역 기능을 활성화하면 실시간 정보가 여기에 표시됩니다.
            </div>
          </div>
        ` : `
          <div class="footer">
            <a href="#" id="settingsLink">⚙️ 설정</a>
            <span class="separator">|</span>
            <a href="#" id="helpLink">❓ 도움말</a>
          </div>
        `}
      </div>
    `;
    
    // DOM 요소들 수집
    this.collectElements();
  }
  
  collectElements() {
    this.elements = {
      toggle: this.container.querySelector('#translationToggle'),
      statusText: this.container.querySelector('#statusText'),
      statsSection: this.container.querySelector('#statsSection'),
      refreshBtn: this.container.querySelector('#refreshBtn'),
      testBtn: this.container.querySelector('#testBtn'),
      openWindowBtn: this.container.querySelector('#openWindowBtn'),
      closeBtn: this.container.querySelector('#closeBtn'),
      observedElements: this.container.querySelector('#observedElements'),
      visibleTexts: this.container.querySelector('#visibleTexts'),
      totalTexts: this.container.querySelector('#totalTexts'),
      pendingTranslation: this.container.querySelector('#pendingTranslation'),
      totalCharacters: this.container.querySelector('#totalCharacters'),
      visibleCharacters: this.container.querySelector('#visibleCharacters'),
      pendingCharacters: this.container.querySelector('#pendingCharacters'),
      translatedCharacters: this.container.querySelector('#translatedCharacters'),
      liveInfo: this.container.querySelector('#liveInfo')
    };
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
    if (this.elements.toggle) {
      this.elements.toggle.addEventListener('change', (e) => {
        this.handleToggleChange(e.target.checked);
      });
    }
    
    // 새로고침 버튼
    if (this.elements.refreshBtn) {
      this.elements.refreshBtn.addEventListener('click', () => {
        this.refreshStats();
      });
    }
    
    // 테스트 버튼
    if (this.elements.testBtn) {
      this.elements.testBtn.addEventListener('click', () => {
        this.runViewportTest();
      });
    }
    
    // 새창 열기 버튼
    if (this.elements.openWindowBtn) {
      this.elements.openWindowBtn.addEventListener('click', () => {
        this.openTranslationWindow();
      });
    }
    
    // 닫기 버튼 (윈도우에서만)
    if (this.elements.closeBtn) {
      this.elements.closeBtn.addEventListener('click', () => {
        window.close();
      });
    }
    
    // Background script로부터 메시지 수신
    browser.runtime.onMessage.addListener((message) => {
      this.handleBackgroundMessage(message);
    });
  }
  
  async loadCurrentState() {
    try {
      // 저장된 번역 상태 확인
      const result = await browser.storage.local.get(['translationActive']);
      const isActive = result.translationActive === true;
      
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
    
    // 윈도우의 경우 실시간 정보 업데이트
    if (this.options.isWindow && this.elements.liveInfo) {
      this.updateLiveInfo(`번역이 ${isActive ? '활성화' : '비활성화'}되었습니다.`);
    }
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
      this.elements.refreshBtn.disabled = !this.isTranslationActive;
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
      
      if (this.options.isWindow && this.elements.liveInfo) {
        this.updateLiveInfo('뷰포트 테스트를 실행했습니다.');
      }
    } catch (error) {
      console.error('❌ 뷰포트 테스트 실패:', error);
    }
    
    setTimeout(() => {
      this.elements.testBtn.textContent = '🧪 뷰포트 테스트';
      this.elements.testBtn.disabled = !this.isTranslationActive;
    }, 2000);
  }
  
  async openTranslationWindow() {
    try {
      console.log('🪟 번역 창 열기 시작');
      
      // Background Script에 새창 요청
      await browser.runtime.sendMessage({
        action: 'openTranslationWindow',
        currentTabId: this.currentTab?.id
      });
      
      // 팝업 닫기 (선택사항)
      if (!this.options.isWindow) {
        window.close();
      }
      
    } catch (error) {
      console.error('❌ 새창 열기 실패:', error);
    }
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
    
    // 윈도우의 경우 실시간 정보 업데이트
    if (this.options.isWindow && this.elements.liveInfo) {
      this.updateLiveInfo(`통계 업데이트: ${stats.visibleTexts}개 텍스트가 뷰포트에 표시됨`);
    }
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
  
  updateLiveInfo(message) {
    if (!this.elements.liveInfo) return;
    
    const now = new Date().toLocaleTimeString();
    this.elements.liveInfo.innerHTML = `<strong>${now}</strong><br>${message}`;
  }
}

// 전역에서 사용할 수 있도록
window.TranslationController = TranslationController;