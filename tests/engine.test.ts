// DOCCT Engine Tests — vitest
// ---------------------------------------------------------------------------
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createEngine } from '../src/lib/engine';
import type { GameSettings } from '../src/lib/engine';

// ── Mock localStorage ──────────────────────────────────────────────────────

const store: Record<string, string> = {};

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ── Helpers ────────────────────────────────────────────────────────────────

function makeSettings(overrides?: Partial<GameSettings>): GameSettings {
  return {
    timer: 600,
    useVoice: true,
    useKeypad: true,
    voicePack: 'rose',
    beepOnIncorrect: false,
    startingInterval: 3000,
    minimumInterval: 500,
    onboardingCompleted: true,
    taskMode: '1-back',
    ...overrides,
  };
}

/**
 * Advance fake timers by exactly one digit interval.
 * The engine's digit loop generates a new digit after `currentInterval` ms.
 * NOTE: The auto-advance also counts any unanswered previous digit as incorrect.
 */
function tickDigit(engine: ReturnType<typeof createEngine>) {
  vi.advanceTimersByTime(engine.getState().currentInterval);
}

/** Tick countdown by 1 second. */
function tickSecond() {
  vi.advanceTimersByTime(1000);
}

// ── Digit generation ───────────────────────────────────────────────────────

describe('Digit generation', () => {
  it('generates a digit 1-9 on start', () => {
    const e = createEngine(makeSettings({ startingInterval: 100 }));
    e.start();
    tickDigit(e); // advance one interval → first digit generated

    const d = e.getState().currentDigit;
    expect(d).not.toBeNull();
    expect(d!).toBeGreaterThanOrEqual(1);
    expect(d!).toBeLessThanOrEqual(9);
    e.dispose();
  });

  it('digit appears in digitHistory', () => {
    const e = createEngine(makeSettings({ startingInterval: 100 }));
    e.start();
    tickDigit(e);

    const s = e.getState();
    expect(s.digitHistory.length).toBeGreaterThanOrEqual(1);
    // The most recent digit should match currentDigit
    expect(s.digitHistory[s.digitHistory.length - 1]).toBe(s.currentDigit);
    e.dispose();
  });

  it('generates multiple digits over time', () => {
    const e = createEngine(makeSettings({ startingInterval: 100 }));
    e.start();

    // Advance enough for multiple digits: each tick generates one more
    for (let i = 0; i < 4; i++) tickDigit(e);

    const s = e.getState();
    expect(s.digitHistory.length).toBeGreaterThanOrEqual(4);
    for (const d of s.digitHistory) {
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(9);
    }
    e.dispose();
  });
});

// ── 1-back answer checking ─────────────────────────────────────────────────

describe('Answer checking — 1-back', () => {
  it('cannot answer until 2 digits exist', () => {
    const e = createEngine(makeSettings({ taskMode: '1-back', startingInterval: 100 }));
    e.start();
    tickDigit(e); // 1st digit

    expect(e.getState().digitHistory.length).toBe(1);
    expect(e.getState().canAnswer).toBe(false);
    e.dispose();
  });

  it('can answer after 2 digits', () => {
    const e = createEngine(makeSettings({ taskMode: '1-back', startingInterval: 100 }));
    e.start();
    tickDigit(e); // 1st
    tickDigit(e); // 2nd

    expect(e.getState().canAnswer).toBe(true);
    expect(e.getState().digitHistory.length).toBeGreaterThanOrEqual(2);
    e.dispose();
  });

  it('correct answer accepted (digit[n-2] + digit[n-1])', () => {
    const e = createEngine(makeSettings({ taskMode: '1-back', startingInterval: 100 }));
    e.start();
    tickDigit(e); // 1st
    tickDigit(e); // 2nd

    const h = e.getState().digitHistory;
    const expected = h[h.length - 2] + h[h.length - 1];
    e.submitAnswer(expected);

    expect(e.getState().lastAnswerCorrect).toBe(true);
    e.dispose();
  });

  it('wrong answer rejected', () => {
    const e = createEngine(makeSettings({ taskMode: '1-back', startingInterval: 100 }));
    e.start();
    tickDigit(e);
    tickDigit(e);

    e.submitAnswer(9999);
    expect(e.getState().lastAnswerCorrect).toBe(false);
    e.dispose();
  });

  it('tracks multiple correct answers', () => {
    const e = createEngine(makeSettings({ taskMode: '1-back', startingInterval: 100 }));
    e.start();
    tickDigit(e); // 1st
    tickDigit(e); // 2nd → can answer

    let h = e.getState().digitHistory;
    e.submitAnswer(h[h.length - 2] + h[h.length - 1]); // correct

    tickDigit(e); // 3rd
    h = e.getState().digitHistory;
    e.submitAnswer(h[h.length - 2] + h[h.length - 1]); // correct

    expect(e.getState().totalCorrect).toBe(2);
    e.dispose();
  });
});

// ── 2-back answer checking ─────────────────────────────────────────────────

describe('Answer checking — 2-back', () => {
  it('cannot answer until 3 digits', () => {
    const e = createEngine(makeSettings({ taskMode: '2-back', startingInterval: 100 }));
    e.start();
    tickDigit(e); // 1
    tickDigit(e); // 2

    expect(e.getState().canAnswer).toBe(false);
    e.dispose();
  });

  it('can answer after 3 digits', () => {
    const e = createEngine(makeSettings({ taskMode: '2-back', startingInterval: 100 }));
    e.start();
    tickDigit(e);
    tickDigit(e);
    tickDigit(e);

    expect(e.getState().canAnswer).toBe(true);
    expect(e.getState().digitHistory.length).toBeGreaterThanOrEqual(3);
    e.dispose();
  });

  it('correct answer: currentDigit + digit 2 steps ago', () => {
    const e = createEngine(makeSettings({ taskMode: '2-back', startingInterval: 100 }));
    e.start();
    tickDigit(e);
    tickDigit(e);
    tickDigit(e);

    const h = e.getState().digitHistory;
    // 2-back: expected = digit[length-3] + digit[length-1]
    const expected = h[h.length - 3] + h[h.length - 1];
    e.submitAnswer(expected);

    expect(e.getState().lastAnswerCorrect).toBe(true);
    e.dispose();
  });

  it('wrong answer rejected in 2-back', () => {
    const e = createEngine(makeSettings({ taskMode: '2-back', startingInterval: 100 }));
    e.start();
    tickDigit(e);
    tickDigit(e);
    tickDigit(e);

    e.submitAnswer(9999);
    expect(e.getState().lastAnswerCorrect).toBe(false);
    e.dispose();
  });
});

// ── Variable mode ──────────────────────────────────────────────────────────

describe('Answer checking — variable mode', () => {
  it('produces both nBack values (1 and 2)', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 100; i++) {
      const e = createEngine(makeSettings({ taskMode: 'variable', startingInterval: 100 }));
      e.start();
      tickDigit(e);
      seen.add(e.getState().nBack);
      e.dispose();
    }
    expect(seen.has(1)).toBe(true);
    expect(seen.has(2)).toBe(true);
  });
});

// ── Interval adaptation ────────────────────────────────────────────────────

describe('Interval adaptation', () => {
  it('decreases after 3 correct answers (threshold=3)', () => {
    const e = createEngine(makeSettings({ taskMode: '1-back', startingInterval: 3000, minimumInterval: 500 }));
    e.start();
    tickDigit(e); // 1st digit (start)

    // 2nd digit → can answer
    tickDigit(e);
    let h = e.getState().digitHistory;
    e.submitAnswer(h[h.length - 2] + h[h.length - 1]); // correct #1 → streak=1

    // 3rd digit
    tickDigit(e);
    h = e.getState().digitHistory;
    e.submitAnswer(h[h.length - 2] + h[h.length - 1]); // correct #2 → streak=2

    // 4th digit
    tickDigit(e);
    h = e.getState().digitHistory;
    e.submitAnswer(h[h.length - 2] + h[h.length - 1]); // correct #3 → threshold met!

    const s = e.getState();
    expect(s.correctStreak).toBe(0); // reset after threshold
    expect(s.currentInterval).toBe(2800); // 3000 - 200
    e.dispose();
  });

  it('interval increase on wrong answer (when decreased)', () => {
    const e = createEngine(makeSettings({ taskMode: '1-back', startingInterval: 3000, minimumInterval: 500 }));
    e.start();

    // First, decrease interval by getting 3 correct
    tickDigit(e);
    for (let i = 0; i < 3; i++) {
      tickDigit(e);
      const h = e.getState().digitHistory;
      e.submitAnswer(h[h.length - 2] + h[h.length - 1]);
    }
    expect(e.getState().currentInterval).toBe(2800);

    // Now submit a wrong answer
    tickDigit(e);
    e.submitAnswer(9999);

    const s = e.getState();
    // 2800 + 500 = 3300, capped at startingInterval = 3000
    expect(s.currentInterval).toBe(3000);
    expect(s.wrongStreak).toBe(1);
    expect(s.correctStreak).toBe(0);
    e.dispose();
  });

  it('capped at startingInterval on wrong answer at starting level', () => {
    const e = createEngine(makeSettings({ taskMode: '1-back', startingInterval: 3000, minimumInterval: 500 }));
    e.start();
    tickDigit(e);
    tickDigit(e);

    // Submit wrong — interval can't go above startingInterval
    e.submitAnswer(9999);
    expect(e.getState().currentInterval).toBe(3000);
    e.dispose();
  });

  it('cannot go below minimumInterval', () => {
    const e = createEngine(makeSettings({ taskMode: '1-back', startingInterval: 700, minimumInterval: 500 }));
    e.start();
    tickDigit(e); // 1st

    // 3 correct → 700 - 200 = 500 = minimumInterval
    for (let i = 0; i < 3; i++) {
      tickDigit(e);
      const h = e.getState().digitHistory;
      e.submitAnswer(h[h.length - 2] + h[h.length - 1]);
    }
    expect(e.getState().currentInterval).toBe(500);
    e.dispose();
  });

  it('correct answer resets wrongStreak', () => {
    const e = createEngine(makeSettings({ taskMode: '1-back', startingInterval: 3000, minimumInterval: 500 }));
    e.start();
    tickDigit(e);
    tickDigit(e);

    // Submit wrong
    e.submitAnswer(9999);
    expect(e.getState().wrongStreak).toBe(1);

    // Submit correct next
    tickDigit(e);
    const h = e.getState().digitHistory;
    e.submitAnswer(h[h.length - 2] + h[h.length - 1]);
    expect(e.getState().wrongStreak).toBe(0);
    e.dispose();
  });
});

// ── Timer countdown ────────────────────────────────────────────────────────

describe('Timer countdown', () => {
  it('counts down each second', () => {
    const e = createEngine(makeSettings({ timer: 600, startingInterval: 100 }));
    e.start();

    expect(e.getState().timeLeft).toBe(600);
    tickSecond();
    expect(e.getState().timeLeft).toBe(599);
    tickSecond();
    expect(e.getState().timeLeft).toBe(598);
    e.dispose();
  });

  it('completes when timer reaches 0', () => {
    const e = createEngine(makeSettings({ timer: 3, startingInterval: 100 }));
    e.start();

    for (let i = 0; i < 3; i++) tickSecond();

    const s = e.getState();
    expect(s.phase).toBe('complete');
    expect(s.timeLeft).toBe(0);
    expect(s.sessionResults).not.toBeNull();
    e.dispose();
  });
});

// ── State machine transitions ──────────────────────────────────────────────

describe('State machine transitions', () => {
  it('starts in setup if onboarding completed', () => {
    const e = createEngine(makeSettings({ onboardingCompleted: true }));
    expect(e.getState().phase).toBe('setup');
    e.dispose();
  });

  it('starts in onboarding if not completed', () => {
    const e = createEngine(makeSettings({ onboardingCompleted: false }));
    expect(e.getState().phase).toBe('onboarding');
    e.dispose();
  });

  it('onboarding → setup via completeOnboarding()', () => {
    const e = createEngine(makeSettings({ onboardingCompleted: false }));
    expect(e.getState().phase).toBe('onboarding');
    e.completeOnboarding();
    expect(e.getState().phase).toBe('setup');
    expect(e.getState().settings.onboardingCompleted).toBe(true);
    e.dispose();
  });

  it('setup → active via start()', () => {
    const e = createEngine(makeSettings({ onboardingCompleted: true }));
    e.start();
    expect(e.getState().phase).toBe('active');
    e.dispose();
  });

  it('active → paused via pause()', () => {
    const e = createEngine(makeSettings({ onboardingCompleted: true }));
    e.start();
    e.pause();
    expect(e.getState().phase).toBe('paused');
    e.dispose();
  });

  it('paused → active via resume()', () => {
    const e = createEngine(makeSettings({ onboardingCompleted: true }));
    e.start();
    e.pause();
    e.resume();
    expect(e.getState().phase).toBe('active');
    e.dispose();
  });

  it('active → complete via stop()', () => {
    const e = createEngine(makeSettings({ onboardingCompleted: true }));
    e.start();
    e.stop();
    expect(e.getState().phase).toBe('complete');
    expect(e.getState().sessionResults).not.toBeNull();
    e.dispose();
  });

  it('pause() is no-op when not active', () => {
    const e = createEngine(makeSettings({ onboardingCompleted: true }));
    e.pause();
    expect(e.getState().phase).toBe('setup');
    e.dispose();
  });

  it('resume() is no-op when not paused', () => {
    const e = createEngine(makeSettings({ onboardingCompleted: true }));
    e.resume();
    expect(e.getState().phase).toBe('setup');
    e.dispose();
  });
});

// ── Settings persistence ───────────────────────────────────────────────────

describe('Settings persistence', () => {
  it('saves to localStorage on completeOnboarding', () => {
    const e = createEngine(makeSettings({ onboardingCompleted: false }));
    e.completeOnboarding();
    const raw = JSON.parse(localStorage.getItem('settings')!);
    expect(raw.onboardingCompleted).toBe(true);
    e.dispose();
  });

  it('loads from localStorage on creation', () => {
    localStorage.setItem('settings', JSON.stringify({
      timer: 300, taskMode: '2-back', voicePack: 'jenny',
      startingInterval: 5000, minimumInterval: 300, onboardingCompleted: true,
    }));
    const e = createEngine();
    const s = e.getState().settings;
    expect(s.timer).toBe(300);
    expect(s.taskMode).toBe('2-back');
    expect(s.voicePack).toBe('jenny');
    expect(s.startingInterval).toBe(5000);
    expect(s.minimumInterval).toBe(300);
    expect(s.onboardingCompleted).toBe(true);
    e.dispose();
  });

  it('updateSettings persists', () => {
    const e = createEngine(makeSettings({ onboardingCompleted: true }));
    e.updateSettings({ timer: 900, taskMode: 'variable' });
    const raw = JSON.parse(localStorage.getItem('settings')!);
    expect(raw.timer).toBe(900);
    expect(raw.taskMode).toBe('variable');
    e.dispose();
  });

  it('overrides take priority over localStorage', () => {
    localStorage.setItem('settings', JSON.stringify({ timer: 100, onboardingCompleted: true }));
    const e = createEngine({ timer: 999 });
    expect(e.getState().settings.timer).toBe(999);
    e.dispose();
  });
});

// ── Score calculation ──────────────────────────────────────────────────────

describe('Score calculation', () => {
  it('accuracy = totalCorrect / totalAnswers', () => {
    const e = createEngine(makeSettings({ taskMode: '1-back', startingInterval: 100 }));
    e.start();
    tickDigit(e); // 1st
    tickDigit(e); // 2nd → can answer

    // Submit correct
    let h = e.getState().digitHistory;
    e.submitAnswer(h[h.length - 2] + h[h.length - 1]);

    // Submit wrong
    tickDigit(e);
    e.submitAnswer(9999);

    const s = e.getState();
    expect(s.accuracy).toBe(s.totalCorrect / s.totalAnswers);
    e.dispose();
  });

  it('fastestInterval tracks minimum', () => {
    const e = createEngine(makeSettings({ taskMode: '1-back', startingInterval: 3000, minimumInterval: 500 }));
    e.start();
    expect(e.getState().fastestInterval).toBe(3000);
    e.dispose();
  });

  it('session results saved on completion', () => {
    const e = createEngine(makeSettings({ onboardingCompleted: true, timer: 2, startingInterval: 100 }));
    e.start();

    // Generate some digits
    tickDigit(e);
    tickDigit(e);
    tickDigit(e);

    // Complete
    tickSecond();
    tickSecond();

    const s = e.getState();
    expect(s.phase).toBe('complete');
    expect(s.sessionResults).not.toBeNull();
    expect(s.sessionResults!.mode).toBe('1-back');
    expect(s.sessionResults!.completedAt).toBeTruthy();

    const history = e.loadHistory();
    expect(history.length).toBeGreaterThanOrEqual(1);
    e.dispose();
  });
});

// ── Audio URLs ─────────────────────────────────────────────────────────────

describe('Audio URLs', () => {
  it('returns correct voice pack path', () => {
    const e = createEngine(makeSettings({ voicePack: 'rose' }));
    expect(e.getDigitAudioUrl(3)).toBe('/rose/3.wav');
    expect(e.getDigitAudioUrl(1)).toBe('/rose/1.wav');
    expect(e.getDigitAudioUrl(9)).toBe('/rose/9.wav');
    e.dispose();
  });

  it('reflects updated voice pack', () => {
    const e = createEngine(makeSettings({ voicePack: 'jenny' }));
    expect(e.getDigitAudioUrl(5)).toBe('/jenny/5.wav');
    e.dispose();
  });

  it('beep URL is /beep.wav', () => {
    const e = createEngine();
    expect(e.getBeepAudioUrl()).toBe('/beep.wav');
    e.dispose();
  });
});

// ── Subscribe pattern ──────────────────────────────────────────────────────

describe('Subscribe pattern', () => {
  it('notifies on state change', () => {
    const e = createEngine(makeSettings({ onboardingCompleted: true }));
    const states: any[] = [];
    const unsub = e.subscribe((s) => states.push(s));

    // subscribe immediately called once
    expect(states.length).toBe(1);

    e.start();
    expect(states.length).toBeGreaterThanOrEqual(2);
    unsub();
    e.dispose();
  });

  it('unsubscribe stops notifications', () => {
    const e = createEngine(makeSettings({ onboardingCompleted: true }));
    let count = 0;
    const unsub = e.subscribe(() => count++);
    const before = count;
    unsub();
    e.start();
    expect(count).toBe(before);
    e.dispose();
  });
});

// ── Edge cases ─────────────────────────────────────────────────────────────

describe('Edge cases', () => {
  it('cannot submit answer when not active', () => {
    const e = createEngine(makeSettings({ onboardingCompleted: true }));
    e.submitAnswer(10);
    expect(e.getState().lastAnswerCorrect).toBeNull();
    expect(e.getState().totalAnswers).toBe(0);
    e.dispose();
  });

  it('cannot submit answer before enough history', () => {
    const e = createEngine(makeSettings({ taskMode: '1-back', startingInterval: 100 }));
    e.start();
    tickDigit(e); // 1 digit, can't answer

    e.submitAnswer(10);
    // lastAnswerCorrect remains null because submitAnswer is a no-op
    expect(e.getState().totalAnswers).toBe(0);
    e.dispose();
  });

  it('dispose cleans up timers', () => {
    const e = createEngine(makeSettings({ onboardingCompleted: true }));
    e.start();
    e.dispose();
    // No errors or leaks
  });

  it('isPlayingAudio toggles on/off around digit generation', () => {
    // Use interval > 500ms so audio clears before next digit fires
    const e = createEngine(makeSettings({ startingInterval: 1000, minimumInterval: 500 }));
    e.start();
    expect(e.getState().isPlayingAudio).toBe(false);

    tickDigit(e); // advance 1000ms → digit generated, isPlayingAudio = true
    expect(e.getState().isPlayingAudio).toBe(true);

    // After 500ms audio clears (next digit won't fire until 1000ms from now)
    vi.advanceTimersByTime(600);
    expect(e.getState().isPlayingAudio).toBe(false);
    e.dispose();
  });

  it('nBack reported in state for variable mode', () => {
    const e = createEngine(makeSettings({ taskMode: 'variable', startingInterval: 100 }));
    e.start();
    tickDigit(e);
    const n = e.getState().nBack;
    expect(n === 1 || n === 2).toBe(true);
    e.dispose();
  });
});
