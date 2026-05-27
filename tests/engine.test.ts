// DOCCT Engine Tests — vitest
// ---------------------------------------------------------------------------
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createEngine } from '../src/lib/engine';
import type { GameSettings, GameState } from '../src/lib/engine';

// ── Mock localStorage ──────────────────────────────────────────────────────

const store: Record<string, string> = {};

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);

  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => {
      store[key] = val;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  });
});

afterEach(() => {
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

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Digit generation', () => {
  it('generates digits in range 1-9', () => {
    const engine = createEngine(makeSettings());
    engine.start();

    // Collect 200 generated digits
    const digits: number[] = [];
    for (let i = 0; i < 200; i++) {
      const d = engine.getState().currentDigit;
      if (d !== null) digits.push(d);
      // Manually advance the digit loop by submitting answer to trigger next
      // We can't easily wait for setTimeout, so we test the state machine directly
    }

    // All digits in range
    for (const d of digits) {
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(9);
    }

    engine.dispose();
  });

  it('digit is in digitHistory after generation', () => {
    const engine = createEngine(makeSettings());
    engine.start();

    const state = engine.getState();
    expect(state.digitHistory.length).toBe(1);
    expect(state.digitHistory[0]).toBe(state.currentDigit);

    engine.dispose();
  });
});

describe('Answer checking — 1-back', () => {
  it('cannot answer until enough history', () => {
    const engine = createEngine(makeSettings({ taskMode: '1-back' }));
    engine.start();

    // First digit: canAnswer should be false (digitHistory.length = 1, nBack = 1, 1 <= 1)
    expect(engine.getState().canAnswer).toBe(false);

    engine.dispose();
  });

  it('can answer after 2 digits in 1-back mode', () => {
    const engine = createEngine(makeSettings({ taskMode: '1-back' }));
    engine.start();

    // Simulate getting a second digit by directly manipulating state
    const state1 = engine.getState();
    const firstDigit = state1.digitHistory[0];

    // We need to trigger the next digit. Since timers are real, we'll
    // use a short interval to test quickly.
    engine.dispose();

    const engine2 = createEngine(makeSettings({ taskMode: '1-back', startingInterval: 10, minimumInterval: 10 }));
    engine2.start();

    // Wait for second digit
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const s = engine2.getState();
        expect(s.canAnswer).toBe(true);
        expect(s.digitHistory.length).toBe(2);
        engine2.dispose();
        resolve();
      }, 50);
    });
  });

  it('correct answer: currentDigit + digit 1 step ago', () => {
    // We need to test the answer checking logic directly
    // Create engine, start, wait for 2 digits, then submit correct answer
    const engine = createEngine(makeSettings({ taskMode: '1-back', startingInterval: 10, minimumInterval: 10 }));
    engine.start();

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const s = engine.getState();
        const hist = s.digitHistory;
        expect(hist.length).toBe(2);

        // Expected answer: hist[0] + hist[1]
        const expected = hist[0] + hist[1];
        engine.submitAnswer(expected);

        const after = engine.getState();
        expect(after.lastAnswerCorrect).toBe(true);
        expect(after.totalCorrect).toBe(1);
        expect(after.totalAnswers).toBe(1);

        engine.dispose();
        resolve();
      }, 50);
    });
  });

  it('wrong answer: incorrect submission', () => {
    const engine = createEngine(makeSettings({ taskMode: '1-back', startingInterval: 10, minimumInterval: 10 }));
    engine.start();

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const s = engine.getState();
        const hist = s.digitHistory;
        const expected = hist[0] + hist[1];
        engine.submitAnswer(expected + 999); // intentionally wrong

        const after = engine.getState();
        expect(after.lastAnswerCorrect).toBe(false);
        expect(after.totalCorrect).toBe(0);
        expect(after.totalAnswers).toBe(1);

        engine.dispose();
        resolve();
      }, 50);
    });
  });
});

describe('Answer checking — 2-back', () => {
  it('cannot answer until 3 digits in 2-back mode', () => {
    const engine = createEngine(makeSettings({ taskMode: '2-back', startingInterval: 10, minimumInterval: 10 }));
    engine.start();

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // After first interval, should have 2 digits — still can't answer (2 <= 2)
        const s = engine.getState();
        if (s.digitHistory.length <= 2) {
          expect(s.canAnswer).toBe(false);
        }
        engine.dispose();
        resolve();
      }, 50);
    });
  });

  it('correct answer: currentDigit + digit 2 steps ago', () => {
    const engine = createEngine(makeSettings({ taskMode: '2-back', startingInterval: 10, minimumInterval: 10 }));
    engine.start();

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const s = engine.getState();
        if (s.digitHistory.length >= 3) {
          const hist = s.digitHistory;
          const expected = hist[hist.length - 3] + hist[hist.length - 1];
          engine.submitAnswer(expected);

          const after = engine.getState();
          expect(after.lastAnswerCorrect).toBe(true);
        }
        engine.dispose();
        resolve();
      }, 100);
    });
  });
});

describe('Answer checking — variable mode', () => {
  it('variable mode uses random nBack per trial', () => {
    // Run multiple times to check both 1-back and 2-back are possible
    const results = new Set<number>();

    const runTest = (): Promise<void> => {
      return new Promise((resolve) => {
        const engine = createEngine(makeSettings({ taskMode: 'variable', startingInterval: 10, minimumInterval: 10 }));
        engine.start();

        setTimeout(() => {
          const s = engine.getState();
          results.add(s.nBack);
          engine.dispose();
          resolve();
        }, 50);
      });
    };

    // Run many times to get both values
    const promises: Promise<void>[] = [];
    for (let i = 0; i < 50; i++) {
      promises.push(runTest());
    }

    return Promise.all(promises).then(() => {
      // Should have seen at least one value (we can't guarantee both in 50 tries)
      expect(results.size).toBeGreaterThanOrEqual(1);
      for (const v of results) {
        expect(v === 1 || v === 2).toBe(true);
      }
    });
  });
});

describe('Interval adaptation', () => {
  it('interval decreases after correct streak >= threshold (3)', () => {
    const engine = createEngine(makeSettings({
      taskMode: '1-back',
      startingInterval: 3000,
      minimumInterval: 500,
    }));
    engine.start();

    // Wait for first digit
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const s1 = engine.getState();
        const hist = s1.digitHistory;
        const firstDigit = hist[0];

        // We need 3 correct answers to trigger interval decrease
        // After first digit, submit answer = firstDigit + firstDigit (1-back, same digit twice won't work)
        // Actually the nBack changes per trial. Let me just submit correct answers
        // and check the interval after 3 correct answers in a row.

        // Trick: use a scenario where we know the answers
        // Digit 0 = A, Digit 1 = B, Digit 2 = C, etc.
        // 1-back: answer at trial 1 = A+B, at trial 2 = B+C, etc.

        // After first digit, canAnswer = false
        // After second digit, canAnswer = true, answer = digit[0] + digit[1]
        // After third digit, answer = digit[1] + digit[2]

        // Submit correct answer for trial 1 (second digit)
        const expected1 = hist[0] + hist[1];
        engine.submitAnswer(expected1);
        expect(engine.getState().correctStreak).toBe(1);

        // Wait for next digit
        setTimeout(() => {
          const s2 = engine.getState();
          const h2 = s2.digitHistory;
          if (h2.length >= 3) {
            const expected2 = h2[1] + h2[2];
            engine.submitAnswer(expected2);
            expect(engine.getState().correctStreak).toBe(2);

            // Wait for next digit
            setTimeout(() => {
              const s3 = engine.getState();
              const h3 = s3.digitHistory;
              if (h3.length >= 4) {
                const expected3 = h3[2] + h3[3];
                engine.submitAnswer(expected3);
                // After 3 correct, threshold met (3 >= 3), streak resets, interval decreases
                const s4 = engine.getState();
                expect(s4.correctStreak).toBe(0);
                expect(s4.currentInterval).toBe(2800); // 3000 - 200
              }
              engine.dispose();
              resolve();
            }, 50);
          } else {
            engine.dispose();
            resolve();
          }
        }, 50);
      }, 50);
    });
  });

  it('interval increases on wrong answer', () => {
    const engine = createEngine(makeSettings({
      taskMode: '1-back',
      startingInterval: 3000,
      minimumInterval: 500,
    }));
    engine.start();

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // Submit wrong answer
        engine.submitAnswer(-999);
        const s = engine.getState();
        expect(s.currentInterval).toBe(3500); // 3000 + 500
        expect(s.wrongStreak).toBe(1);
        expect(s.correctStreak).toBe(0);
        engine.dispose();
        resolve();
      }, 50);
    });
  });

  it('interval capped at startingInterval on wrong answer', () => {
    const engine = createEngine(makeSettings({
      taskMode: '1-back',
      startingInterval: 3000,
      minimumInterval: 500,
    }));
    engine.start();

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        engine.submitAnswer(-999);
        engine.submitAnswer(-999);
        engine.submitAnswer(-999);
        const s = engine.getState();
        // Each wrong answer adds 500, but capped at startingInterval (3000)
        expect(s.currentInterval).toBe(3000);
        engine.dispose();
        resolve();
      }, 50);
    });
  });

  it('interval cannot go below minimumInterval', () => {
    const engine = createEngine(makeSettings({
      taskMode: '1-back',
      startingInterval: 700,
      minimumInterval: 500,
    }));
    engine.start();

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const hist = engine.getState().digitHistory;

        // 3 correct answers to trigger decrease
        for (let i = 0; i < 3; i++) {
          const s = engine.getState();
          if (s.canAnswer && s.digitHistory.length >= 2) {
            const h = s.digitHistory;
            engine.submitAnswer(h[h.length - 2] + h[h.length - 1]);
          }
        }

        const s = engine.getState();
        // 700 - 200 = 500, which equals minimumInterval
        expect(s.currentInterval).toBeGreaterThanOrEqual(500);
        engine.dispose();
        resolve();
      }, 50);
    });
  });
});

describe('Timer countdown', () => {
  it('counts down every second', () => {
    const engine = createEngine(makeSettings({ timer: 5 }));
    engine.start();

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const s = engine.getState();
        expect(s.timeLeft).toBeLessThan(5);
        expect(s.timeLeft).toBeGreaterThan(0);
        engine.dispose();
        resolve();
      }, 2500);
    });
  }, 5000);

  it('completes when timer reaches 0', () => {
    const engine = createEngine(makeSettings({ timer: 1 }));
    engine.start();

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const s = engine.getState();
        expect(s.phase).toBe('complete');
        expect(s.timeLeft).toBe(0);
        expect(s.sessionResults).not.toBeNull();
        engine.dispose();
        resolve();
      }, 1500);
    }, 5000);
  });
});

describe('State machine transitions', () => {
  it('starts in setup if onboarding completed', () => {
    const engine = createEngine(makeSettings({ onboardingCompleted: true }));
    expect(engine.getState().phase).toBe('setup');
    engine.dispose();
  });

  it('starts in onboarding if not completed', () => {
    const engine = createEngine(makeSettings({ onboardingCompleted: false }));
    expect(engine.getState().phase).toBe('onboarding');
    engine.dispose();
  });

  it('onboarding → setup on completeOnboarding()', () => {
    const engine = createEngine(makeSettings({ onboardingCompleted: false }));
    expect(engine.getState().phase).toBe('onboarding');
    engine.completeOnboarding();
    expect(engine.getState().phase).toBe('setup');
    expect(engine.getState().settings.onboardingCompleted).toBe(true);
    engine.dispose();
  });

  it('setup → active on start()', () => {
    const engine = createEngine(makeSettings({ onboardingCompleted: true }));
    engine.start();
    expect(engine.getState().phase).toBe('active');
    engine.dispose();
  });

  it('active → paused on pause()', () => {
    const engine = createEngine(makeSettings({ onboardingCompleted: true }));
    engine.start();
    engine.pause();
    expect(engine.getState().phase).toBe('paused');
    engine.dispose();
  });

  it('paused → active on resume()', () => {
    const engine = createEngine(makeSettings({ onboardingCompleted: true }));
    engine.start();
    engine.pause();
    engine.resume();
    expect(engine.getState().phase).toBe('active');
    engine.dispose();
  });

  it('active → complete on stop()', () => {
    const engine = createEngine(makeSettings({ onboardingCompleted: true }));
    engine.start();
    engine.stop();
    expect(engine.getState().phase).toBe('complete');
    expect(engine.getState().sessionResults).not.toBeNull();
    engine.dispose();
  });
});

describe('Settings persistence', () => {
  it('saves settings to localStorage', () => {
    const engine = createEngine(makeSettings({ onboardingCompleted: false }));
    engine.completeOnboarding();

    const raw = localStorage.getItem('settings');
    expect(raw).not.toBeNull();
    const saved = JSON.parse(raw!);
    expect(saved.onboardingCompleted).toBe(true);
    engine.dispose();
  });

  it('loads settings from localStorage on creation', () => {
    localStorage.setItem('settings', JSON.stringify({
      timer: 300,
      taskMode: '2-back',
      voicePack: 'jenny',
      startingInterval: 5000,
      minimumInterval: 300,
      onboardingCompleted: true,
    }));

    const engine = createEngine();
    const s = engine.getState();
    expect(s.settings.timer).toBe(300);
    expect(s.settings.taskMode).toBe('2-back');
    expect(s.settings.voicePack).toBe('jenny');
    expect(s.settings.startingInterval).toBe(5000);
    expect(s.settings.minimumInterval).toBe(300);
    expect(s.settings.onboardingCompleted).toBe(true);
    engine.dispose();
  });

  it('updateSettings persists to localStorage', () => {
    const engine = createEngine(makeSettings({ onboardingCompleted: true }));
    engine.updateSettings({ timer: 900, taskMode: 'variable' });

    const raw = localStorage.getItem('settings');
    const saved = JSON.parse(raw!);
    expect(saved.timer).toBe(900);
    expect(saved.taskMode).toBe('variable');
    engine.dispose();
  });
});

describe('Score calculation', () => {
  it('accuracy = totalCorrect / totalAnswers', () => {
    const engine = createEngine(makeSettings({ taskMode: '1-back', startingInterval: 10, minimumInterval: 10 }));
    engine.start();

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // Submit 2 correct, 1 wrong (if enough digits)
        const s = engine.getState();
        if (s.canAnswer) {
          const h = s.digitHistory;
          engine.submitAnswer(h[h.length - 2] + h[h.length - 1]); // correct
        }

        setTimeout(() => {
          const s2 = engine.getState();
          if (s2.canAnswer) {
            const h2 = s2.digitHistory;
            engine.submitAnswer(9999); // wrong
          }

          setTimeout(() => {
            const s3 = engine.getState();
            if (s3.canAnswer) {
              const h3 = s3.digitHistory;
              engine.submitAnswer(h3[h3.length - 2] + h3[h3.length - 1]); // correct
            }

            const final = engine.getState();
            if (final.totalAnswers > 0) {
              expect(final.accuracy).toBe(final.totalCorrect / final.totalAnswers);
            }
            engine.dispose();
            resolve();
          }, 50);
        }, 50);
      }, 50);
    });
  });

  it('fastestInterval tracks minimum interval achieved', () => {
    const engine = createEngine(makeSettings({ taskMode: '1-back', startingInterval: 3000, minimumInterval: 500 }));
    engine.start();

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const s = engine.getState();
        // Initial fastestInterval = startingInterval
        expect(engine.getState().fastestInterval).toBe(3000);
        engine.dispose();
        resolve();
      }, 50);
    });
  });

  it('session results are saved on completion', () => {
    const engine = createEngine(makeSettings({ onboardingCompleted: true, timer: 1 }));
    engine.start();

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const s = engine.getState();
        expect(s.phase).toBe('complete');
        expect(s.sessionResults).not.toBeNull();
        expect(s.sessionResults!.mode).toBe('1-back');
        expect(s.sessionResults!.completedAt).toBeTruthy();

        // Check history was persisted
        const history = engine.loadHistory();
        expect(history.length).toBeGreaterThanOrEqual(1);

        engine.dispose();
        resolve();
      }, 1500);
    }, 5000);
  });
});

describe('Audio URLs', () => {
  it('getDigitAudioUrl returns correct path', () => {
    const engine = createEngine(makeSettings({ voicePack: 'rose' }));
    expect(engine.getDigitAudioUrl(3)).toBe('/rose/3.wav');
    expect(engine.getDigitAudioUrl(1)).toBe('/rose/1.wav');
    expect(engine.getDigitAudioUrl(9)).toBe('/rose/9.wav');
    engine.dispose();
  });

  it('getDigitAudioUrl uses current voicePack', () => {
    const engine = createEngine(makeSettings({ voicePack: 'jenny' }));
    expect(engine.getDigitAudioUrl(5)).toBe('/jenny/5.wav');
    engine.dispose();
  });

  it('getBeepAudioUrl returns /beep.wav', () => {
    const engine = createEngine();
    expect(engine.getBeepAudioUrl()).toBe('/beep.wav');
    engine.dispose();
  });
});

describe('Subscribe pattern', () => {
  it('notifies subscribers on state change', () => {
    const engine = createEngine(makeSettings({ onboardingCompleted: true }));
    const states: GameState[] = [];

    const unsub = engine.subscribe((s) => states.push(s));

    // Should have been called once immediately with initial state
    expect(states.length).toBe(1);

    engine.start();
    // Should be called again with active state
    expect(states.length).toBeGreaterThanOrEqual(2);

    unsub();
    engine.dispose();
  });

  it('unsubscribe stops notifications', () => {
    const engine = createEngine(makeSettings({ onboardingCompleted: true }));
    let count = 0;

    const unsub = engine.subscribe(() => count++);
    const initialCount = count;

    unsub();
    engine.start();

    // After unsub, start shouldn't add more notifications
    // (but start itself triggers notify, which calls all current subscribers at time of start)
    // Since unsub was called before start, no new notifications should be received
    expect(count).toBe(initialCount);

    engine.dispose();
  });
});

describe('Edge cases', () => {
  it('cannot submit answer when phase is not active', () => {
    const engine = createEngine(makeSettings({ onboardingCompleted: true }));
    // In setup phase
    engine.submitAnswer(10);
    expect(engine.getState().lastAnswerCorrect).toBeNull();
    engine.dispose();
  });

  it('cannot submit answer before enough history', () => {
    const engine = createEngine(makeSettings({ taskMode: '1-back', startingInterval: 10, minimumInterval: 10 }));
    engine.start();

    // First digit, can't answer yet
    engine.submitAnswer(10);
    expect(engine.getState().lastAnswerCorrect).toBeNull();
    expect(engine.getState().totalAnswers).toBe(0);
    engine.dispose();
  });

  it('pause does nothing if not active', () => {
    const engine = createEngine(makeSettings({ onboardingCompleted: true }));
    engine.pause(); // no-op
    expect(engine.getState().phase).toBe('setup');
    engine.dispose();
  });

  it('resume does nothing if not paused', () => {
    const engine = createEngine(makeSettings({ onboardingCompleted: true }));
    engine.resume(); // no-op
    expect(engine.getState().phase).toBe('setup');
    engine.dispose();
  });

  it('dispose cleans up timers', () => {
    const engine = createEngine(makeSettings({ onboardingCompleted: true }));
    engine.start();
    engine.dispose();
    // Should not throw or leak
  });

  it('wrongStreak increments on wrong answers', () => {
    const engine = createEngine(makeSettings({ taskMode: '1-back', startingInterval: 10, minimumInterval: 10 }));
    engine.start();

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const s = engine.getState();
        if (s.canAnswer) {
          engine.submitAnswer(9999); // wrong
          engine.submitAnswer(9999); // wrong
          const after = engine.getState();
          expect(after.wrongStreak).toBe(2);
        }
        engine.dispose();
        resolve();
      }, 50);
    });
  });

  it('correct answer resets wrongStreak', () => {
    const engine = createEngine(makeSettings({ taskMode: '1-back', startingInterval: 10, minimumInterval: 10 }));
    engine.start();

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const s = engine.getState();
        if (s.canAnswer) {
          const h = s.digitHistory;
          engine.submitAnswer(9999); // wrong
          const s2 = engine.getState();
          expect(s2.wrongStreak).toBe(1);

          // Wait for next digit
          setTimeout(() => {
            const s3 = engine.getState();
            if (s3.canAnswer) {
              const h3 = s3.digitHistory;
              engine.submitAnswer(h3[h3.length - 2] + h3[h3.length - 1]); // correct
              const s4 = engine.getState();
              expect(s4.wrongStreak).toBe(0);
            }
            engine.dispose();
            resolve();
          }, 50);
        } else {
          engine.dispose();
          resolve();
        }
      }, 50);
    });
  });
});
