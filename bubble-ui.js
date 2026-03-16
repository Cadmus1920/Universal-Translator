// bubble-ui.js - Main translator bubble UI

(() => {
  // Get constants and utilities from window (injected by earlier scripts)
  const {
    BUBBLE_ID, UI_DEFAULTS, Z_INDEX, Z_INDEX_FULLSCREEN,
    LANGUAGES, clamp, applyTheme, applyFontSize, showError,
    DragHandler, ResizeHandler, validateSettings
  } = window;

  // --------------------------------------------------------------
  // Messaging helpers (load / save settings)
  // --------------------------------------------------------------
  function loadSettings() {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ type: "getSettings" }, res => {
        const validated = validateSettings(res || {}, UI_DEFAULTS);
        resolve(validated);
      });
    });
  }

  function saveSettings(settings, updateStored) {
    chrome.runtime.sendMessage({ type: "saveSettings", data: settings });
    // Update the stored reference so subsequent saves include all settings
    if (updateStored) {
      Object.assign(updateStored, settings);
    }
  }

  // --------------------------------------------------------------
  // Listen for error messages from background.js
  // --------------------------------------------------------------
  chrome.runtime.onMessage.addListener((msg, _sender, _sendResponse) => {
    if (msg.type === "translationError") {
      showError(msg.message);
    }
  });

  // --------------------------------------------------------------
  // Main entry point – called from background.js
  // --------------------------------------------------------------
  window.showTranslatorBubble = async (text, detectedLang) => {
    // Re-use existing bubble if it already exists
    let bubble = document.getElementById(BUBBLE_ID);
    const stored = await loadSettings();

    if (bubble) {
      const content = bubble.querySelector("#tb-content");
      if (content) content.textContent = text;
      return;
    }

    // Track cleanup functions for proper teardown
    const cleanupFns = [];

    // Declare prevGeometry before use (fixes hoisting bug)
    let prevGeometry = null;

    // Build the bubble DOM
    bubble = document.createElement("div");
    bubble.id = BUBBLE_ID;
    bubble.setAttribute("role", "dialog");
    bubble.setAttribute("aria-modal", "true");
    bubble.setAttribute("aria-label", "Translation result");

    bubble.innerHTML = `
      <div id="tb-header">
        <span id="tb-title">Translator</span>
        <select id="tb-lang-select"
                aria-label="Target language"
                title="Choose translation language"></select>
        <div id="tb-buttons">
          <button id="tb-font-minus" aria-label="Decrease font size" title="Decrease font size">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="7" y="11" font-family="Arial, sans-serif" font-size="12" font-weight="bold" text-anchor="middle" fill="currentColor">A</text>
              <line x1="1" y1="3" x2="5" y2="3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <button id="tb-font-plus" aria-label="Increase font size" title="Increase font size">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="7" y="11" font-family="Arial, sans-serif" font-size="12" font-weight="bold" text-anchor="middle" fill="currentColor">A</text>
              <line x1="1" y1="3" x2="5" y2="3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="3" y1="1" x2="3" y2="5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <button id="tb-clear" aria-label="Clear text" title="Clear text">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 2L6 1h4l1 1h3v2H2V2h3z" fill="currentColor"/>
              <path d="M3 4h10v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" stroke="currentColor" stroke-width="1.2" fill="none"/>
              <line x1="6" y1="6" x2="6" y2="12" stroke="currentColor" stroke-width="1.2"/>
              <line x1="10" y1="6" x2="10" y2="12" stroke="currentColor" stroke-width="1.2"/>
            </svg>
          </button>
          <button id="tb-theme" aria-label="Toggle dark/light theme" title="Toggle theme">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1a7 7 0 007 7 7 7 0 00-7 7A7 7 0 008 1z" fill="currentColor"/>
            </svg>
          </button>
          <button id="tb-fullscreen" aria-label="Toggle full-screen" title="Toggle fullscreen">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1h5v2H3v3H1V1zM15 1h-5v2h3v3h2V1zM1 15h5v-2H3v-3H1v5zM15 15h-5v-2h3v-3h2v5z" fill="currentColor"/>
            </svg>
          </button>
          <button id="tb-copy" aria-label="Copy to clipboard" title="Copy to clipboard">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="5" width="9" height="10" rx="1" stroke="currentColor" stroke-width="1.2" fill="none"/>
              <path d="M5 5V2a1 1 0 011-1h7a1 1 0 011 1v7a1 1 0 01-1 1h-3" stroke="currentColor" stroke-width="1.2" fill="none"/>
            </svg>
          </button>
          <button id="tb-close" aria-label="Close dialog" title="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div id="tb-error" role="alert" aria-live="assertive"
           style="display:none;padding:4px 8px;color:#b71c1c;background:#ffebee;"></div>
      <div id="tb-content" tabindex="0" aria-live="polite" role="status"></div>
      <div id="tb-resize" aria-hidden="true"></div>
    `;

    // Grab frequently used elements
    const header = bubble.querySelector("#tb-header");
    const content = bubble.querySelector("#tb-content");
    const resizer = bubble.querySelector("#tb-resize");
    const btnMinus = bubble.querySelector("#tb-font-minus");
    const btnPlus = bubble.querySelector("#tb-font-plus");
    const btnClear = bubble.querySelector("#tb-clear");
    const btnCopy = bubble.querySelector("#tb-copy");
    const btnTheme = bubble.querySelector("#tb-theme");
    const btnClose = bubble.querySelector("#tb-close");
    const btnFull = bubble.querySelector("#tb-fullscreen");
    const langSelect = bubble.querySelector("#tb-lang-select");

    // Populate the language selector
    LANGUAGES.forEach(l => {
      const opt = document.createElement("option");
      opt.value = l.code;
      opt.textContent = l.name;
      langSelect.appendChild(opt);
    });

    const uiLang = chrome.i18n.getUILanguage().split("-")[0];
    const currentLang = stored.targetLang || uiLang;
    langSelect.value = currentLang;

    // Helper: update title to show detected source language
    const title = bubble.querySelector("#tb-title");
    const updateTitle = (langCode) => {
      const lang = LANGUAGES.find(l => l.code === langCode);
      title.textContent = lang ? `${lang.name} → Translator` : "Translator";
    };
    if (detectedLang) updateTitle(detectedLang);

    // Store original source text so retranslation always uses it
    const sourceText = text;
    let theme = stored.theme || UI_DEFAULTS.theme;
    let fontSize = stored.fontSize || UI_DEFAULTS.fontSize;
    let isFullScreen = false;

    const startW = stored.width || UI_DEFAULTS.width;
    const startH = stored.height || UI_DEFAULTS.height;
    const startL = clamp(
      stored.left ?? UI_DEFAULTS.left,
      UI_DEFAULTS.safeMargin,
      window.innerWidth - startW - UI_DEFAULTS.safeMargin
    );
    const startT = clamp(
      stored.top ?? UI_DEFAULTS.top,
      UI_DEFAULTS.safeTop,
      window.innerHeight - startH - UI_DEFAULTS.safeMargin
    );

    // Apply initial styles
    Object.assign(bubble.style, {
      position: "fixed",
      top: `${startT}px`,
      left: `${startL}px`,
      width: `${startW}px`,
      height: `${startH}px`,
      borderRadius: "10px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
      zIndex: String(Z_INDEX),
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    });

    Object.assign(header.style, {
      padding: "8px 10px",
      fontWeight: "600",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      userSelect: "none"
    });

    Object.assign(content.style, {
      padding: "10px",
      overflow: "auto",
      flex: "1",
      lineHeight: "1.4",
      whiteSpace: "pre-wrap"
    });

    Object.assign(resizer.style, {
      width: "14px",
      height: "14px",
      position: "absolute",
      right: "2px",
      bottom: "2px",
      cursor: "nwse-resize"
    });

    // Style all buttons
    const buttons = bubble.querySelectorAll("#tb-buttons button");
    buttons.forEach(btn => {
      Object.assign(btn.style, {
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "4px 6px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "3px",
        transition: "background 0.2s"
      });
      
      // Hover effect
      btn.addEventListener("mouseenter", () => {
        btn.style.background = "rgba(255, 255, 255, 0.1)";
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.background = "transparent";
      });
    });

    const refreshTheme = () => applyTheme(bubble, theme);
    const refreshFont = () => applyFontSize(content, fontSize);
    refreshTheme();
    refreshFont();

    // Close with proper cleanup
    const closeBubble = () => {
      cleanupFns.forEach(fn => fn());
      bubble.remove();
    };

    // Initialize handlers with cleanup tracking
    cleanupFns.push(DragHandler(bubble, header, UI_DEFAULTS, (pos) => {
      saveSettings({ ...stored, left: pos.left, top: pos.top }, stored);
    }));

    cleanupFns.push(ResizeHandler(bubble, resizer, UI_DEFAULTS, (size) => {
      saveSettings({ ...stored, width: size.width, height: size.height }, stored);
    }));

    // Language change handler
    langSelect.addEventListener("change", () => {
      const newLang = langSelect.value;
      saveSettings({ ...stored, targetLang: newLang }, stored);

      chrome.runtime.sendMessage(
        { type: "retranslate", payload: { text: sourceText, targetLang: newLang } },
        response => {
          if (response?.ok) {
            content.textContent = response.translated;
            content.focus();
          } else {
            showError(response?.error || "Failed to refresh translation");
          }
        }
      );
    });

    // Button actions
    btnPlus.onclick = () => {
      if (fontSize < UI_DEFAULTS.maxFont) {
        fontSize += UI_DEFAULTS.fontStep;
        refreshFont();
        saveSettings({ ...stored, fontSize }, stored);
      }
    };

    btnMinus.onclick = () => {
      if (fontSize > UI_DEFAULTS.minFont) {
        fontSize -= UI_DEFAULTS.fontStep;
        refreshFont();
        saveSettings({ ...stored, fontSize }, stored);
      }
    };

    btnClear.onclick = () => (content.textContent = "");

    btnCopy.onclick = async () => {
      await navigator.clipboard.writeText(content.textContent);
      const orig = btnCopy.textContent;
      btnCopy.textContent = "✔";
      setTimeout(() => (btnCopy.textContent = orig), 800);
    };

    btnTheme.onclick = () => {
      theme = theme === "dark" ? "light" : "dark";
      refreshTheme();
      saveSettings({ ...stored, theme }, stored);
    };

    btnFull.onclick = () => {
      if (!isFullScreen) {
        prevGeometry = {
          width: bubble.offsetWidth,
          height: bubble.offsetHeight,
          left: bubble.offsetLeft,
          top: bubble.offsetTop
        };
        Object.assign(bubble.style, {
          top: "0",
          left: "0",
          width: "100vw",
          height: "100vh",
          borderRadius: "0",
          maxWidth: "none",
          maxHeight: "none",
          zIndex: String(Z_INDEX_FULLSCREEN)
        });
        resizer.style.display = "none";
        isFullScreen = true;
      } else {
        const { width, height, left, top } = prevGeometry;
        Object.assign(bubble.style, {
          top: `${top}px`,
          left: `${left}px`,
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: "10px",
          zIndex: String(Z_INDEX)
        });
        resizer.style.display = "";
        isFullScreen = false;
      }
    };

    btnClose.onclick = closeBubble;

    // Escape key handling
    bubble.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        if (isFullScreen) btnFull.click();
        else closeBubble();
      }
    });

    // Insert the translated text and attach the bubble
    content.textContent = text;
    content.focus();
    document.body.appendChild(bubble);
  };
})();
