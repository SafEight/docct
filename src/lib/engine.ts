// DOCCT Game Engine — Pure logic, zero DOM, zero Svelte
// ---------------------------------------------------------------------------

// ── Types ──────────────────────────────────────────────────────────────────

export interface GameSettings {
  timer: number;              // seconds (600 = 10 min)
  useVoice: boolean;
  useKeypad: boolean;
  voicePack: 'rose' | 'rose_fast' | 'jenny';
  beepOnIncorrect: boolean;
  startingInterval: number;   // ms (3000)
  minimumInterval: number;    // ms (500)
  onboardingCompleted: boolean;
  taskMode: '1-back' | '2-back' | 'variable';
}

export interface SessionResult {
  completedAt: string;
  mode: string;
  durationSec: number;
  accuracy: number;           // 0-1
  fastestIntervalMs: number;
  endingIntervalMs: number;
  averageResponseMs: number;
  correctCount: number;
  totalAnswers: number;
  streaks: number;
}

export interface GameState {
  phase: 'onboarding' | 'setup' | 'active' | 'paused' | 'complete';
  currentDigit: number | null;
  canAnswer: boolean;
  isPlayingAudio: boolean;
  timeLeft: number;
  totalTime: number;
  accuracy: number;
  fastestInterval: number;
  currentInterval: number;
  correctStreak: number;
  wrongStreak: number;
  totalCorrect: number;
  totalAnswers: number;
  digitHistory: number[];
  nBack: number;
  lastAnswerCorrect: boolean | null;
  sessionResults: SessionResult | null;
  history: SessionResult[];
  settings: GameSettings;
  voicePackPath: string;
}

export interface Engine {
  getState(): GameState;
  subscribe(fn: (state: GameState) => void): () => void;
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  submitAnswer(answer: number): void;
  completeOnboarding(): void;
  updateSettings(s: Partial<GameSettings>): void;
  loadHistory(): SessionResult[];
  getDigitAudioUrl(digit: number): string;
  getBeepAudioUrl(): string;
  dispose(): void;
}

// ── Constants ──────────────────────────────────────────────────────────────

const SETTINGS_KEY = 'settings';
const HISTORY_KEY = 'docct_history';
const DECREMENT = 200;   // ms interval decrease on streak threshold
const INCREMENT = 500;   // ms interval increase on wrong answer

const DEFAULT_SETTINGS: GameSettings = {
  timer: 600,
  useVoice: true,
  useKeypad: true,
  voicePack: 'rose',
  beepOnIncorrect: false,
  startingInterval: 3000,
  minimumInterval: 500,
  onboardingCompleted: false,
  taskMode: '1-back',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function generateDigit(): number {
  return Math.floor(Math.random() * 9) + 1;
}

function loadSettingsFromStorage(): GameSettings {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

function saveSettingsToStorage(settings: GameSettings): void {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}

function loadHistoryFromStorage(): SessionResult[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveHistoryToStorage(history: SessionResult[]): void {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch { /* ignore */ }
}

// ── Engine Factory ─────────────────────────────────────────────────────────

export function createEngine(overrides?: Partial<GameSettings>): Engine {
  const subscribers: Array<(state: GameState) => void> = [];

  // Merge persisted settings with defaults, then apply any overrides
  const settings: GameSettings = { ...loadSettingsFromStorage(), ...overrides };

  // Internal mutable state
  let phase: GameState['phase'] = settings.onboardingCompleted ? 'setup' : 'onboarding';
  let currentDigit: number | null = null;
  let canAnswer = false;
  let isPlayingAudio = false;
  let timeLeft = settings.timer;
  const totalTime = settings.timer;
  let currentInterval = settings.startingInterval;
  let fastestInterval = settings.startingInterval;
  let correctStreak = 0;
  let wrongStreak = 0;
  let longestStreakCount = 0;
  let totalCorrect = 0;
  let totalAnswers = 0;
  let digitHistory: number[] = [];
  let nBack = 1;
  let lastAnswerCorrect: boolean | null = null;
  let sessionResults: SessionResult | null = null;

  // Threshold tracking: starts at 3, increments by 1 each time it's met
  let streakThreshold = 3;

  // Timers
  let countdownTimer: ReturnType<typeof setInterval> | null = null;
  let digitTimer: ReturnType<typeof setTimeout> | null = null;
  let audioTimer: ReturnType<typeof setTimeout> | null = null;

  // Response time tracking
  let digitShownAt = 0;
  let totalResponseMs = 0;
  let responseCount = 0;

  // ── State builder ──────────────────────────────────────────────────────

  function buildState(): GameState {
    return {
      phase,
      currentDigit,
      canAnswer,
      isPlayingAudio,
      timeLeft,
      totalTime,
      accuracy: totalAnswers > 0 ? totalCorrect / totalAnswers : 1,
      fastestInterval,
      currentInterval,
      correctStreak,
      wrongStreak,
      totalCorrect,
      totalAnswers,
      digitHistory: [...digitHistory],
      nBack,
      lastAnswerCorrect,
      sessionResults,
      history: loadHistoryFromStorage(),
      settings: { ...settings },
      voicePackPath: `/${settings.voicePack}`,
    };
  }

  function notify(): void {
    const state = buildState();
    for (const fn of subscribers) fn(state);
  }

  // ── N-Back determination ───────────────────────────────────────────────

  function determineNBack(): number {
    if (settings.taskMode === 'variable') return Math.random() < 0.5 ? 1 : 2;
    return settings.taskMode === '2-back' ? 2 : 1;
  }

  // ── Answer checking ────────────────────────────────────────────────────

  function checkAnswer(playerAnswer: number): boolean {
    if (digitHistory.length <= nBack) return false;
    const expectedDigit = digitHistory[digitHistory.length - 1 - nBack];
    return playerAnswer === expectedDigit + currentDigit!;
  }

  // ── Score recording ────────────────────────────────────────────────────

  function recordCorrect(): void {
    correctStreak++;
    wrongStreak = 0;
    totalCorrect++;
    totalAnswers++;

    if (correctStreak >= streakThreshold) {
      currentInterval = Math.max(settings.minimumInterval, currentInterval - DECREMENT);
      fastestInterval = Math.min(fastestInterval, currentInterval);
      longestStreakCount++;
      correctStreak = 0;
      streakThreshold++;
    }
  }

  function recordIncorrect(): void {
    wrongStreak++;
    correctStreak = 0;
    totalAnswers++;
    currentInterval = Math.min(settings.startingInterval, currentInterval + INCREMENT);
  }

  // ── Timer cleanup ──────────────────────────────────────────────────────

  function stopTimers(): void {
    if (countdownTimer !== null) { clearInterval(countdownTimer); countdownTimer = null; }
    if (digitTimer !== null) { clearTimeout(digitTimer); digitTimer = null; }
    if (audioTimer !== null) { clearTimeout(audioTimer); audioTimer = null; }
  }

  // ── Digit loop ─────────────────────────────────────────────────────────

  function scheduleNextDigit(): void {
    if (phase !== 'active') return;
    digitTimer = setTimeout(() => {
      if (phase !== 'active') return;

      const digit = generateDigit();
      currentDigit = digit;
      digitHistory.push(digit);
      nBack = determineNBack();
      canAnswer = digitHistory.length > nBack;
      digitShownAt = Date.now();
      isPlayingAudio = true;
      notify();

      // Simulate audio playback completion
      audioTimer = setTimeout(() => {
        isPlayingAudio = false;
        notify();
      }, 500);

      scheduleNextDigit();
    }, currentInterval);
  }

  // ── Countdown timer ────────────────────────────────────────────────────

  function startCountdown(): void {
    countdownTimer = setInterval(() => {
      if (phase !== 'active') return;
      timeLeft--;
      if (timeLeft <= 0) {
        timeLeft = 0;
        stopSession();
      }
      notify();
    }, 1000);
  }

  // ── Session completion ─────────────────────────────────────────────────

  function stopSession(): void {
    stopTimers();
    const durationSec = totalTime - timeLeft;
    const accuracy = totalAnswers > 0 ? totalCorrect / totalAnswers : 0;
    const averageResponseMs = responseCount > 0 ? totalResponseMs / responseCount : 0;

    sessionResults = {
      completedAt: new Date().toISOString(),
      mode: settings.taskMode,
      durationSec,
      accuracy,
      fastestIntervalMs: fastestInterval,
      endingIntervalMs: currentInterval,
      averageResponseMs,
      correctCount: totalCorrect,
      totalAnswers,
      streaks: longestStreakCount,
    };

    const history = loadHistoryFromStorage();
    history.push(sessionResults);
    saveHistoryToStorage(history);

    phase = 'complete';
    currentDigit = null;
    canAnswer = false;
    notify();
  }

  // ── Public API ─────────────────────────────────────────────────────────

  return {
    getState: () => buildState(),

    subscribe(fn) {
      subscribers.push(fn);
      fn(buildState()); // immediate notification
      return () => {
        const idx = subscribers.indexOf(fn);
        if (idx >= 0) subscribers.splice(idx, 1);
      };
    },

    start() {
      // Reset session state
      timeLeft = settings.timer;
      currentInterval = settings.startingInterval;
      fastestInterval = settings.startingInterval;
      correctStreak = 0;
      wrongStreak = 0;
      longestStreakCount = 0;
      streakThreshold = 3;
      totalCorrect = 0;
      totalAnswers = 0;
      digitHistory = [];
      nBack = 1;
      lastAnswerCorrect = null;
      sessionResults = null;
      currentDigit = null;
      canAnswer = false;
      isPlayingAudio = false;
      totalResponseMs = 0;
      responseCount = 0;

      phase = 'active';
      notify();
      startCountdown();
      scheduleNextDigit();
    },

    pause() {
      if (phase !== 'active') return;
      stopTimers();
      phase = 'paused';
      notify();
    },

    resume() {
      if (phase !== 'paused') return;
      phase = 'active';
      notify();
      startCountdown();
      scheduleNextDigit();
    },

    stop() {
      stopSession();
    },

    submitAnswer(answer) {
      if (phase !== 'active' || !canAnswer) return;

      const isCorrect = checkAnswer(answer);

      if (digitShownAt > 0) {
        totalResponseMs += Date.now() - digitShownAt;
        responseCount++;
      }

      if (isCorrect) recordCorrect();
      else recordIncorrect();

      lastAnswerCorrect = isCorrect;
      notify();
    },

    completeOnboarding() {
      settings.onboardingCompleted = true;
      saveSettingsToStorage(settings);
      phase = 'setup';
      notify();
    },

    updateSettings(s) {
      Object.assign(settings, s);
      saveSettingsToStorage(settings);
      notify();
    },

    loadHistory() {
      return loadHistoryFromStorage();
    },

    getDigitAudioUrl(digit: number): string {
      return `/${settings.voicePack}/${digit}.wav`;
    },

    getBeepAudioUrl(): string {
      return '/beep.wav';
    },

    dispose() {
      stopTimers();
      subscribers.length = 0;
    },
  };
}
