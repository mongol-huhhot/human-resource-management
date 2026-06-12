// src/utils/loadingService.js
// Global loading service for showing a loading overlay during async operations.
let loadingEl = null
let loadingCount = 0

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function appendStyle() {
  if (document.getElementById('surupas-global-loading-style')) return

  const style = document.createElement('style')
  style.id = 'surupas-global-loading-style'
  style.innerHTML = `
    #surupas-global-loading {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: rgba(0, 0, 0, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(2px);
    }

    .surupas-loading-box {
      min-width: 220px;
      max-width: 420px;
      padding: 28px;
      border-radius: 18px;
      background: #fff;
      text-align: center;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .surupas-spinner {
      width: 56px;
      height: 56px;
      margin: 0 auto;
      border: 6px solid #ddd;
      border-top-color: #1976d2;
      border-radius: 50%;
      animation: surupas-spin 1s linear infinite;
    }

    .surupas-loading-text {
      margin-top: 16px;
      font-size: 14px;
      color: #333;
      line-height: 1.5;
      white-space: pre-wrap;
    }

    @keyframes surupas-spin {
      to { transform: rotate(360deg); }
    }
  `
  document.head.appendChild(style)
}

export function showLoading(text = '処理中です...') {
  if (typeof document === 'undefined') {
    return { close() {} }
  }

  appendStyle()
  loadingCount++

  if (!loadingEl) {
    loadingEl = document.createElement('div')
    loadingEl.id = 'surupas-global-loading'
    loadingEl.innerHTML = `
      <div class="surupas-loading-box">
        <div class="surupas-spinner"></div>
        <div class="surupas-loading-text">${escapeHtml(text)}</div>
      </div>
    `
    document.body.appendChild(loadingEl)
  } else {
    const textEl = loadingEl.querySelector('.surupas-loading-text')
    if (textEl) textEl.textContent = text
  }

  let closed = false

  return {
    close() {
      if (closed) return
      closed = true
      loadingCount--

      if (loadingCount <= 0) {
        loadingCount = 0
        if (loadingEl) {
          loadingEl.remove()
          loadingEl = null
        }
      }
    },
  }
}

export function hideLoading() {
  loadingCount = 0
  if (loadingEl) {
    loadingEl.remove()
    loadingEl = null
  }
}