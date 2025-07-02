# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Firefox extension for translating English web page text to Korean using Google Gemini API. Uses viewport-based priority system to translate visible content first.

## Development Commands

### Local Development
```bash
pnpm install
pnpm dev                 # Serves test-pages/ on localhost:3000
pnpm test-server         # Alternative server on port 8080 with CORS
```

### Firefox Extension Testing
1. Navigate to `about:debugging` in Firefox
2. Click "Load Temporary Add-on" 
3. Select `manifest.json` from project root
4. Test via right-click context menu "이 페이지 번역하기"
5. Debug background script: `about:debugging` → extension "Inspect" button
6. After changes: Click "Reload" button in debugging panel

## Architecture

### Core Flow
User right-click → Background script → Content script injection → Text extraction → Viewport observation → Console output (Translation API integration pending)

### Key Components

**Background Script** (`background/background.js`)
- Context menu management and content script injection
- Message routing between popup and content scripts
- Future API coordination hub

**Content Layer** (dynamically injected)
- `textExtractor.js`: Priority-based text extraction with filtering
- `viewportManager.js`: IntersectionObserver for viewport tracking
- `contentScript.js`: Orchestration and message handling

**Text Processing System**
- Priority levels: High (h1-h3, title, main), Medium (p, nav, header), Low (div, span, li)
- Filters out: Korean text, numbers-only, special chars, short text, script/style elements
- Viewport-first processing using IntersectionObserver

### Message Passing
Background ↔ Content scripts via `browser.runtime.sendMessage/onMessage`
Content scripts communicate through shared global state and direct method calls

## File Structure Notes

- `manifest.json`: WebExtension v2 manifest with dynamic content script injection
- `test-pages/`: Local test content served by development server
- `docs/`: Detailed architecture and implementation documentation
- Content scripts use `browser.*` API with Chrome fallback (`window.browser = chrome`)

## Current Status

Basic extension structure complete with text extraction and viewport management. Translation API integration and user settings are planned next phases.