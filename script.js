(() => {
  'use strict';

  // ---------- preguntas ----------
  const QUESTIONS = [
    {
      question: 'El maestro cocinero cayó al barril de salsa. ¿Cuál es realmente el problema?',
      options: ['Que el maestro no sabe nadar', 'Que nadie limpia el horno', 'Que todo está desorganizado y no hay liderazgo'],
      answer: 2,
      tip: 'Un accidente es un síntoma: el problema de fondo es la falta de organización y liderazgo.'
    },
    {
      question: '¿Qué está causando el caos en la cocina?',
      options: ['No hay planificación', 'Los tambores están muy fuertes', 'El bambú canta solo'],
      answer: 0,
      tip: 'Sin planificación nadie sabe qué hacer ni cuándo.'
    },
    {
      question: '¿Cuál es tu meta real?',
      options: ['Ganarte la admiración de la osa que te gusta', 'Hacer el dumpling más grande', 'Liderar el equipo y entregar el festival'],
      answer: 2,
      tip: 'La meta debe responder al problema: que el festival salga adelante.'
    },
    {
      question: '¿Qué opción posible puedes tomar?',
      options: ['Festival silencioso', 'Pedir ayuda a los osos rojos con baile', 'Fingir una invasión de topos'],
      answer: 1,
      tip: 'Pedir ayuda suma manos y entusiasmo sin engañar a nadie.'
    },
    {
      question: '¿Qué recursos puedes usar?',
      options: ['Monjes que riman', 'Oveja sabia diaria', 'Ambos son útiles'],
      answer: 2,
      tip: 'Un buen líder aprovecha todos los recursos disponibles.'
    },
    {
      question: '¿Qué decisión es más viable?',
      options: ['Cocinar solo de noche', 'Dividir el trabajo por equipos', 'Que cada quien cocine por su cuenta'],
      answer: 1,
      tip: 'Dividir el trabajo en equipos es realista y aprovecha el tiempo.'
    },
    {
      question: '¿Cómo anunciarás tu decisión?',
      options: ['Con un grito ninja sin sentido', 'Con una frase sabia de maestro kung fu', 'Con notas en la espalda de un pato'],
      answer: 1,
      tip: 'Un mensaje claro e inspirador motiva al equipo.'
    },
    {
      question: '¿Cómo das instrucciones claras?',
      options: ['Solo gritas «¡háganlo bien!»', 'Asignas tareas y tiempos por equipo', 'Esperas que lo adivinen'],
      answer: 1,
      tip: 'Instrucciones claras = tareas concretas, responsables y plazos.'
    },
    {
      question: '¿Qué harás si algo sale mal?',
      options: ['Te escondes', 'Culpas al clima', 'Te disculpas y ajustas el plan'],
      answer: 2,
      tip: 'Asumir el error y corregir el rumbo es parte de liderar.'
    },
    {
      question: '¿Cómo sabes que fue un éxito?',
      options: ['Hubo más bambú que gente', 'Visitantes felices, equipo unido y sin desperdicio', 'Ganaste muchos «likes»'],
      answer: 1,
      tip: 'El éxito se mide con resultados reales: personas satisfechas y buen uso de recursos.'
    }
  ];

  const MAX_LIVES = 3;

  // ---------- Elementos ----------
  const $ = (id) => document.getElementById(id);
  const el = {
    game: document.querySelector('.game'),
    play: $('playScreen'), end: $('endScreen'),
    doorLabel: $('doorLabel'), doors: $('doors'), lives: $('lives'),
    question: $('question'), options: $('options'), feedback: $('feedback'),
    next: $('nextBtn'), restart: $('restartBtn'),
    endEmoji: $('endEmoji'), endTitle: $('endTitle'), endText: $('endText'),
    music: $('musicBtn'), audio: $('bgMusic'), panda: document.querySelector('.panda')
  };

  // ---------- vidas ----------
  const state = { index: 0, lives: MAX_LIVES, mistakes: 0, answered: false };

  // ---------- Utilidades ----------
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  let audioCtx;
  const beep = (freq, duration = 0.15, delay = 0) => {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const t = audioCtx.currentTime + delay;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + duration);
    } catch {}
  };
  const sounds = {
    correct: () => { beep(523); beep(784, 0.2, 0.12); },
    wrong: () => beep(180, 0.3),
    win: () => [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.2, i * 0.13))
  };

  const launchConfetti = () => {
    const colors = ['#d1352b', '#e7b43c', '#2e9e5b', '#3f8f5f', '#fff'];
    for (let i = 0; i < 60; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti';
      piece.style.setProperty('--x', `${Math.random() * 100}vw`);
      piece.style.setProperty('--c', colors[i % colors.length]);
      piece.style.setProperty('--t', `${2 + Math.random() * 2}s`);
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 4200);
    }
  };

  // ---------- vidas ----------
  const renderLives = (popLast = false) => {
    el.lives.setAttribute('aria-label', `Vidas: ${state.lives} de ${MAX_LIVES}`);
    el.lives.innerHTML = Array.from({ length: MAX_LIVES }, (_, i) => {
      const lost = i >= state.lives;
      const pop = popLast && i === state.lives ? ' pop' : '';
      return `<span class="${lost ? 'lost' : ''}${pop}">❤️</span>`;
    }).join('');
  };

  const renderDoors = () => {
    el.doors.innerHTML = QUESTIONS.map((_, i) => {
      const cls = i < state.index ? 'open' : i === state.index ? 'current' : '';
      return `<li class="${cls}"></li>`;
    }).join('');
  };

  const showScreen = (name) => {
    el.play.hidden = name !== 'play';
    el.end.hidden = name !== 'end';
  };

  const loadQuestion = () => {
    const q = QUESTIONS[state.index];
    state.answered = false;

    el.doorLabel.textContent = `Puerta ${state.index + 1} de ${QUESTIONS.length}`;
    el.question.textContent = q.question;
    el.feedback.textContent = '';
    el.feedback.className = 'feedback';
    el.next.hidden = true;
    el.options.innerHTML = '';

    const options = shuffle(q.options.map((text, i) => ({ text, correct: i === q.answer })));
    options.forEach(({ text, correct }) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option';
      btn.textContent = text;
      btn.dataset.correct = correct;
      btn.addEventListener('click', () => selectAnswer(btn, correct));
      el.options.appendChild(btn);
    });

    renderDoors();
    renderLives();
  };

  // ---------- pasos del juego ----------
  const selectAnswer = (btn, correct) => {
    if (state.answered) return;

    if (correct) {
      state.answered = true;
      btn.classList.add('correct');
      el.options.querySelectorAll('.option').forEach((b) => (b.disabled = true));
      el.feedback.textContent = `✅ ¡Correcto! ${QUESTIONS[state.index].tip}`;
      el.feedback.className = 'feedback ok';
      el.next.textContent = state.index === QUESTIONS.length - 1 ? 'Terminar el festival' : 'Abrir siguiente puerta';
      el.next.hidden = false;
      el.next.focus();
      sounds.correct();
      return;
    }

    state.lives--;
    state.mistakes++;
    btn.classList.add('wrong');
    btn.disabled = true;
    renderLives(true);
    sounds.wrong();
    el.game.classList.remove('shake');
    void el.game.offsetWidth; // reinicia la animación
    el.game.classList.add('shake');

    if (state.lives <= 0) {
      state.answered = true;
      setTimeout(() => showEnd(false), 700);
    } else {
      el.feedback.textContent = '❌ Esa puerta no se abre. ¡Prueba con otra opción!';
      el.feedback.className = 'feedback bad';
    }
  };

  const nextQuestion = () => {
    state.index++;
    if (state.index < QUESTIONS.length) {
      loadQuestion();
    } else {
      showEnd(true);
    }
  };

  const showEnd = (won) => {
    showScreen('end');
    if (won) {
      el.endEmoji.textContent = '🎉';
      el.endTitle.textContent = '¡Felicidades, Maestro Pandadecisión!';
      el.endText.textContent = state.mistakes === 0
        ? 'Salvaste el festival sin cometer ni un solo error. ¡Liderazgo perfecto!'
        : `Salvaste el festival con ${state.mistakes} ${state.mistakes === 1 ? 'error' : 'errores'}. ¡Buen trabajo!`;
      sounds.win();
      launchConfetti();
    } else {
      el.endEmoji.textContent = '😵';
      el.endTitle.textContent = 'Te quedaste sin vidas';
      el.endText.textContent = `Llegaste hasta la puerta ${state.index + 1}. Repasa las pistas e inténtalo de nuevo.`;
    }
    el.restart.focus();
  };

  const resetGame = () => {
    Object.assign(state, { index: 0, lives: MAX_LIVES, mistakes: 0, answered: false });
    showScreen('play');
    loadQuestion();
  };

  // ---------- Música ----------
  const toggleMusic = () => {
    const turnOn = el.audio.paused;
    if (turnOn) {
      el.audio.volume = 0.4;
      el.audio.play().catch(() => {});
    } else {
      el.audio.pause();
    }
    el.music.textContent = turnOn ? '🔊' : '🔇';
    el.music.setAttribute('aria-pressed', String(turnOn));
    el.music.setAttribute('aria-label', turnOn ? 'Silenciar música' : 'Activar música');
  };

  // ---------- sonidos ----------
  el.next.addEventListener('click', nextQuestion);
  el.restart.addEventListener('click', resetGame);
  el.music.addEventListener('click', toggleMusic);
  el.panda.addEventListener('error', () => {
    const fallback = document.createElement('span');
    fallback.className = 'panda-fallback';
    fallback.textContent = '🐼';
    el.panda.replaceWith(fallback);
  });

  resetGame();
})();