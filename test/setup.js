// Jest DOM 환경 설정
global.browser = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    }
  }
};

// Chrome API 폴백 (Firefox extension 호환성)
global.chrome = global.browser;