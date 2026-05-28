<script lang="ts">
  import type { Engine, GameState } from '$lib/engine';

  let { engine }: { engine: Engine } = $props();
  let state = $state<GameState>(engine.getState());

  $effect(() => {
    return engine.subscribe((s) => { state = s; });
  });

  let selectedButton = $state<number | null>(null);
  let keyValue = $state('');
  let swipeActive = $state(false);
  let lastTouchEndTime = $state(0);

  /** Find the nearest keypad button under a touch point */
  function buttonFromTouch(touch: Touch): number | null {
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el) return null;
    const btn = el.closest('[data-answer]') as HTMLElement | null;
    if (!btn) return null;
    return parseInt(btn.dataset.answer!);
  }

  /** Container touch handler: only for swipe-in (touch starts outside any button) */
  function handleContainerTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (el && el.closest('[data-answer]')) return; // button will handle its own touchstart
    e.preventDefault();
    swipeActive = true;
    selectedButton = null;
  }

  function handleKeypadTouchStart(answer: number, e: TouchEvent) {
    e.preventDefault();
    swipeActive = true;
    selectedButton = answer;
  }

  function handleKeypadTouchMove(e: TouchEvent) {
    if (!swipeActive) return;
    e.preventDefault();
    const touch = e.touches[0];
    const answer = buttonFromTouch(touch);
    if (answer !== null) selectedButton = answer;
  }

  function handleKeypadTouchEnd(e: TouchEvent) {
    if (!swipeActive) return;
    e.preventDefault();
    swipeActive = false;
    lastTouchEndTime = Date.now();
    if (selectedButton !== null) {
      engine.submitAnswer(selectedButton);
    }
  }

  function handleKeypadClick(answer: number, e: MouseEvent) {
    // Ignore synthetic clicks that immediately follow a touch sequence (swipe or tap)
    if (Date.now() - lastTouchEndTime < 300) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    selectedButton = answer;
    engine.submitAnswer(answer);
  }

  function handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    // Strip non-digits, limit to 2 chars
    let raw = input.value.replace(/\D/g, '').slice(0, 2);
    // Clamp 0-99
    if (raw !== '') {
      const num = parseInt(raw);
      if (num > 99) raw = '99';
    }
    keyValue = raw;
    // Auto-submit if valid 2-digit range
    if (raw !== '' && state.canAnswer) {
      const num = parseInt(raw);
      if (num >= 2 && num <= 18) {
        engine.submitAnswer(num);
      }
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      return; // Enter does nothing in original
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      keyValue = '';
      const input = e.target as HTMLInputElement;
      if (input) input.value = '';
      return;
    }
  }

  function resetInput() {
    keyValue = '';
  }

  const isPaused = $derived(state.phase === 'paused');
  const currentDigit = $derived(state.currentDigit);

  // Clear selection when new digit arrives
  $effect(() => {
    currentDigit; // track the primitive value, not state object
    selectedButton = null;
    keyValue = '';
  });

  // Status text for keyboard mode
  const statusText = $derived(
    isPaused ? 'Paused' :
    state.canAnswer ? 'Type a number' :
    'Wait for enough digits...'
  );
</script>

<div class="relative flex grow select-none flex-col items-center justify-end gap-12 py-6 md:flex-row md:grow-0 md:justify-evenly md:gap-24">
  <!-- Streak bar + label -->
  <div class="relative flex flex-col items-center">
    <div class="flex md:flex-col w-[200px] md:w-auto md:h-[200px] overflow-hidden rounded-full gap-3">
      <div class="grow w-[10px] h-[10px] {state.correctStreak >= 1 ? 'streak-bar bg-[#4fe84f]' : state.wrongStreak >= 1 ? 'streak-bar bg-[#e85c4f]' : 'bg-[#10b981]'}"></div>
      <div class="w-[10px] h-[10px] {state.correctStreak >= 2 ? 'streak-bar bg-[#4fe84f]' : state.wrongStreak >= 2 ? 'streak-bar bg-[#e85c4f]' : 'bg-[#0f121a]'}"></div>
      <div class="w-[10px] h-[10px] {state.correctStreak >= 3 ? 'streak-bar bg-[#4fe84f]' : state.wrongStreak >= 3 ? 'streak-bar bg-[#e85c4f]' : 'bg-[#0f121a]'}"></div>
      <div class="w-[10px] h-[10px] rounded-r-full md:rounded-r-none md:rounded-b-full {state.correctStreak === 4 ? 'streak-bar bg-[#4fe84f]' : state.wrongStreak >= 4 ? 'streak-bar bg-[#e85c4f]' : 'bg-[#0f121a]'}"></div>
    </div>
    <span class="absolute top-full mt-12 hidden whitespace-nowrap text-xs font-medium text-[#a9b4cc] md:inline">
      <span class="font-extrabold">{state.correctStreak}</span> STREAKS
    </span>
  </div>

  <!-- Center column -->
  <div class="flex flex-col justify-end gap-6 md:grow">
    <!-- Controls row: pause + interval + stop -->
    <div class="flex flex-col items-center justify-center gap-6 md:flex-row md:gap-0">
      <div class="flex grow items-center justify-center gap-6 md:justify-end">
        {#if isPaused}
          <!-- Mobile resume button (md:hidden) -->
          <button class="flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-full bg-[#0f121a] hover:bg-[#090a0d] md:hidden" onclick={() => engine.resume()}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Play--Streamline-Solar" height="20" width="20"><g id="Bold Duotone/Video Audio Sound/Play"><path id="Vector" fill="#10b981" d="m8.59662 21.6145 12.81198 -6.9671C22.4695 14.0705 23 13.0352 23 12H4v6.9671c0 2.3092 2.53435 3.7689 4.59662 2.6474Z" stroke-width="1"></path><path id="Vector_2" fill="#a9b4cc" fill-rule="evenodd" d="M23 12c0 -1.0352 -0.5305 -2.07047 -1.5914 -2.64742L8.59661 2.38548C6.53435 1.26402 4 2.72368 4 5.0329V12h19Z" clip-rule="evenodd" stroke-width="1"></path></g></svg>
          </button>
        {:else}
          <!-- Mobile pause button (md:hidden) -->
          <button class="flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-full bg-[#0f121a] hover:bg-[#090a0d] md:hidden" onclick={() => engine.pause()}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Pause--Streamline-Solar" height="20" width="20"><g id="Bold Duotone/Video Audio Sound/Pause"><path id="Vector" fill="#10b981" d="M14 6c0 -1.88562 0 -2.82843 0.5858 -3.41421C15.1716 2 16.1144 2 18 2c1.8856 0 2.8284 0 3.4142 0.58579C22 3.17157 22 4.11438 22 6v12c0 1.8856 0 2.8284 -0.5858 3.4142C20.8284 22 19.8856 22 18 22c-1.8856 0 -2.8284 0 -3.4142 -0.5858C14 20.8284 14 19.8856 14 18V6Z" stroke-width="1"></path><path id="Vector_2" fill="#a9b4cc" d="M2 6c0 -1.88562 0 -2.82843 0.58579 -3.41421C3.17157 2 4.11438 2 6 2c1.88562 0 2.82843 0 3.41421 0.58579C10 3.17157 10 4.11438 10 6v12c0 1.8856 0 2.8284 -0.58579 3.4142C8.82843 22 7.88562 22 6 22c-1.88562 0 -2.82843 0 -3.41421 -0.5858C2 20.8284 2 19.8856 2 18V6Z" stroke-width="1"></path></g></svg>
          </button>
        {/if}

        <!-- Interval text + settled badge -->
        <div class="flex items-center gap-3">
          <span class="text-sm text-[#a9b4cc]"><span class="font-extrabold">{(state.currentInterval / 1000).toFixed(2)}</span> SECONDS</span>
          {#if state.canAnswer}
            <span class="hidden rounded-full bg-[#a9b4cc] px-2 py-1 text-sm text-[#090a0d] sm:inline-flex">Settled</span>
          {/if}
        </div>

        <!-- Desktop stop button (always visible) -->
        <button class="flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-full bg-[#0f121a] hover:bg-[#090a0d]" onclick={() => engine.stop()}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Stop--Streamline-Solar" height="20" width="20"><g id="Bold Duotone/Video Audio Sound/Stop"><path id="Vector" fill="#10b981" d="M3.46484 20.5359c1.46447 1.4645 3.82149 1.4645 8.53556 1.4645 4.714 0 7.071 0 8.5355 -1.4645 1.4645 -1.4645 1.4645 -3.8215 1.4645 -8.5355 0 -4.71407 0 -7.07109 -1.4645 -8.53556L3.46484 20.5359Z" stroke-width="1"></path><path id="Vector_2" fill="#a9b4cc" fill-rule="evenodd" d="M3.46447 3.46447C2 4.92893 2 7.28595 2 12c0 4.714 0 7.0711 1.46447 8.5355L20.5355 3.46447C19.0711 2 16.714 2 12 2 7.28595 2 4.92893 2 3.46447 3.46447Z" clip-rule="evenodd" stroke-width="1"></path></g></svg>
        </button>
      </div>
    </div>

    <!-- Keypad area -->
    {#if state.settings.useKeypad}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="flex justify-center"
        ontouchstart={handleContainerTouchStart}
        ontouchmove={handleKeypadTouchMove}
        ontouchend={handleKeypadTouchEnd}
      >
        <div class="flex flex-col gap-3 overflow-hidden">
          <!-- Row 1: digit/speaker + 2,3 | 4,5,6 -->
          <div class="flex flex-col md:flex-row gap-3">
            <div class="flex gap-3">
              <div class="flex justify-center items-center py-6 w-[88px]">
                {#if state.settings.useVoice}
                  <!-- Voice mode: speaker icon -->
                  {#if state.isPlayingAudio}
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="#a9b4cc" viewBox="0 0 256 256"><path d="M168,32V224a8,8,0,0,1-12.91,6.31L85.25,176H40a16,16,0,0,1-16-16V96A16,16,0,0,1,40,80H85.25l69.84-54.31A8,8,0,0,1,168,32Zm32,64a8,8,0,0,0-8,8v48a8,8,0,0,0,16,0V104A8,8,0,0,0,200,96Zm32-16a8,8,0,0,0-8,8v80a8,8,0,0,0,16,0V88A8,8,0,0,0,232,80Z"></path></svg>
                  {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="#a9b4cc" viewBox="0 0 256 256"><path d="M168,32V224a8,8,0,0,1-12.91,6.31L85.25,176H40a16,16,0,0,1-16-16V96A16,16,0,0,1,40,80H85.25l69.84-54.31A8,8,0,0,1,168,32Zm32,64a8,8,0,0,0-8,8v48a8,8,0,0,0,16,0V104A8,8,0,0,0,200,96Z"></path></svg>
                  {/if}
                {:else if state.currentDigit !== null}
                  <!-- Text/visual mode: digit with SVG progress ring -->
                  {#key state.digitHistory.length}
                    <div class="relative">
                      <span class="text-[#ffffff] text-4xl font-medium">{state.currentDigit}</span>
                      <svg class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" width="72" height="72" viewBox="0 0 72 72">
                        <circle cx="36" cy="36" r="32" fill="none" stroke="#1a1f2e" stroke-width="4" />
                        <circle
                          cx="36" cy="36" r="32"
                          fill="none"
                          stroke="#10b981"
                          stroke-width="4"
                          stroke-linecap="round"
                          stroke-dasharray="201"
                          stroke-dashoffset="201"
                          class="progress-ring"
                          style="animation-duration: {state.currentInterval}ms;"
                        />
                      </svg>
                    </div>
                  {/key}
                {/if}
              </div>
              <button data-answer="2" class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 2 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" ontouchstart={(e) => handleKeypadTouchStart(2, e)} onclick={(e) => handleKeypadClick(2, e)}><span class="select-none text-[#10b981] text-4xl font-extrabold">2</span></button>
              <button data-answer="3" class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 3 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" ontouchstart={(e) => handleKeypadTouchStart(3, e)} onclick={(e) => handleKeypadClick(3, e)}><span class="select-none text-[#10b981] text-4xl font-extrabold">3</span></button>
            </div>
            <div class="flex gap-3">
              <button data-answer="4" class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 4 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" ontouchstart={(e) => handleKeypadTouchStart(4, e)} onclick={(e) => handleKeypadClick(4, e)}><span class="select-none text-[#10b981] text-4xl font-extrabold">4</span></button>
              <button data-answer="5" class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 5 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" ontouchstart={(e) => handleKeypadTouchStart(5, e)} onclick={(e) => handleKeypadClick(5, e)}><span class="select-none text-[#10b981] text-4xl font-extrabold">5</span></button>
              <button data-answer="6" class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 6 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" ontouchstart={(e) => handleKeypadTouchStart(6, e)} onclick={(e) => handleKeypadClick(6, e)}><span class="select-none text-[#10b981] text-4xl font-extrabold">6</span></button>
            </div>
          </div>
          <!-- Row 2: 7,8,9 | 10,11,12 -->
          <div class="flex flex-col md:flex-row gap-3">
            <div class="flex gap-3">
              <button data-answer="7" class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 7 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" ontouchstart={(e) => handleKeypadTouchStart(7, e)} onclick={(e) => handleKeypadClick(7, e)}><span class="select-none text-[#10b981] text-4xl font-extrabold">7</span></button>
              <button data-answer="8" class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 8 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" ontouchstart={(e) => handleKeypadTouchStart(8, e)} onclick={(e) => handleKeypadClick(8, e)}><span class="select-none text-[#10b981] text-4xl font-extrabold">8</span></button>
              <button data-answer="9" class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 9 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" ontouchstart={(e) => handleKeypadTouchStart(9, e)} onclick={(e) => handleKeypadClick(9, e)}><span class="select-none text-[#10b981] text-4xl font-extrabold">9</span></button>
            </div>
            <div class="flex gap-3">
              <button data-answer="10" class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 10 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" ontouchstart={(e) => handleKeypadTouchStart(10, e)} onclick={(e) => handleKeypadClick(10, e)}><span class="select-none text-[#10b981] text-4xl font-extrabold">10</span></button>
              <button data-answer="11" class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 11 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" ontouchstart={(e) => handleKeypadTouchStart(11, e)} onclick={(e) => handleKeypadClick(11, e)}><span class="select-none text-[#10b981] text-4xl font-extrabold">11</span></button>
              <button data-answer="12" class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 12 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" ontouchstart={(e) => handleKeypadTouchStart(12, e)} onclick={(e) => handleKeypadClick(12, e)}><span class="select-none text-[#10b981] text-4xl font-extrabold">12</span></button>
            </div>
          </div>
          <!-- Row 3: 13,14,15 | 16,17,18 -->
          <div class="flex flex-col md:flex-row gap-3">
            <div class="flex gap-3">
              <button data-answer="13" class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 13 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" ontouchstart={(e) => handleKeypadTouchStart(13, e)} onclick={(e) => handleKeypadClick(13, e)}><span class="select-none text-[#10b981] text-4xl font-extrabold">13</span></button>
              <button data-answer="14" class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 14 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" ontouchstart={(e) => handleKeypadTouchStart(14, e)} onclick={(e) => handleKeypadClick(14, e)}><span class="select-none text-[#10b981] text-4xl font-extrabold">14</span></button>
              <button data-answer="15" class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 15 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" ontouchstart={(e) => handleKeypadTouchStart(15, e)} onclick={(e) => handleKeypadClick(15, e)}><span class="select-none text-[#10b981] text-4xl font-extrabold">15</span></button>
            </div>
            <div class="flex gap-3">
              <button data-answer="16" class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 16 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" ontouchstart={(e) => handleKeypadTouchStart(16, e)} onclick={(e) => handleKeypadClick(16, e)}><span class="select-none text-[#10b981] text-4xl font-extrabold">16</span></button>
              <button data-answer="17" class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 17 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" ontouchstart={(e) => handleKeypadTouchStart(17, e)} onclick={(e) => handleKeypadClick(17, e)}><span class="select-none text-[#10b981] text-4xl font-extrabold">17</span></button>
              <button data-answer="18" class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 18 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" ontouchstart={(e) => handleKeypadTouchStart(18, e)} onclick={(e) => handleKeypadClick(18, e)}><span class="select-none text-[#10b981] text-4xl font-extrabold">18</span></button>
            </div>
          </div>
        </div>
      </div>
    {:else}
      <!-- Keyboard input mode -->
      <div class="flex max-w-screen flex-col px-6 md:p-0">
        <input
          type="text"
          inputmode="numeric"
          tabindex="0"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          autocorrect="off"
          style="-webkit-user-select:text; user-select:text;"
          class="pointer-events-auto select-text caret-[#10b981] md:h-[288px] md:w-[588px] rounded-4xl bg-[#000000] py-6 text-center text-4xl font-extrabold text-[#10b981] [appearance:textfield] focus:outline-none disabled:cursor-default disabled:text-[#7e889c] md:py-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          disabled={isPaused || !state.canAnswer}
          placeholder={statusText}
          value={keyValue}
          oninput={handleInput}
          onkeydown={handleKeydown}
        />
      </div>
    {/if}
  </div>
</div>

<style>
  .progress-ring {
    transform: rotate(-90deg);
    transform-origin: center;
    animation: fill-ring linear forwards;
  }

  @keyframes fill-ring {
    from {
      stroke-dashoffset: 201;
    }
    to {
      stroke-dashoffset: 0;
    }
  }
</style>
