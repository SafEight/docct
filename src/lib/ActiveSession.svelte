<script lang="ts">
  import type { Engine, GameState } from '$lib/engine';

  let { engine }: { engine: Engine } = $props();
  let state = $state<GameState>(engine.getState());

  $effect(() => {
    return engine.subscribe((s) => { state = s; });
  });

  let selectedButton = $state<number | null>(null);
  let keyValue = $state('');

  function handleKeypad(answer: number) {
    selectedButton = answer;
    engine.submitAnswer(answer);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (state.phase !== 'active' || !state.canAnswer) return;
    const num = parseInt(e.key);
    if (num >= 2 && num <= 18) {
      keyValue = e.key;
      engine.submitAnswer(num);
    } else if (e.key === 'Enter') {
      // Submit current value if any
      const num = parseInt(keyValue);
      if (num >= 2 && num <= 18) {
        engine.submitAnswer(num);
      }
      keyValue = '';
    }
  }

  const isPaused = $derived(state.phase === 'paused');

  // Clear selection when new digit arrives
  $effect(() => {
    state.currentDigit;
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
      <div class="grow w-[10px] h-[10px] {state.correctStreak >= 1 ? 'streak-bar bg-[#4fe84f]' : state.wrongStreak >= 1 ? 'streak-bar bg-[#e85c4f]' : 'bg-[#4f79e8]'}"></div>
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
    <!-- Controls row: pause/digit/stop -->
    <div class="flex flex-col items-center justify-center gap-6 md:flex-row md:gap-0">
      <div class="flex grow items-center justify-center gap-6 md:justify-end">
        {#if isPaused}
          <!-- Mobile resume button (md:hidden) -->
          <button class="flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-full bg-[#0f121a] hover:bg-[#090a0d] md:hidden" onclick={() => engine.resume()}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Play--Streamline-Solar" height="20" width="20"><g id="Bold Duotone/Video Audio Sound/Play"><path id="Vector" fill="#4f79e8" d="m8.59662 21.6145 12.81198 -6.9671C22.4695 14.0705 23 13.0352 23 12H4v6.9671c0 2.3092 2.53435 3.7689 4.59662 2.6474Z" stroke-width="1"></path><path id="Vector_2" fill="#a9b4cc" fill-rule="evenodd" d="M23 12c0 -1.0352 -0.5305 -2.07047 -1.5914 -2.64742L8.59661 2.38548C6.53435 1.26402 4 2.72368 4 5.0329V12h19Z" clip-rule="evenodd" stroke-width="1"></path></g></svg>
          </button>
        {:else}
          <!-- Mobile pause button (md:hidden) -->
          <button class="flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-full bg-[#0f121a] hover:bg-[#090a0d] md:hidden" onclick={() => engine.pause()}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Pause--Streamline-Solar" height="20" width="20"><g id="Bold Duotone/Video Audio Sound/Pause"><path id="Vector" fill="#4f79e8" d="M14 6c0 -1.88562 0 -2.82843 0.5858 -3.41421C15.1716 2 16.1144 2 18 2c1.8856 0 2.8284 0 3.4142 0.58579C22 3.17157 22 4.11438 22 6v12c0 1.8856 0 2.8284 -0.5858 3.4142C20.8284 22 19.8856 22 18 22c-1.8856 0 -2.8284 0 -3.4142 -0.5858C14 20.8284 14 19.8856 14 18V6Z" stroke-width="1"></path><path id="Vector_2" fill="#a9b4cc" d="M2 6c0 -1.88562 0 -2.82843 0.58579 -3.41421C3.17157 2 4.11438 2 6 2c1.88562 0 2.82843 0 3.41421 0.58579C10 3.17157 10 4.11438 10 6v12c0 1.8856 0 2.8284 -0.58579 3.4142C8.82843 22 7.88562 22 6 22c-1.88562 0 -2.82843 0 -3.41421 -0.5858C2 20.8284 2 19.8856 2 18V6Z" stroke-width="1"></path></g></svg>
          </button>
        {/if}

        <!-- Digit display + interval + settled badge -->
        <div class="flex items-center gap-3">
          {#if state.settings.useVoice}
            <!-- Voice mode: show volume icon -->
            <div class="flex justify-center rounded-2xl transition-opacity {state.isPlayingAudio ? 'opacity-100' : 'opacity-0'}">
              {#if state.isPlayingAudio}
                <!-- 3-bar volume icon (playing) -->
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="#a9b4cc" viewBox="0 0 256 256"><path d="M168,32V224a8,8,0,0,1-12.91,6.31L85.25,176H40a16,16,0,0,1-16-16V96A16,16,0,0,1,40,80H85.25l69.84-54.31A8,8,0,0,1,168,32Zm32,64a8,8,0,0,0-8,8v48a8,8,0,0,0,16,0V104A8,8,0,0,0,200,96Zm32-16a8,8,0,0,0-8,8v80a8,8,0,0,0,16,0V88A8,8,0,0,0,232,80Z"></path></svg>
              {:else}
                <!-- 2-bar volume icon (not playing) -->
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="#a9b4cc" viewBox="0 0 256 256"><path d="M168,32V224a8,8,0,0,1-12.91,6.31L85.25,176H40a16,16,0,0,1-16-16V96A16,16,0,0,1,40,80H85.25l69.84-54.31A8,8,0,0,1,168,32Zm32,64a8,8,0,0,0-8,8v48a8,8,0,0,0,16,0V104A8,8,0,0,0,200,96Z"></path></svg>
              {/if}
            </div>
          {:else}
            <!-- Visual/text mode: show digit + interval -->
            <div class="flex justify-center rounded-2xl transition-opacity {state.currentDigit !== null ? 'opacity-100' : 'opacity-0'}">
              <span class="text-[#ffffff] text-4xl font-medium">{state.currentDigit}</span>
            </div>
          {/if}
          {#if state.canAnswer}
            <span class="hidden rounded-full bg-[#a9b4cc] px-2 py-1 text-sm text-[#090a0d] sm:inline-flex">Settled</span>
          {/if}
        </div>

        <!-- Desktop stop button (always visible) -->
        <button class="flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-full bg-[#0f121a] hover:bg-[#090a0d]" onclick={() => engine.stop()}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Stop--Streamline-Solar" height="20" width="20"><g id="Bold Duotone/Video Audio Sound/Stop"><path id="Vector" fill="#4f79e8" d="M3.46484 20.5359c1.46447 1.4645 3.82149 1.4645 8.53556 1.4645 4.714 0 7.071 0 8.5355 -1.4645 1.4645 -1.4645 1.4645 -3.8215 1.4645 -8.5355 0 -4.71407 0 -7.07109 -1.4645 -8.53556L3.46484 20.5359Z" stroke-width="1"></path><path id="Vector_2" fill="#a9b4cc" fill-rule="evenodd" d="M3.46447 3.46447C2 4.92893 2 7.28595 2 12c0 4.714 0 7.0711 1.46447 8.5355L20.5355 3.46447C19.0711 2 16.714 2 12 2 7.28595 2 4.92893 2 3.46447 3.46447Z" clip-rule="evenodd" stroke-width="1"></path></g></svg>
        </button>
      </div>
    </div>

    <!-- Keypad area -->
    {#if state.settings.useKeypad}
      <div class="flex justify-center">
        <div class="flex flex-col gap-3 overflow-hidden">
          <!-- Row 1: audio icon + 2,3 | 4,5,6 -->
          <div class="flex flex-col md:flex-row gap-3">
            <div class="flex gap-3">
              <div class="flex justify-center items-center py-6 w-[88px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="#a9b4cc" viewBox="0 0 256 256"><path d="M168,32V224a8,8,0,0,1-12.91,6.31L85.25,176H40a16,16,0,0,1-16-16V96A16,16,0,0,1,40,80H85.25l69.84-54.31A8,8,0,0,1,168,32Zm32,64a8,8,0,0,0-8,8v48a8,8,0,0,0,16,0V104A8,8,0,0,0,200,96Z"></path></svg>
              </div>
              <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 2 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" onclick={() => handleKeypad(2)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">2</span></button>
              <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 3 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" onclick={() => handleKeypad(3)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">3</span></button>
            </div>
            <div class="flex gap-3">
              <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 4 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" onclick={() => handleKeypad(4)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">4</span></button>
              <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 5 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" onclick={() => handleKeypad(5)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">5</span></button>
              <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 6 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" onclick={() => handleKeypad(6)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">6</span></button>
            </div>
          </div>
          <!-- Row 2: 7,8,9 | 10,11,12 -->
          <div class="flex flex-col md:flex-row gap-3">
            <div class="flex gap-3">
              <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 7 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" onclick={() => handleKeypad(7)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">7</span></button>
              <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 8 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" onclick={() => handleKeypad(8)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">8</span></button>
              <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 9 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" onclick={() => handleKeypad(9)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">9</span></button>
            </div>
            <div class="flex gap-3">
              <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 10 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" onclick={() => handleKeypad(10)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">10</span></button>
              <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 11 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" onclick={() => handleKeypad(11)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">11</span></button>
              <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 12 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" onclick={() => handleKeypad(12)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">12</span></button>
            </div>
          </div>
          <!-- Row 3: 13,14,15 | 16,17,18 -->
          <div class="flex flex-col md:flex-row gap-3">
            <div class="flex gap-3">
              <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 13 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" onclick={() => handleKeypad(13)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">13</span></button>
              <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 14 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" onclick={() => handleKeypad(14)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">14</span></button>
              <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 15 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" onclick={() => handleKeypad(15)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">15</span></button>
            </div>
            <div class="flex gap-3">
              <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 16 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" onclick={() => handleKeypad(16)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">16</span></button>
              <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 17 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" onclick={() => handleKeypad(17)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">17</span></button>
              <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl {selectedButton === 18 ? 'bg-[#000000] border-[#000000]' : 'cursor-pointer hover:bg-[#0f121a]'}" onclick={() => handleKeypad(18)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">18</span></button>
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
          class="pointer-events-auto select-text caret-[#4f79e8] md:h-[288px] md:w-[588px] rounded-4xl bg-[#000000] py-6 text-center text-4xl font-extrabold text-[#4f79e8] [appearance:textfield] focus:outline-none disabled:cursor-default disabled:text-[#7e889c] md:py-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          disabled={isPaused || !state.canAnswer}
          placeholder={statusText}
          value={keyValue}
          onkeydown={handleKeydown}
        />
      </div>
    {/if}
  </div>
</div>
