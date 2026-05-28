<script lang="ts">
  import type { Engine, GameState } from '$lib/engine';

  let { engine }: { engine: Engine } = $props();
  let state = $state<GameState>(engine.getState());

  $effect(() => {
    return engine.subscribe((s) => { state = s; });
  });

  function handleKeypad(answer: number) {
    engine.submitAnswer(answer);
  }

  // Streak bar segments: first is always blue (active), rest are dark
  // The streak bar fills up as correct streak increases
  const streakSegments = $derived(() => {
    const streak = state.correctStreak;
    return [0, 1, 2, 3].map(i => i <= streak);
  });
</script>

<div class="flex flex-col grow md:px-6 md:items-center select-none">
  <!-- Top bar -->
  <div class="md:flex md:py-6 justify-between gap-2 w-full max-w-7xl">
    <div class="hidden md:flex gap-6 items-center">
      <!-- END SESSION button -->
      <button class="cursor-pointer flex gap-2 items-center bg-[#a9b4cc] hover:bg-[#ffffff] p-1 px-4 rounded-md" onclick={() => engine.stop()}>
        <span class="text-[#090a0d] text-xs font-semibold">END SESSION</span>
      </button>

      <!-- Timer -->
      <div class="hidden md:flex gap-3 items-center">
        <svg class="bg-[#a9b4cc] rounded-xl" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#090a0d" viewBox="0 0 256 256"><path d="M208,96a12,12,0,1,1,12,12A12,12,0,0,1,208,96ZM196,72a12,12,0,1,0-12-12A12,12,0,0,0,196,72Zm28.66,56a8,8,0,0,0-8.63,7.31A88.12,88.12,0,1,1,120.66,40,8,8,0,0,0,119.34,24,104.12,104.12,0,1,0,232,136.66,8,8,0,0,0,224.66,128ZM128,56a72,72,0,1,1-72,72A72.08,72.08,0,0,1,128,56Zm-8,72a8,8,0,0,0,8,8h48a8,8,0,0,0,0-16H136V80a8,8,0,0,0-16,0Zm40-80a12,12,0,1,0-12-12A12,12,0,0,0,160,48Z"></path></svg>
        <div class="flex items-center h-[30px] bg-[#0f121a] px-4 rounded-md border-[#7e889c] border-2">
          <span class="text-[#ffffff] text-xs font-extrabold">
            {Math.floor(state.timeLeft / 60)}:{String(state.timeLeft % 60).padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="hidden md:flex flex-col md:flex-row gap-2 items-center">
      <div class="relative">
        <button class="cursor-pointer flex items-center p-1 px-4 border border-[#a9b4cc] gap-4 rounded-md">
          <span class="text-[#7e889c]">DIGIT</span>
          <div class="flex items-center gap-1">
            <span class="text-[#a9b4cc] font-medium">{state.settings.useVoice ? 'Voice' : 'Visual'}</span>
            <svg class="false" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Alt-Arrow-Down--Streamline-Solar" height="20" width="20"><g id="Bold Duotone/Arrows/Alt Arrow Down"><path id="Vector" fill="#4f79e8" d="M11.2929 8H5.5703c-0.52841 0 -0.77161 0.79094 -0.3704 1.20467l2.40658 2.48173L11.2929 8Z" stroke-width="1"></path><path id="Vector_2" fill="#a9b4cc" d="m8.30273 12.4044 3.32687 3.4307c0.2132 0.2198 0.5277 0.2198 0.7408 0l6.4297 -6.63043C19.2013 8.79094 18.9581 8 18.4297 8h-5.7226l-4.40437 4.4044Z" stroke-width="1"></path></g></svg>
          </div>
        </button>
      </div>

      <div class="relative">
        <button class="cursor-pointer flex items-center p-1 px-4 border border-[#a9b4cc] gap-4 rounded-md">
          <span class="text-[#7e889c]">ANSWER</span>
          <div class="flex items-center gap-1">
            <span class="text-[#a9b4cc] font-medium">{state.settings.useKeypad ? 'On-screen keypad' : 'Keyboard'}</span>
            <svg class="false" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Alt-Arrow-Down--Streamline-Solar" height="20" width="20"><g id="Bold Duotone/Arrows/Alt Arrow Down"><path id="Vector" fill="#4f79e8" d="M11.2929 8H5.5703c-0.52841 0 -0.77161 0.79094 -0.3704 1.20467l2.40658 2.48173L11.2929 8Z" stroke-width="1"></path><path id="Vector_2" fill="#a9b4cc" d="m8.30273 12.4044 3.32687 3.4307c0.2132 0.2198 0.5277 0.2198 0.7408 0l6.4297 -6.63043C19.2013 8.79094 18.9581 8 18.4297 8h-5.7226l-4.40437 4.4044Z" stroke-width="1"></path></g></svg>
          </div>
        </button>
      </div>

      <button class="cursor-pointer flex items-center p-1 px-4 border border-[#a9b4cc] gap-4 rounded-md">
        <span class="text-[#a9b4cc] font-medium">HISTORY</span>
      </button>

      <div class="relative hidden md:flex">
        <button aria-label="Open settings" class="cursor-pointer flex items-center justify-center p-1 px-2 border border-[#a9b4cc] rounded-md text-[#a9b4cc]">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M230.52,126.06,211.9,110.5c.09-1.5.1-3,.1-4.5s0-3-.1-4.5l18.62-15.56a8,8,0,0,0,2-10.13l-16-27.71a8,8,0,0,0-9.8-3.47l-23.22,9.35a77.87,77.87,0,0,0-7.8-4.5L172,23.54A8,8,0,0,0,164.13,16H131.87A8,8,0,0,0,124,23.54l-3.68,25.94a77.87,77.87,0,0,0-7.8,4.5L89.3,44.63a8,8,0,0,0-9.8,3.47l-16,27.71a8,8,0,0,0,2,10.13L84.1,101.5c-.09,1.5-.1,3-.1,4.5s0,3,.1,4.5L65.48,126.06a8,8,0,0,0-2,10.13l16,27.71a8,8,0,0,0,9.8,3.47l23.22-9.35a77.87,77.87,0,0,0,7.8,4.5L124,188.46a8,8,0,0,0,7.87,7.54h32.26a8,8,0,0,0,7.87-7.54l3.68-25.94a77.87,77.87,0,0,0,7.8-4.5l23.22,9.35a8,8,0,0,0,9.8-3.47l16-27.71A8,8,0,0,0,230.52,126.06ZM148,128a20,20,0,1,1-20-20A20,20,0,0,1,148,128Z"></path></svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Game area -->
  <div class="flex grow">
    <div class="flex grow md:pb-[122px] md:justify-center">
      <div class="relative flex grow select-none flex-col items-center justify-end gap-12 py-6 md:flex-row md:grow-0 md:justify-evenly md:gap-24">

        <!-- Streak bar -->
        <div class="relative flex flex-col items-center">
          <div class="flex md:flex-col w-[200px] md:w-auto md:h-[200px] overflow-hidden rounded-full gap-3">
            {#each [0, 1, 2, 3] as i}
              {#if i === 0}
                <div class="grow w-[10px] h-[10px] bg-[#4f79e8]"></div>
              {:else if i < 3}
                <div class="bg-[#0f121a] w-[10px] h-[10px]"></div>
              {:else}
                <div class="bg-[#0f121a] w-[10px] h-[10px] rounded-r-full md:rounded-r-none md:rounded-b-full"></div>
              {/if}
            {/each}
          </div>
          <span class="absolute top-full mt-12 hidden whitespace-nowrap text-xs font-medium text-[#a9b4cc] md:inline">
            <span class="font-extrabold">{state.correctStreak}</span> streak
          </span>
        </div>

        <!-- Center column -->
        <div class="flex flex-col justify-end gap-6 md:grow">
          <!-- Pause/Stop buttons + digit display -->
          <div class="flex flex-col items-center justify-center gap-6 md:flex-row md:gap-0">
            <div class="flex grow items-center justify-center gap-6 md:justify-end">
              <button class="flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-full bg-[#0f121a] hover:bg-[#090a0d] md:hidden" onclick={() => engine.pause()}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Pause--Streamline-Solar" height="20" width="20"><g id="Bold Duotone/Video Audio Sound/Pause"><path id="Vector" fill="#4f79e8" d="M14 6c0 -1.88562 0 -2.82843 0.5858 -3.41421C15.1716 2 16.1144 2 18 2c1.8856 0 2.8284 0 3.4142 0.58579C22 3.17157 22 4.11438 22 6v12c0 1.8856 0 2.8284 -0.5858 3.4142C20.8284 22 19.8856 22 18 22c-1.8856 0 -2.8284 0 -3.4142 -0.5858C14 20.8284 14 19.8856 14 18V6Z" stroke-width="1"></path><path id="Vector_2" fill="#a9b4cc" d="M2 6c0 -1.88562 0 -2.82843 0.58579 -3.41421C3.17157 2 4.11438 2 6 2c1.88562 0 2.82843 0 3.41421 0.58579C10 3.17157 10 4.11438 10 6v12c0 1.8856 0 2.8284 -0.58579 3.4142C8.82843 22 7.88562 22 6 22c-1.88562 0 -2.82843 0 -3.41421 -0.5858C2 20.8284 2 19.8856 2 18V6Z" stroke-width="1"></path></svg>
              </button>
              <div class="flex items-center gap-3">
                <span class="text-sm text-[#a9b4cc]">
                  {#if state.currentDigit !== null}
                    <span class="font-extrabold">{state.currentDigit}</span>
                  {/if}
                </span>
                {#if state.canAnswer}
                  <span class="hidden rounded-full bg-[#a9b4cc] px-2 py-1 text-sm text-[#090a0d] sm:inline-flex">Settled</span>
                {/if}
              </div>
              <button class="flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-full bg-[#0f121a] hover:bg-[#090a0d]" onclick={() => engine.stop()}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Stop--Streamline-Solar" height="20" width="20"><g id="Bold Duotone/Video Audio Sound/Stop"><path id="Vector" fill="#4f79e8" d="M3.46484 20.5359c1.46447 1.4645 3.82149 1.4645 8.53556 1.4645 4.714 0 7.071 0 8.5355 -1.4645 1.4645 -1.4645 1.4645 -3.8215 1.4645 -8.5355 0 -4.71407 0 -7.07109 -1.4645 -8.53556L3.46484 20.5359Z" stroke-width="1"></path><path id="Vector_2" fill="#a9b4cc" fill-rule="evenodd" d="M3.46447 3.46447C2 4.92893 2 7.28595 2 12c0 4.714 0 7.0711 1.46447 8.5355L20.5355 3.46447C19.0711 2 16.714 2 12 2 7.28595 2 4.92893 2 3.46447 3.46447Z" clip-rule="evenodd" stroke-width="1"></path></g></svg>
              </button>
            </div>
          </div>

          <!-- Keypad -->
          <div class="flex justify-center">
            <div class="flex flex-col gap-3 overflow-hidden">
              <!-- Row 1: empty + 2,3 -->
              <div class="flex flex-col md:flex-row gap-3">
                <div class="flex gap-3">
                  <div class="flex justify-center items-center py-6 w-[88px]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="#a9b4cc" viewBox="0 0 256 256"><path d="M168,32V224a8,8,0,0,1-12.91,6.31L85.25,176H40a16,16,0,0,1-16-16V96A16,16,0,0,1,40,80H85.25l69.84-54.31A8,8,0,0,1,168,32Zm32,64a8,8,0,0,0-8,8v48a8,8,0,0,0,16,0V104A8,8,0,0,0,200,96Z"></path></svg>
                  </div>
                  <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl cursor-pointer hover:bg-[#0f121a] border-[#0f121a]" onclick={() => handleKeypad(2)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">2</span></button>
                  <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl cursor-pointer hover:bg-[#0f121a] border-[#0f121a]" onclick={() => handleKeypad(3)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">3</span></button>
                </div>
                <div class="flex gap-3">
                  <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl cursor-pointer hover:bg-[#0f121a] border-[#0f121a]" onclick={() => handleKeypad(4)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">4</span></button>
                  <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl cursor-pointer hover:bg-[#0f121a] border-[#0f121a]" onclick={() => handleKeypad(5)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">5</span></button>
                  <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl cursor-pointer hover:bg-[#0f121a] border-[#0f121a]" onclick={() => handleKeypad(6)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">6</span></button>
                </div>
              </div>
              <!-- Row 2: 7,8,9 + 10,11,12 -->
              <div class="flex flex-col md:flex-row gap-3">
                <div class="flex gap-3">
                  <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl cursor-pointer hover:bg-[#0f121a] border-[#0f121a]" onclick={() => handleKeypad(7)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">7</span></button>
                  <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl cursor-pointer hover:bg-[#0f121a] border-[#0f121a]" onclick={() => handleKeypad(8)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">8</span></button>
                  <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl cursor-pointer hover:bg-[#0f121a] border-[#0f121a]" onclick={() => handleKeypad(9)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">9</span></button>
                </div>
                <div class="flex gap-3">
                  <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl cursor-pointer hover:bg-[#0f121a] border-[#0f121a]" onclick={() => handleKeypad(10)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">10</span></button>
                  <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl cursor-pointer hover:bg-[#0f121a] border-[#0f121a]" onclick={() => handleKeypad(11)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">11</span></button>
                  <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl cursor-pointer hover:bg-[#0f121a] border-[#0f121a]" onclick={() => handleKeypad(12)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">12</span></button>
                </div>
              </div>
              <!-- Row 3: 13,14,15 + 16,17,18 -->
              <div class="flex flex-col md:flex-row gap-3">
                <div class="flex gap-3">
                  <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl cursor-pointer hover:bg-[#0f121a] border-[#0f121a]" onclick={() => handleKeypad(13)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">13</span></button>
                  <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl cursor-pointer hover:bg-[#0f121a] border-[#0f121a]" onclick={() => handleKeypad(14)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">14</span></button>
                  <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl cursor-pointer hover:bg-[#0f121a] border-[#0f121a]" onclick={() => handleKeypad(15)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">15</span></button>
                </div>
                <div class="flex gap-3">
                  <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl cursor-pointer hover:bg-[#0f121a] border-[#0f121a]" onclick={() => handleKeypad(16)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">16</span></button>
                  <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl cursor-pointer hover:bg-[#0f121a] border-[#0f121a]" onclick={() => handleKeypad(17)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">17</span></button>
                  <button class="flex select-none justify-center py-6 w-[88px] border-2 border-[#0f121a] rounded-2xl cursor-pointer hover:bg-[#0f121a] border-[#0f121a]" onclick={() => handleKeypad(18)}><span class="select-none text-[#4f79e8] text-4xl font-extrabold">18</span></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
