// ════════════════════════════════
// STUDYVERSE – PROGRESS TRACKER
// ════════════════════════════════

// localStorage keys
const KEYS = {
  video1: 'sv_video1_watched',
  game1:  'sv_game1_complete',
  video2: 'sv_video2_watched',
  game2:  'sv_game2_complete',
};

/** Persist a progress milestone */
function markProgress(key) {
  localStorage.setItem(key, '1');
}

function getCurrentPage() {
  return window.location.pathname.split('/').pop();
}

function getVideoPageConfig() {
  const page = getCurrentPage();

  if (page === 'video1.html') {
    return { storageKey: KEYS.video1, iframeId: 'lessonVideo', buttonId: 'unlockBtn' };
  }

  if (page === 'video2.html') {
    return { storageKey: KEYS.video2, iframeId: 'lessonVideo', buttonId: 'unlockBtn' };
  }

  return null;
}

function showUnlockButton(button) {
  if (button) button.classList.add('visible');
}

function showStepButton(button) {
  if (button) button.classList.add('visible');
}

function getStepNavConfig() {
  switch (getCurrentPage()) {
    case 'video1.html':
      return {
        id: 'nextBtn',
        type: 'next',
        href: 'game1.html',
        ariaLabel: 'Go to Game 1',
        storageKey: KEYS.video1,
      };
    case 'game1.html':
      return {
        id: 'backBtn',
        type: 'back',
        href: 'video1.html',
        ariaLabel: 'Go to Lesson 1',
      };
    case 'video2.html':
      return {
        id: 'nextBtn',
        type: 'next',
        href: 'game2.html',
        ariaLabel: 'Go to Game 2',
        storageKey: KEYS.video2,
      };
    case 'game2.html':
      return {
        id: 'backBtn',
        type: 'back',
        href: 'video2.html',
        ariaLabel: 'Go to Lesson 2',
      };
    default:
      return null;
  }
}

function isStepButtonVisible(config) {
  if (!config) return false;
  if (config.type === 'back') return true;
  return !!localStorage.getItem(config.storageKey);
}

function getStepButtonIcon(type) {
  if (type === 'back') {
    return `
      <svg viewBox="0 0 28 24" aria-hidden="true">
        <path d="M16 5l-8 7 8 7" />
        <path d="M9 12h12" />
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 28 24" aria-hidden="true">
      <path d="M12 5l8 7-8 7" />
      <path d="M7 12h12" />
    </svg>
  `;
}

/** Return true if the given page id is accessible */
function isUnlocked(pageId) {
  switch (pageId) {
    case 'home':   return true;
    case 'video1': return true;
    case 'game1':  return !!localStorage.getItem(KEYS.video1);
    case 'video2': return !!localStorage.getItem(KEYS.game1);
    case 'game2':  return !!localStorage.getItem(KEYS.video2);
    case 'final':  return !!localStorage.getItem(KEYS.game2);
    default:       return false;
  }
}

function loadYouTubeApi(callback) {
  if (window.YT && window.YT.Player) {
    callback();
    return;
  }

  const previousReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    if (typeof previousReady === 'function') previousReady();
    callback();
  };

  if (!document.querySelector('script[data-youtube-api="true"]')) {
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.dataset.youtubeApi = 'true';
    document.head.appendChild(script);
  }
}

function initVideoUnlock() {
  const config = getVideoPageConfig();
  if (!config) return;

  const unlockBtn = document.getElementById(config.buttonId);
  const iframe = document.getElementById(config.iframeId);
  const nextBtn = document.getElementById('nextBtn');
  if (!unlockBtn || !iframe) return;

  if (localStorage.getItem(config.storageKey)) {
    showUnlockButton(unlockBtn);
    showStepButton(nextBtn);
    return;
  }

  loadYouTubeApi(() => {
    if (!(window.YT && window.YT.Player)) return;

    new window.YT.Player(config.iframeId, {
      events: {
        onStateChange: event => {
          if (event.data !== window.YT.PlayerState.ENDED) return;

          markProgress(config.storageKey);
          showUnlockButton(unlockBtn);
          showStepButton(nextBtn);
          buildSidebar();
        },
      },
    });
  });
}

// ════════════════════════════════
// SIDEBAR BUILDER
// ════════════════════════════════
const NAV_ITEMS = [
  { id: 'home',   label: 'Home',    href: 'index.html'   },
  { id: 'video1', label: 'Lesson 1', href: 'video1.html' },
  { id: 'game1',  label: 'Game 1',  href: 'game1.html'  },
  { id: 'video2', label: 'Lesson 2', href: 'video2.html' },
  { id: 'game2',  label: 'Game 2',  href: 'game2.html'  },
  { id: 'final',  label: 'Final',   href: 'final.html'  },
];

function buildSidebar() {
  document.getElementById('hamburgerBtn')?.remove();
  document.getElementById('backBtn')?.remove();
  document.getElementById('nextBtn')?.remove();
  document.getElementById('sidebar')?.remove();
  document.getElementById('sidebarOverlay')?.remove();

  // ── Overlay ──
  const overlay = document.createElement('div');
  overlay.id = 'sidebarOverlay';
  overlay.addEventListener('click', closeSidebar);

  // ── Sidebar panel ──
  const sidebar = document.createElement('nav');
  sidebar.id = 'sidebar';

  // Close button (✕)
  const closeBtn = document.createElement('button');
  closeBtn.id          = 'sidebarCloseBtn';
  closeBtn.textContent = '✕';
  closeBtn.setAttribute('aria-label', 'Close menu');
  closeBtn.addEventListener('click', closeSidebar);
  sidebar.appendChild(closeBtn);

  // Sidebar title
  const title = document.createElement('p');
  title.className   = 'sidebar-title';
  title.textContent = 'StudyVerse';
  sidebar.appendChild(title);

  // Nav list
  const ul = document.createElement('ul');
  NAV_ITEMS.forEach(item => {
    const li = document.createElement('li');
    if (isUnlocked(item.id)) {
      const a       = document.createElement('a');
      a.href        = item.href;
      a.textContent = item.label;
      li.appendChild(a);
    } else {
      li.classList.add('locked');
      li.innerHTML = `<span>${item.label}</span><span class="lock-icon">🔒</span>`;
    }
    ul.appendChild(li);
  });
  sidebar.appendChild(ul);

  // ── Hamburger button ──
  const btn = document.createElement('button');
  btn.id = 'hamburgerBtn';
  btn.setAttribute('aria-label', 'Toggle navigation menu');
  btn.innerHTML = '<span></span><span></span><span></span>';
  btn.addEventListener('click', toggleSidebar);

  const stepConfig = getStepNavConfig();

  if (stepConfig) {
    const stepBtn = document.createElement('button');
    stepBtn.id = stepConfig.id;
    stepBtn.type = 'button';
    stepBtn.className = 'step-nav-btn';
    stepBtn.setAttribute('aria-label', stepConfig.ariaLabel);
    stepBtn.innerHTML = getStepButtonIcon(stepConfig.type);
    if (isStepButtonVisible(stepConfig)) stepBtn.classList.add('visible');
    stepBtn.addEventListener('click', () => {
      window.location.href = stepConfig.href;
    });
    document.body.prepend(stepBtn);
  }

  // Inject into page
  document.body.prepend(overlay);
  document.body.prepend(sidebar);
  document.body.prepend(btn);
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

// ── Init on DOM ready ──
document.addEventListener('DOMContentLoaded', () => {
  buildSidebar();
  initVideoUnlock();
});
