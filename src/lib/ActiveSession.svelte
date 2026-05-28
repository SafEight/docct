<script lang="ts">
  import type { Engine, GameState } from '$lib/engine';

  let { engine }: { engine: Engine } = $props();
  let state = $state<GameState>(engine.getState());
  let lastAnswerCorrect: boolean | null = $state(null);

  $effect(() => {
    return engine.subscribe((s) => {
      lastAnswerCorrect = s.lastAnswerCorrect;
      state = s;
    });
  });

  let displayTime = $derived.by(() => {
    const mins = Math.floor(state.timeLeft / 60);
    const secs = state.timeLeft % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  let timerProgress = $derived(state.totalTime > 0 ? state.timeLeft / state.totalTime : 0);

  let answerResult = $derived<'correct' | 'incorrect' | null>(
    lastAnswerCorrect === true ? 'correct' : lastAnswerCorrect === false ? 'incorrect' : null
  );

  let keypadNumbers = $derived([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);

  function handleAnswer(num: number) {
    engine.submitAnswer(num);
  }

  // Keyboard support
  $effect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (state.phase !== 'active') return;

      if (e.key === 'Escape') {
        engine.pause();
      }
    }

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

<div class="fixed flex w-full h-full z-2 overflow-hidden bg-[#090a0d] flex-col">
  <!-- Streak bar -->
  <div class="flex w-full h-1">
    <div
      class="streak-bar {answerResult === 'correct' ? 'bg-[#4fe84f]' : answerResult === 'incorrect' ? 'bg-[#e85c4f]' : 'bg-[#7e889c]'}"
      style="width: {timerProgress * 100}%"
    ></div>
  </div>

  <!-- Timer bar (progress) -->
  <div class="w-full h-1 bg-[#0f121a]">
    <div class="h-full bg-[#4f79e8] transition-all duration-1000" style="width: {timerProgress * 100}%"></div>
  </div>

  <!-- Top controls -->
  <div class="flex items-center justify-between px-4 py-3">
    <div class="flex items-center gap-3">
      <!-- Timer -->
      <div class="bg-[#0f121a] px-4 py-2 rounded-md border-2 border-[#7e889c]">
        <span class="text-white text-lg font-medium font-mono">{displayTime}</span>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <!-- Pause button -->
      <button aria-label="Pause"
        class="flex items-center justify-center w-10 h-10 rounded-lg bg-[#0f121a] border border-[#7e889c] cursor-pointer hover:bg-[#121621] transition-colors"
        onclick={() => engine.pause()}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#4f79e8">
          <rect x="6" y="4" width="4" height="16" rx="1"/>
          <rect x="14" y="4" width="4" height="16" rx="1"/>
        </svg>
      </button>

      <!-- Stop button -->
      <button aria-label="Stop"
        class="flex items-center justify-center w-10 h-10 rounded-lg bg-[#0f121a] border border-[#7e889c] cursor-pointer hover:bg-[#121621] transition-colors"
        onclick={() => engine.stop()}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#4f79e8">
          <rect x="6" y="6" width="12" height="12" rx="2"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Main game area -->
  <div class="flex flex-col items-center justify-center flex-1 px-4">
    <!-- Current digit display -->
    {#if state.currentDigit !== null}
      <div class="mb-12">
        <span class="text-white text-[120px] md:text-[160px] font-bold leading-none" style="font-family: 'DM Mono', monospace;">
          {state.currentDigit}
        </span>
      </div>
    {/if}

    <!-- Keypad -->
    {#if state.settings.useKeypad}
      <div class="grid grid-cols-6 md:grid-cols-6 gap-2 max-w-[500px]">
        {#each keypadNumbers as num}
          <button
            class="w-[52px] h-[52px] md:w-[60px] md:h-[60px] rounded-md flex items-center justify-center text-lg font-medium cursor-pointer border transition-all duration-150
              {answerResult === 'correct' ? 'bg-[#4fe84f] text-[#090a0d] border-[#4fe84f]' :
               answerResult === 'incorrect' ? 'bg-[#e85c4f] text-[#ffffff] border-[#e85c4f]' :
               'bg-[#0f121a] text-[#a9b4cc] border-[#7e889c] hover:bg-[#121621]'}"
            onclick={() => handleAnswer(num)}
          >
            {num}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Bottom stats -->
  <div class="flex items-center justify-center gap-8 py-4 px-4">
    <div class="flex flex-col items-center">
      <span class="text-[#7e889c] text-xs">Streak</span>
      <span class="text-[#4fe84f] text-lg font-bold">{state.correctStreak}</span>
    </div>
    <div class="flex flex-col items-center">
      <span class="text-[#7e889c] text-xs">Correct</span>
      <span class="text-white text-lg font-bold">{state.totalCorrect}/{state.totalAnswers}</span>
    </div>
    <div class="flex flex-col items-center">
      <span class="text-[#7e889c] text-xs">Accuracy</span>
      <span class="text-white text-lg font-bold">
        {state.totalAnswers > 0 ? Math.round((state.totalCorrect / state.totalAnswers) * 100) : 0}%
      </span>
    </div>
  </div>
</div>
