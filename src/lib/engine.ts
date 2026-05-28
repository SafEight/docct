// DOCCT Game Engine — Pure logic with Web Audio API
// Forensically matched to the original at docct.pages.dev

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
  averageResponseTimeMs: number;
  correctCount: number;
  totalAnswers: number;
  streaks: number;
  useVoice: boolean;
  useKeypad: boolean;
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
  restart(): void;
  submitAnswer(answer: number): void;
  completeOnboarding(): void;
  showOnboarding(): void;
  updateSettings(s: Partial<GameSettings>): void;
  loadHistory(): SessionResult[];
  dispose(): void;
}

// ── Constants ──────────────────────────────────────────────────────────────

const SETTINGS_KEY = 'settings';
const HISTORY_KEY = 'sessionHistory';
const HIGH_SCORES_KEY = 'highScores';
const STREAK_THRESHOLD = 4; // correct/wrong streak needed to change interval

/**
 * Proportional adaptation: at lower intervals the same absolute change
 * is relatively bigger, so we scale steps with the current interval.
 * Formula: step = max(10, round(current / 100))   [in ms]
 *   3.0s → 30ms per step (10 steps ≈ 0.3s)
 *   1.5s → 15ms per step
 *   1.0s → 10ms per step (10 steps = 0.1s, same as original granularity)
 *   0.5s → 10ms per step (minimum)
 * Result: takes roughly the same NUMBER of streaks to adapt at every
 * interval level, matching the original's "feel" while keeping 0.01s grid.
 */
function adaptationStep(currentInterval: number): number {
  return Math.max(10, Math.round(currentInterval / 100));
}
const INITIAL_DELAY = 500; // ms before first digit (matches original)

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
    if (raw) {
      const parsed = JSON.parse(raw);
      // Type coercion matching original
      return {
        timer: Number(parsed.timer) || DEFAULT_SETTINGS.timer,
        useVoice: !!parsed.useVoice,
        useKeypad: !!parsed.useKeypad,
        voicePack: ['rose', 'rose_fast', 'jenny'].includes(parsed.voicePack) ? String(parsed.voicePack) : DEFAULT_SETTINGS.voicePack,
        beepOnIncorrect: !!parsed.beepOnIncorrect,
        startingInterval: Number(parsed.startingInterval) || DEFAULT_SETTINGS.startingInterval,
        minimumInterval: Number(parsed.minimumInterval) || DEFAULT_SETTINGS.minimumInterval,
        onboardingCompleted: !!parsed.onboardingCompleted,
        taskMode: ['1-back', '2-back', 'variable'].includes(parsed.taskMode) ? parsed.taskMode : DEFAULT_SETTINGS.taskMode,
      };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

function saveSettingsToStorage(settings: GameSettings): void {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}

function validateSessionResult(entry: any): SessionResult | null {
  if (!entry || typeof entry !== 'object') return null;
  const mode = entry.mode === '2-back' || entry.mode === 'variable' ? entry.mode : '1-back';
  const completedAt = String(entry.completedAt || '');
  const durationSec = Number(entry.durationSec);
  const accuracy = Number(entry.accuracy);
  const fastestIntervalMs = Number(entry.fastestIntervalMs);
  const endingIntervalMs = Number(entry.endingIntervalMs);
  const streaks = Number(entry.streaks);
  if (!completedAt || !Number.isFinite(durationSec) || !Number.isFinite(accuracy) ||
      !Number.isFinite(fastestIntervalMs) || !Number.isFinite(endingIntervalMs) || !Number.isFinite(streaks)) {
    return null;
  }
  return {
    completedAt, mode, durationSec, accuracy, fastestIntervalMs, endingIntervalMs, streaks,
    useVoice: !!entry.useVoice, useKeypad: !!entry.useKeypad,
    averageResponseTimeMs: Number(entry.averageResponseTimeMs) || 0,
    correctCount: Number(entry.correctCount) || 0,
    totalAnswers: Number(entry.totalAnswers) || 0,
  };
}

function loadHistoryFromStorage(): SessionResult[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(validateSessionResult).filter(Boolean) as SessionResult[];
    }
  } catch { /* ignore */ }
  return [];
}

function saveHistoryToStorage(history: SessionResult[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e: any) {
    // QuotaExceeded handling: drop oldest entries until write succeeds
    if (e?.name === 'QuotaExceededError') {
      const remaining = [...history];
      while (remaining.length > 0) {
        remaining.shift();
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(remaining));
          return;
        } catch { /* keep trying */ }
      }
    }
  }
}

interface HighScores {
  fastest: number;
  mostStreaks: number;
  mostCorrect: number;
}

function loadHighScores(): Record<string, HighScores> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(HIGH_SCORES_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveHighScores(scores: Record<string, HighScores>): void {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores)); } catch { /* ignore */ }
}

function getBestForMode(mode: string): HighScores {
  const all = loadHighScores();
  return all[mode] || { fastest: 0, mostStreaks: 0, mostCorrect: 0 };
}

function updateBestScores(mode: string, session: { fastest: number; streaks: number; correctRatio: number }): HighScores {
  const best = getBestForMode(mode);
  const updated: HighScores = {
    fastest: best.fastest > 0 ? Math.min(session.fastest, best.fastest) : session.fastest,
    mostStreaks: Math.max(session.streaks, best.mostStreaks),
    mostCorrect: Math.max(session.correctRatio, best.mostCorrect),
  };
  const all = loadHighScores();
  all[mode] = updated;
  saveHighScores(all);
  return updated;
}

// ── Voice pack path map ───────────────────────────────────────────────────

const VOICE_PACK_PATHS: Record<string, string> = {
  rose: '/rose',
  rose_fast: '/rose_fast',
  jenny: '/jenny',
};

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
  let correctStreak = 0;      // display streak (capped at threshold)
  let wrongStreak = 0;        // display wrong streak (capped at threshold)
  let longestStreakCount = 0;
  let totalCorrect = 0;
  let totalWrong = 0;         // counts WRONG answers only (like original)
  let digitHistory: number[] = [];
  let currentNBack = 1;
  let lastAnswerCorrect: boolean | null = null;
  let sessionResults: SessionResult | null = null;

  // Internal streak counters (toward threshold)
  let correctStreakCounter = 0;
  let wrongStreakCounter = 0;

  // Response time tracking
  let digitShownAt = 0;
  let totalResponseMs = 0;
  let responseCount = 0;
  let lastResponseTime = 0;

  // Pending answer (deferred checking)
  let pendingAnswer: number | undefined = undefined;
  let expectedAnswer: number | undefined = undefined;

  // Timers
  let countdownTimer: ReturnType<typeof setInterval> | null = null;
  let digitTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Web Audio API ──────────────────────────────────────────────────────
  let audioContext: AudioContext | null = null;
  let voiceBuffers: (AudioBuffer | null)[] = new Array(9).fill(null);
  let beepBuffer: AudioBuffer | null = null;
  let loadedVoicePack: string = '';
  let audioPlayingId = 0;     // monotonic ID to track which audio is current
  let preloadVersion = 0;     // monotonic ID for voice pack preload race condition

  function getAudioContext(): AudioContext {
    if (!audioContext) {
      audioContext = new AudioContext();
      // iOS keepalive: GainNode + ConstantSource prevents AudioContext suspension
      try {
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0;
        const constantSource = audioContext.createConstantSource();
        constantSource.connect(gainNode);
        gainNode.connect(audioContext.destination);
        constantSource.start();
      } catch { /* ignore */ }
    }
    // Resume if suspended (autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    return audioContext;
  }

  async function preloadVoicePack(packName: string): Promise<void> {
    const ctx = getAudioContext();
    const basePath = VOICE_PACK_PATHS[packName] || VOICE_PACK_PATHS.rose;
    
    if (loadedVoicePack === packName && voiceBuffers.every(b => b !== null)) return;
    
    // Race condition guard: increment version, only apply if still current
    const myVersion = ++preloadVersion;
    
    const buffers: (AudioBuffer | null)[] = [];
    for (let i = 1; i <= 9; i++) {
      if (preloadVersion !== myVersion) return; // newer preload started, abort
      try {
        const response = await fetch(`${basePath}/${i}.wav`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        buffers.push(audioBuffer);
      } catch {
        buffers.push(null);
      }
    }
    // Only apply if no newer preload started
    if (preloadVersion === myVersion) {
      voiceBuffers = buffers;
      loadedVoicePack = packName;
    }
  }

  async function preloadBeep(): Promise<void> {
    if (beepBuffer) return;
    try {
      const ctx = getAudioContext();
      const response = await fetch('/beep.wav');
      const arrayBuffer = await response.arrayBuffer();
      beepBuffer = await ctx.decodeAudioData(arrayBuffer);
    } catch { /* ignore */ }
  }

  function playDigitSound(digit: number): number {
    const ctx = getAudioContext();
    const buffer = voiceBuffers[digit - 1];
    if (!buffer) return 0;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    return buffer.duration * 1000; // return duration in ms
  }

  function playBeepSound(): void {
    const ctx = getAudioContext();
    if (!beepBuffer) return;

    const source = ctx.createBufferSource();
    source.buffer = beepBuffer;
    source.connect(ctx.destination);
    source.start(0);
  }

  // ── State builder ──────────────────────────────────────────────────────

  function buildState(): GameState {
    // Live accuracy: totalCorrect / (totalCorrect + totalWrong)
    // This matches the original: me() increments totalCorrect only, Ot() increments totalWrong only
    const totalTrials = totalCorrect + totalWrong;
    const liveAccuracy = totalTrials > 0 ? totalCorrect / totalTrials : 1;

    return {
      phase,
      currentDigit,
      canAnswer,
      isPlayingAudio,
      timeLeft,
      totalTime,
      accuracy: liveAccuracy,
      fastestInterval,
      currentInterval,
      correctStreak,
      wrongStreak,
      totalCorrect,
      totalAnswers: totalCorrect + totalWrong, // total trials (for display)
      digitHistory: [...digitHistory],
      nBack: currentNBack,
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

  // ── Streak reset check ─────────────────────────────────────────────────

  function checkStreakReset(): void {
    if (correctStreak === STREAK_THRESHOLD) correctStreak = 0;
    if (wrongStreak === STREAK_THRESHOLD) wrongStreak = 0;
  }

  // ── Answer checking (deferred to next digit) ───────────────────────────

  function checkPendingAnswer(): void {
    if (expectedAnswer === undefined) return;

    // Record response time if answer was submitted
    if (pendingAnswer !== undefined && lastResponseTime > 0) {
      totalResponseMs += lastResponseTime;
      responseCount++;
    }

    // If no answer submitted, it's wrong
    if (pendingAnswer === undefined) {
      lastAnswerCorrect = false;
      recordIncorrect();
      if (settings.beepOnIncorrect) playBeepSound();
      return;
    }

    // Check if answer matches expected
    if (Number(pendingAnswer) === expectedAnswer) {
      lastAnswerCorrect = true;
      recordCorrect();
      return;
    }

    // Wrong answer
    lastAnswerCorrect = false;
    recordIncorrect();
    if (settings.beepOnIncorrect) playBeepSound();
  }

  // ── Score recording ────────────────────────────────────────────────────

  function recordCorrect(): void {
    totalCorrect++;
    correctStreakCounter++;
    wrongStreakCounter = 0;
    wrongStreak = 0;
    correctStreak = Math.min(correctStreakCounter, STREAK_THRESHOLD);

    if (correctStreakCounter === STREAK_THRESHOLD) {
      longestStreakCount++;
      const step = adaptationStep(currentInterval);
      currentInterval = Math.max(settings.minimumInterval, currentInterval - step);
      fastestInterval = Math.min(fastestInterval, currentInterval);
      correctStreakCounter = 0;
    }
  }

  function recordIncorrect(): void {
    totalWrong++;
    wrongStreakCounter++;
    correctStreakCounter = 0;
    correctStreak = 0;
    wrongStreak = Math.min(wrongStreakCounter, STREAK_THRESHOLD);

    if (wrongStreakCounter === STREAK_THRESHOLD) {
      // Original has NO cap here — interval increases indefinitely
      currentInterval = currentInterval + adaptationStep(currentInterval);
      wrongStreakCounter = 0;
    }
  }

  // ── Timer cleanup ──────────────────────────────────────────────────────

  function stopTimers(): void {
    if (countdownTimer !== null) { clearInterval(countdownTimer); countdownTimer = null; }
    if (digitTimer !== null) { clearTimeout(digitTimer); digitTimer = null; }
  }

  // ── Digit loop ─────────────────────────────────────────────────────────

  function scheduleNextDigit(delayMs?: number): void {
    if (phase !== 'active') return;
    const delay = delayMs !== undefined ? delayMs : currentInterval;
    
    digitTimer = setTimeout(() => {
      if (phase !== 'active') return;

      // Reset streak display if at threshold
      checkStreakReset();

      // Check the previous answer (deferred)
      checkPendingAnswer();

      // Reset pending answer state
      pendingAnswer = undefined;
      lastResponseTime = 0;

      // Generate new digit
      const digit = generateDigit();
      const newHistory = [...digitHistory, digit];
      const nBackValue = determineNBack();

      // Trim history to keep it manageable
      while (newHistory.length > nBackValue + 1) newHistory.shift();

      digitHistory = newHistory;
      currentDigit = digit;
      currentNBack = nBackValue;

      // Calculate expected answer for NEXT time
      expectedAnswer = newHistory.length > nBackValue
        ? digit + newHistory[newHistory.length - 1 - nBackValue]
        : undefined;

      canAnswer = expectedAnswer !== undefined;
      digitShownAt = Date.now();

      // Play digit audio if voice mode
      let audioDurationMs = 0;
      audioPlayingId++;
      if (settings.useVoice) {
        audioDurationMs = playDigitSound(digit);
        isPlayingAudio = true;
        notify();

        // Track when audio actually ends
        const currentId = audioPlayingId;
        const safetyTimeout = setTimeout(() => {
          if (audioPlayingId === currentId && isPlayingAudio) {
            isPlayingAudio = false;
            notify();
          }
        }, audioDurationMs + 200);

        // Also try to detect actual end
        const ctx = getAudioContext();
        // Safety: just use the buffer duration
        clearTimeout(digitTimer as any); // clear any stale
        setTimeout(() => {
          if (audioPlayingId === currentId) {
            isPlayingAudio = false;
            notify();
          }
        }, audioDurationMs + 100);
      } else {
        isPlayingAudio = false;
        notify();
      }

      notify();

      // Schedule next digit: delay = currentInterval + audio duration
      scheduleNextDigit(currentInterval + audioDurationMs);
    }, delay);
  }

  // ── Countdown timer ────────────────────────────────────────────────────

  function startCountdown(): void {
    countdownTimer = setInterval(() => {
      if (phase !== 'active') return;
      // Original checks timeLeft <= 1 BEFORE decrementing
      if (timeLeft <= 1) {
        timeLeft = 0;
        stopSession();
        return;
      }
      timeLeft--;
      notify();
    }, 1000);
  }

  // ── Session completion ─────────────────────────────────────────────────

  function stopSession(): void {
    stopTimers();

    // Check any pending answer before completing
    checkStreakReset();
    checkPendingAnswer();
    pendingAnswer = undefined;

    const durationSec = totalTime - timeLeft;
    const totalTrials = totalCorrect + totalWrong;
    const accuracy = totalTrials > 0 ? totalCorrect / totalTrials : 0;
    const averageResponseMs = responseCount > 0 ? totalResponseMs / responseCount : 0;

    sessionResults = {
      completedAt: new Date().toISOString(),
      mode: settings.taskMode,
      durationSec,
      accuracy,
      fastestIntervalMs: fastestInterval,
      endingIntervalMs: currentInterval,
      averageResponseTimeMs: averageResponseMs,
      correctCount: totalCorrect,
      totalAnswers: totalTrials,
      streaks: longestStreakCount,
      useVoice: settings.useVoice,
      useKeypad: settings.useKeypad,
    };

    // Save to history
    const history = loadHistoryFromStorage();
    history.push(sessionResults);
    saveHistoryToStorage(history);

    // Update best scores
    updateBestScores(settings.taskMode, {
      fastest: fastestInterval,
      streaks: longestStreakCount,
      correctRatio: accuracy,
    });

    phase = 'complete';
    currentDigit = null;
    canAnswer = false;
    isPlayingAudio = false;
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
      correctStreakCounter = 0;
      wrongStreakCounter = 0;
      longestStreakCount = 0;
      totalCorrect = 0;
      totalWrong = 0;
      digitHistory = [];
      currentNBack = 1;
      lastAnswerCorrect = null;
      sessionResults = null;
      currentDigit = null;
      canAnswer = false;
      isPlayingAudio = false;
      totalResponseMs = 0;
      responseCount = 0;
      lastResponseTime = 0;
      pendingAnswer = undefined;
      expectedAnswer = undefined;

      phase = 'active';
      notify();
      startCountdown();

      // Preload voice pack and beep, then start with initial delay
      Promise.all([
        preloadVoicePack(settings.voicePack),
        preloadBeep(),
      ]).then(() => {
        if (phase === 'active') {
          // Set navigator.audioSession for mobile
          if (typeof navigator !== 'undefined' && navigator.audioSession) {
            navigator.audioSession.type = 'playback';
          }
          // Original starts first digit after 500ms (hardcoded initial delay)
          scheduleNextDigit(INITIAL_DELAY);
        }
      });
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
      // Original resumes with immediate next digit (0ms delay)
      scheduleNextDigit(0);
    },

    stop() {
      stopSession();
    },

    restart() {
      if (phase !== 'complete') return;
      phase = 'setup';
      sessionResults = null;
      notify();
    },

    submitAnswer(answer) {
      if (phase !== 'active' || !canAnswer) return;

      // In the original, answer submission just records the answer
      // The actual checking happens when the next digit arrives
      pendingAnswer = answer;

      // Record response time
      if (digitShownAt > 0) {
        lastResponseTime = performance.now() - digitShownAt;
      }

      lastAnswerCorrect = null; // will be determined on next digit
      notify();
    },

    completeOnboarding() {
      settings.onboardingCompleted = true;
      saveSettingsToStorage(settings);
      phase = 'setup';
      notify();
    },
    showOnboarding() {
      phase = 'onboarding';
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

    dispose() {
      stopTimers();
      subscribers.length = 0;
      if (audioContext) {
        audioContext.close();
        audioContext = null;
      }
    },
  };
}
