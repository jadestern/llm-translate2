module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  testMatch: ['<rootDir>/test/**/*.test.js'],
  collectCoverageFrom: [
    'content/**/*.js',
    '!content/**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true
};