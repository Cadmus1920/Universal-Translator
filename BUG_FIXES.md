# Bug Fixes - Universal Translator

## 🐛 Bugs Fixed

### 1. ✅ Size Not Persisting Between Sessions
**Problem:** The bubble was resetting to a very small size every time it reopened.

**Root Cause:** The `stored` settings object was loaded once at initialization but never updated when the user changed size, position, or other settings. Each save operation was spreading the old `stored` values, overwriting the new changes.

**Solution:** Modified the `saveSettings()` function to accept an optional `updateStored` parameter that updates the local reference. Now when you resize, drag, or change any setting, the `stored` object is immediately updated so subsequent saves include all current settings.

**Files Modified:**
- `bubble-ui.js` - Updated saveSettings function and all save calls

### 2. ✅ Language Selector White Text in Dark Mode
**Problem:** The language dropdown had white text on white background in dark mode, making it unreadable.

**Root Cause:** The select element wasn't being styled when the theme was applied - only the bubble and header were getting theme colors.

**Solution:** Enhanced the `applyTheme()` function to also style the language selector with appropriate colors for both dark and light modes:
- Dark mode: Dark background (#2a2e38) with light text (#e0e0e0)
- Light mode: White background with dark text (#212121)

**Files Modified:**
- `ui-utils.js` - Enhanced applyTheme function to include select styling

## 📝 Testing Checklist

Before pushing to GitHub, please test:
- ✅ Resize the bubble, close it, and reopen - size should be preserved
- ✅ Drag the bubble, close it, and reopen - position should be preserved
- ✅ Change font size, close and reopen - font size should be preserved
- ✅ Toggle theme, close and reopen - theme should be preserved
- ✅ Select a language in dark mode - dropdown should be readable
- ✅ Select a language in light mode - dropdown should be readable
- ✅ Change language, close and reopen - selected language should be preserved

## 🚀 How to Update

1. **Replace the two files in your extension directory:**
   ```bash
   # Navigate to your extension
   cd /home/william/Programs/universal-translator/
   
   # Download the fixed files from this session, then:
   # Replace bubble-ui.js
   # Replace ui-utils.js
   ```

2. **Reload the extension in your browser:**
   - Go to `chrome://extensions` (or `brave://extensions`)
   - Click the reload button on Universal Translator
   - Test the fixes!

3. **Commit and push to GitHub:**
   ```bash
   cd /home/william/Programs/universal-translator/
   git add bubble-ui.js ui-utils.js
   git commit -m "Fix: Persist bubble size and style language selector

   - Fixed bubble not remembering size/position between sessions
   - Fixed language selector being unreadable in dark mode
   - Enhanced applyTheme to style select elements properly"
   
   git push
   ```

## 📦 Files Available for Download
- `bubble-ui.js` - Fixed settings persistence
- `ui-utils.js` - Fixed language selector styling

Both files are ready in the outputs above!
