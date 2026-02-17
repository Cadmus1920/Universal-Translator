# Universal Translator

A lightweight browser extension that translates selected text into any language and displays it in a movable, resizable popup bubble. Works with Chrome, Brave, Edge, and all Chromium-based browsers.

## Features
- Right‑click translate
- Floating resizable window
- Dark / light mode
- Copy to clipboard
- Saves size and position
- **Language selector with instant refresh** (choose any supported language without closing the bubble)
- Google Translate backend

## Install (Developer mode)
1. Open `chrome://extensions` (or `brave://extensions`, `edge://extensions`)
2. Enable Developer mode
3. Click "Load unpacked"
4. Select this folder

## Changelog

### v1.1.0
- Initial stable release. I skipped v1.0.0 cause I'm a rebel. 

### v1.2.0
- Renamed extension to Universal Translator
- Added Clear button to translator bubble

### v1.3.0
- Added font size increase/decrease buttons
- Prevented bubble from being dragged off-screen
- Improved recovery from saved window positions

### v1.4.0
- Added edge snapping for the translator bubble
- Improved drag and placement UX
- Fixed MV3 context invalidation issues
- Stabilized background messaging and settings persistence

## v1.4.1 
- Added “Full‑screen” button to the translator bubble.
- Preserves paragraph styling when toggling full‑screen.
- Updated escape‑key handling to exit full‑screen before closing.

## v1.4.2
- Added a **language selector** to the translator bubble.
- Implemented **instant re‑translation** when the user changes the language (no need to close/re‑open the bubble).
- Fixed a bug where the context‑menu entry disappeared after a reload by ensuring the menu is registered on every service‑worker start.

## Status
Personal project. Stable baseline tagged as v1.0-stable.
