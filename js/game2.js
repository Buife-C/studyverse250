// ── Planet data (all 8 planets) ──
const PLANETS = [
  { id: 'mercury', name: 'Mercury', img: 'images/Mercury.png' },
  { id: 'venus',   name: 'Venus',   img: 'images/Venus.png'   },
  { id: 'earth',   name: 'Earth',   img: 'images/Earth.png'   },
  { id: 'mars',    name: 'Mars',    img: 'images/Mars.png'    },
  { id: 'jupiter', name: 'Jupiter', img: 'images/Jupiter.png' },
  { id: 'saturn',  name: 'Saturn',  img: 'images/Saturn.png'  },
  { id: 'uranus',  name: 'Uranus',  img: 'images/Uranus.png'  },
  { id: 'neptune', name: 'Neptune', img: 'images/Neptune.png' },
];

// Correct order: smallest → largest by diameter
const CORRECT_ORDER = ['mercury', 'mars', 'venus', 'earth', 'neptune', 'uranus', 'saturn', 'jupiter'];
const QUIZ_ANSWERS = { q1: '95', q2: 'saturn', q3: 'neptune' };

let draggedId     = null;
let draggedSource = null; // 'bank' | zone index (number)
let hasSubmittedQuiz = false;

// ── Helpers ──
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getPlanetEl(id, source) {
  if (source === 'bank') return document.querySelector(`#planetsRow [data-id="${id}"]`);
  return document.querySelector(`.drop-zone[data-index="${source}"] [data-id="${id}"]`);
}

// ── Build planet element ──
function createPlanetEl(planet) {
  const el = document.createElement('div');
  el.className    = 'planet-item';
  el.dataset.id   = planet.id;
  el.draggable    = true;
  el.innerHTML    = `<img src="${planet.img}" alt="${planet.name}" /><span>${planet.name}</span>`;
  el.addEventListener('dragstart', onDragStart);
  el.addEventListener('dragend',   onDragEnd);
  return el;
}

// ── Init ──
function init() {
  const planetsRow  = document.getElementById('planetsRow');
  const dropzonesEl = document.getElementById('dropzones');
  const quizForm = document.getElementById('quizForm');

  shuffle(PLANETS).forEach(p => planetsRow.appendChild(createPlanetEl(p)));

  for (let i = 0; i < CORRECT_ORDER.length; i++) {
    const zone = document.createElement('div');
    zone.className     = 'drop-zone';
    zone.dataset.index = i;
    zone.addEventListener('dragover',  onDragOver);
    zone.addEventListener('dragleave', onDragLeave);
    zone.addEventListener('drop',      onDropZone);
    dropzonesEl.appendChild(zone);
  }

  planetsRow.addEventListener('dragover',  onDragOver);
  planetsRow.addEventListener('dragleave', onDragLeave);
  planetsRow.addEventListener('drop',      onDropBank);

  quizForm?.addEventListener('submit', onQuizSubmit);
}

function isPlanetChallengeComplete() {
  const zones = document.querySelectorAll('.drop-zone');
  return Array.from(zones).every((zone, i) => {
    const p = zone.querySelector('.planet-item');
    return p && p.dataset.id === CORRECT_ORDER[i];
  });
}

function updateContinueButton(allCorrect = isPlanetChallengeComplete()) {
  document.getElementById('continueBtn').classList.toggle('visible', allCorrect && hasSubmittedQuiz);
}

function onQuizSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.currentTarget);
  let score = 0;

  Object.entries(QUIZ_ANSWERS).forEach(([question, answer]) => {
    if (formData.get(question) === answer) score += 1;
  });

  hasSubmittedQuiz = true;
  const challengeComplete = isPlanetChallengeComplete();
  updateContinueButton(challengeComplete);

  const result = document.getElementById('quizResult');
  if (result) {
    if (score === 3 && challengeComplete) {
      result.textContent = 'Perfect score! You got all 3 questions right and completed the challenge.';
    } else if (score === 3) {
      result.textContent = 'Perfect score! Now finish the planet size challenge to continue.';
    } else if (challengeComplete) {
      result.textContent = `Nice try! You got ${score} out of 3 correct. Your game is complete, so you can continue or review your answers.`;
    } else {
      result.textContent = `Nice try! You got ${score} out of 3 correct. Now finish the planet size challenge to continue.`;
    }
  }
}

// ── Drag events ──
function onDragStart(e) {
  draggedId     = e.currentTarget.dataset.id;
  const parent  = e.currentTarget.closest('.drop-zone');
  draggedSource = parent ? parseInt(parent.dataset.index) : 'bank';
  setTimeout(() => { e.currentTarget.style.opacity = '0.35'; }, 0);
}

function onDragEnd(e) {
  e.currentTarget.style.opacity = '1';
}

function onDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}

function onDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

// ── Drop onto a zone ──
function onDropZone(e) {
  e.preventDefault();
  const zone = e.currentTarget;
  zone.classList.remove('drag-over');

  const dragged  = getPlanetEl(draggedId, draggedSource);
  if (!dragged) return;

  const existing = zone.querySelector('.planet-item');

  // Swap resident back to source if zone is occupied
  if (existing && existing !== dragged) {
    if (draggedSource === 'bank') {
      document.getElementById('planetsRow').appendChild(existing);
    } else {
      document.querySelector(`.drop-zone[data-index="${draggedSource}"]`).appendChild(existing);
    }
  }

  zone.appendChild(dragged);
  checkWin();
}

// ── Drop back onto the bank ──
function onDropBank(e) {
  e.preventDefault();
  document.getElementById('planetsRow').classList.remove('drag-over');
  if (draggedSource === 'bank') return;
  const dragged = getPlanetEl(draggedId, draggedSource);
  if (dragged) { document.getElementById('planetsRow').appendChild(dragged); checkWin(); }
}

// ── Win check ──
function checkWin() {
  const zones      = document.querySelectorAll('.drop-zone');
  let   allCorrect = true;

  zones.forEach((zone, i) => {
    const p = zone.querySelector('.planet-item');
    zone.classList.remove('correct', 'incorrect');
    if (!p) {
      allCorrect = false;
    } else if (p.dataset.id === CORRECT_ORDER[i]) {
      zone.classList.add('correct');
    } else {
      zone.classList.add('incorrect');
      allCorrect = false;
    }
  });

  if (allCorrect) markProgress(KEYS.game2);

  updateContinueButton(allCorrect);
}

// ── Fullscreen ──
function toggleFullscreen() {
  const el = document.getElementById('gameContainer');
  if (!document.fullscreenElement) {
    el.requestFullscreen().catch(err => console.warn('Fullscreen error:', err));
  } else {
    document.exitFullscreen();
  }
}

document.addEventListener('fullscreenchange', () => {
  const btn = document.querySelector('.fullscreen-btn');
  if (btn) {
    btn.textContent = document.fullscreenElement ? 'Exit Full Screen' : 'Play Full Screen';
  }
});

init();
