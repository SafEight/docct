# DOCCT Game — Pixel-Perfect Spec

## Architecture
Single-page SvelteKit app (Svelte 5 runes). Client-side only. No backend. No routing.
All state in Svelte runes ($state, $derived, $effect). Settings in localStorage key "settings".

Project: DOCCT — cognitive control training game
Layout: SvelteKit project with Tailwind CSS v4.

## Color Palette (exact hex values)
| Token | Hex | Usage |
|-------|-----|-------|
| bg-page | #090a0d | Page background, body |
| bg-surface | #0f121a | Cards, inputs, container backgrounds |
| bg-surface-hover | #121621 | Hover state for surface |
| bg-black | #000000 | Active state, dropdown items |
| text-primary | #ffffff | White text |
| text-secondary | #a9b4cc | Labels, secondary text, borders |
| text-tertiary | #7e889c | Muted text, disabled |
| accent-blue | #4f79e8 | Primary CTA, play button, active blue |
| accent-green | #4fe84f | Correct/streak indicator |
| accent-red | #e85c4f | Wrong/incorrect indicator |
| text-inverse | #090a0d | Text on accent backgrounds |
| text-inverse-secondary | #0f121a | Text on white/accent bg |
| chart-line | #4f79e8 | Accuracy chart line |
| border-medium | #a9b4cc | Interactive border |
| border-muted | #7e889c | Subdued border |
| mode-1back-border | #3d4f82 | 1-back mode indicator |
| mode-2back-border | #2f6a57 | 2-back mode indicator |
| mode-variable-border | #7c6230 | Variable mode indicator |
| mode-1back-text | #8fb2ff | 1-back mode text |
| mode-2back-text | #74d8b3 | 2-back mode text |
| mode-variable-text | #d5b15e | Variable mode text |

## Typography
- Font family: DM Sans (Google Fonts: wght@100..1000, ital@0..1, opsz@9..40)
- Monospace: DM Mono wght@500
- Line-height: 1 (body, span), 1.2 for headings
- All inline SVG icons from Phosphor Icons (Streamline Solar variant)

## Game States

### 1. Onboarding Screen
Shown when `onboardingCompleted === false` (first visit).
- Full-page overlay: `bg-black/80 fixed inset-0 z-2 flex items-center justify-center`
- Card: `bg-[#0f121a] rounded-[24px] p-8 max-w-[800px]` with `border border-[#a9b4cc]`
- Title: "This is an exercise that targets cognitive control, the brain's ability to regulate attention, impulses, and emotions."
- Instructions: "Each time, a number (1-9) will be displayed or spoken out loud. Add that number to the one before it and say the sum (2-18). If the first number is 7 and the next is 3, you answer 10. If the number shown after 3 is 2, you answer 5."
- Button: "Continue" — closes onboarding, sets onboardingCompleted: true

### 2. Main Screen (Pre-Session / Setup)
Layout: `fixed flex w-full h-full z-2 overflow-auto`
Background: `bg-[#090a0d]`

#### Top bar (desktop)
- Left: Clock icon (SVG) + timer display `10:00` in `bg-[#0f121a] px-4 rounded-md border-[#7e889c] border-2`
- Center (on mobile): 
  - "DIGIT" label with dropdown → Voice / Visual
  - "ANSWER" label with dropdown → On-screen keypad / Keyboard
  - "HISTORY" button → opens history panel
  - Settings gear icon (desktop only, mobile shows at bottom)

#### Main content area
- **Pacing selector**: Adaptive / Fixed
  - Adaptive changes the interval after correct or wrong streaks
  - Fixed keeps the selected interval constant
- **Adaptation Step** (Adaptive only): Responsive / Classic (0.10s)
  - Responsive uses `max(15, round(currentInterval / 12))`
  - Classic changes by exactly 100ms and stays between the configured minimum and starting intervals

- **Duration**: custom minute input with 5 / 10 / 15 / 30 / 60 presets
  
- **Starting Interval** (Adaptive) / **Interval** (Fixed): input + preset buttons
  - Input: `bg-[#0f121a] p-2 w-[100px] text-xl font-medium text-white`
  - Preset buttons: 0.5, 1, 2, 3, 5 — `bg-[#a9b4cc] p-2 rounded-md`
  
- **Minimum Interval**: same layout as starting interval

- **Start button**: `bg-[#4f79e8] hover:opacity-75 py-6 px-18 rounded-full border`
  - Play triangle SVG icon in `bg-[#0f121a] p-1 rounded-md`
  - Text: "Start session" in `text-[#0f121a] font-semibold`

- **Discord link**: "Mindbuilding Discord: discord.gg/brain" in `text-[#7e889c] hover:text-[#a9b4cc]`

#### Mobile layout
- Duration buttons: `flex gap-6 justify-center items-center grow`
- Interval fields: `flex flex-col md:flex-row gap-9`
- Start section sticks to bottom: `flex flex-col p-6 pb-12 bg-[#0f121a]`

### 3. Active Session Screen
When session is running (`isPaused === false` or timer counting down).

- **Timer**: top-left, decreases every second. Display as `MM:SS`.
  - Standard display shows it during training
  - Focus display hides it during training but leaves it visible during setup
- **Interval readout**: Standard shows the numeric interval; Focus hides it while preserving the progress ring and post-session interval results
- **Digit display**: large centered number (1-9). Voice speaks it if voice mode enabled.
- **Answer input** (keypad mode): buttons 2-18
  - Classic (3×6) layout remains the default for backward compatibility
  - Optional Sequential 6×3 layout uses rows `2-7`, `8-13`, and `14-18`
  - Buttons: `bg-[#0f121a] border border-[#7e889c] rounded-md`
  - Correct answer flashes green briefly
  - Wrong answer: `bg-[#e85c4f]` briefly, optional wrong-answer sound
- **Timer bar**: visual progress bar showing time remaining
- **Streak bar**: thin colored bar at top — green for correct streak, red for wrong streak
- **Variable-mode badge**: displays the current `1-BACK` or `2-BACK` instruction directly before Pause
- **Pause/Resume button**: primary circular session control beside the interval and mode badge
- **End Session button**: explicit text action in the top-left header, spatially separated from Pause

### 4. Paused State
Overlay with "PAUSED" text, resume button.

### 5. Session Complete Screen
- "SESSION COMPLETE" heading
- Stats: accuracy %, fastest interval, total correct, streaks
- Chart.js line chart showing accuracy over time (accuracy chart) and fastest interval over time
- "New session" button returns to main screen

### 6. Settings Panel (gear icon)
Dropdown panel: `absolute right-0 top-[42px] w-[220px] bg-[#0f121a] rounded-xl border border-[#a9b4cc] shadow-2xl`
- Task mode: 1-back / 2-back / Variable (radio-style buttons)
- Voice pack: Rose / Rose Fast / Jenny
- "Beep on wrong answer" toggle
- Mobile: `fixed bottom-20 left-4 right-4`

### 7. History Panel
Shows past sessions:
- Each session: date, mode, accuracy %, fastest interval, streaks
- Chart.js charts: accuracy trend + fastest interval trend
- Empty state: "No sessions yet" message

## Game Engine — Exact Logic

### Settings Schema (localStorage "settings")
```json
{
  "timer": 600,           // seconds (600 = 10 min)
  "useVoice": true,       // voice or visual digits
  "useKeypad": true,      // keypad or keyboard input
  "keypadLayout": "classic", // "classic" | "sequential"
  "displayMode": "standard", // "standard" | "focus"
  "voicePack": "rose",    // "rose" | "rose_fast" | "jenny"
  "wrongSound": "beep",   // "none" | "beep" | "fart"
  "startingInterval": 3000,  // ms
  "minimumInterval": 500,    // ms, Adaptive pacing only
  "intervalMode": "adaptive", // "adaptive" | "fixed"
  "adaptationMode": "responsive", // "responsive" | "classic"
  "onboardingCompleted": false,
  "taskMode": "1-back"    // "1-back" | "2-back" | "variable"
}
```

### Digit Generation
```
function nextDigit():
  if isPaused: return
  updateScoreTracking()
  checkPreviousAnswer()
  setupNextTimer()
  
  digit = Math.floor(Math.random() * 9) + 1  // 1-9
  append to digitHistory[]
  
  nBack = taskMode === "variable" 
    ? (Math.random() < 0.5 ? 1 : 2) 
    : (taskMode === "2-back" ? 2 : 1)
  
  persistState(digitHistory, nBack)
```

### Answer Checking
Player must add the CURRENT digit to the digit from N steps ago.

Example (1-back): 
- Trial 1: digit=7 → no answer yet (first digit)
- Trial 2: digit=3 → answer should be 7+3=10
- Trial 3: digit=2 → answer should be 3+2=5

Example (2-back):
- Trial 1: digit=7 → no answer
- Trial 2: digit=3 → no answer (need 2 digits first)
- Trial 3: digit=2 → answer should be 7+2=9
- Trial 4: digit=5 → answer should be 3+5=8

```
function checkAnswer(playerAnswer):
  if digitHistory.length <= nBack: return  // not enough history
  
  expectedDigit = digitHistory[digitHistory.length - 1 - nBack]
  expectedAnswer = expectedDigit + currentDigit
  
  if playerAnswer === expectedAnswer:
    recordCorrect()
  else:
    recordIncorrect()
    if wrongSound !== "none": playWrongSound()
```

### Interval Adaptation
```
currentInterval = startingInterval  // in ms

function adaptationStep():
  if adaptationMode === "classic": return 100
  return max(15, round(currentInterval / 12))

function recordCorrect():
  correctStreak++
  wrongStreak = 0
  correctCount++
  
  if correctStreak >= 3:
    correctStreak = 0
    streakCount++
    if intervalMode === "adaptive":
      currentInterval = max(minimumInterval, currentInterval - adaptationStep())
      fastestInterval = min(fastestInterval, currentInterval)

function recordIncorrect():
  wrongStreak++
  correctStreak = 0
  if wrongStreak >= 3:
    wrongStreak = 0
    if intervalMode === "adaptive":
      nextInterval = currentInterval + adaptationStep()
      currentInterval = adaptationMode === "classic"
        ? min(startingInterval, nextInterval)
        : nextInterval
```

Adaptive pacing changes after every three correct or wrong answers. Responsive remains the backward-compatible default. Classic uses symmetric 100ms steps bounded by the configured minimum and starting interval. Fixed pacing still records streaks and scores but never changes `currentInterval`.

### Scoring
- **Accuracy**: correctCount / totalAnswers
- **Fastest interval**: minimum interval achieved
- **Streaks**: longest consecutive correct streak
- **Most correct**: highest correct ratio across sessions
- **Response time**: measured from digit display to answer submission

### Timer
- Countdown from configured timer (seconds)
- Decrements every 1000ms via setInterval
- When timer reaches 0: session ends, show results
- Pause stops the interval timer but NOT the session timer
- The game loop (digit generation) uses adaptive intervals, not the countdown

### Audio
- Voice packs: `/rose/1.wav` through `/rose/9.wav` etc.
- Beep: `/beep.wav` — 18KB mono WAV
- Uses Web Audio API (AudioContext)
- Voice digits: createBufferSource → connect to destination
- Beep: preloaded, played on incorrect answer if enabled
- AudioContext created lazily on first use
- AudioSession type set to "playback"

### Session History
Stored in localStorage under per-taskMode keys or combined.
Each session entry:
```
{
  completedAt: ISO string,
  mode: "1-back" | "2-back" | "variable",
  durationSec: number,
  accuracy: 0-1,
  fastestIntervalMs: number,
  endingIntervalMs: number,
  averageResponseMs: number,
  correctCount: number,
  totalAnswers: number,
  streaks: number
}
```

## CSS — Complete Rules

### Custom property overrides (beyond Tailwind defaults)
No additional CSS custom properties. Pure Tailwind v4 + inline arbitrary values.

### Non-Tailwind rules
```css
body { background-color: #090a0d; margin: 0; font-family: DM Sans, sans-serif; line-height: 1; }
span { line-height: 1; }
.streak-bar { flex-grow: 1; transition-duration: 0.1s; }
```

### Screen-specific breakpoints
- sm: 40rem (640px) — small adjustments
- md: 48rem (768px) — major layout shifts (desktop)
- lg: 64rem (1024px) — minor tweaks
- xl: 80rem (1280px) — grid changes

### Responsive behavior
- Mobile (<768px): vertical layout, start button fixed at bottom, settings floating
- Desktop (≥768px): horizontal layout, top bar, side-by-side intervals

## SVG Icons (exact paths)
All from Phosphor Icons / Streamline Solar. Inline SVGs, no external icon library.

1. **Clock** (timer icon): viewBox 0 0 256 256, fill #090a0d, bg #a9b4cc rounded-xl, 24x24
2. **Play** (start/resume): viewBox 0 0 24 24, fill #4f79e8, 12x12 or 20x20
3. **Pause**: viewBox 0 0 24 24, fill #4f79e8, 20x20
4. **Stop**: viewBox 0 0 24 24, fill #4f79e8, 20x20
5. **Settings gear**: viewBox 0 0 256 256, fill currentColor, 18x18
6. **Arrow down** (dropdown): viewBox 0 0 24 24, dual-tone #4f79e8 + #a9b4cc, 20x20
7. **Chevron left/right** (history nav): viewBox 0 0 256 256, fill #0f121a, 12x12
8. **Close/X** (dismiss): standard X icon

## Verification Checklist
- [ ] Onboarding shows on first visit, dismisses on Continue
- [ ] Main screen: duration selector, interval inputs, start button
- [ ] Settings dropdown: task modes, voice packs, beep toggle
- [ ] Session: digit display, keypad, timer countdown
- [ ] Correct answer: green flash, interval decreases
- [ ] Wrong answer: red flash, optional beep, interval increases
- [ ] Voice mode: audio plays digit number
- [ ] Pause/stop: overlay with controls
- [ ] Session complete: stats + charts
- [ ] History: past sessions list + charts
- [ ] Mobile responsive: all states at 375px width
- [ ] All 22 hex colors match exactly
- [ ] DM Sans font loaded
- [ ] All 12 SVG icons present and correct
- [ ] localStorage settings persist and restore
- [ ] AudioContext created lazily
- [ ] Beep only plays when enabled
