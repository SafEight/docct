<script lang="ts">
  import type { Engine, GameState } from '$lib/engine';
  import SettingsPanel from '$lib/SettingsPanel.svelte';
  import HistoryPanel from '$lib/HistoryPanel.svelte';

  let { engine }: { engine: Engine } = $props();

  let state = $state<GameState>(engine.getState());
  let showSettings = $state(false);
  let showHistory = $state(false);
  let digitDropdownOpen = $state(false);
  let answerDropdownOpen = $state(false);

  $effect(() => {
    return engine.subscribe((s) => { state = s; });
  });

  let displayTimer = $derived(() => {
    const total = state.settings.timer;
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  function handleTimerInput(e: Event) {
    const val = parseInt((e.target as HTMLInputElement).value);
    if (!isNaN(val) && val > 0) {
      engine.updateSettings({ timer: val });
    }
  }

  function selectDuration(minutes: number) {
    engine.updateSettings({ timer: minutes * 60 });
  }

  function handleStartingInterval(val: number) {
    engine.updateSettings({ startingInterval: val });
  }

  function handleMinimumInterval(val: number) {
    engine.updateSettings({ minimumInterval: val });
  }

  function handleDigitMode(mode: 'voice' | 'visual') {
    engine.updateSettings({ useVoice: mode === 'voice' });
    digitDropdownOpen = false;
  }

  function handleAnswerMode(mode: 'keypad' | 'keyboard') {
    engine.updateSettings({ useKeypad: mode === 'keypad' });
    answerDropdownOpen = false;
  }

  function closeDropdowns() {
    digitDropdownOpen = false;
    answerDropdownOpen = false;
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="fixed flex w-full h-full z-2 overflow-auto bg-[#090a0d]" onclick={closeDropdowns} role="application">
  <div class="flex flex-col w-full">
    <!-- Top bar -->
    <div class="flex items-center justify-between p-4 md:px-6 md:py-4">
      <!-- Timer display (left) -->
      <div class="flex items-center gap-3">
        <div class="bg-[#a9b4cc] rounded-xl p-1 flex items-center justify-center w-8 h-8">
          <svg width="24" height="24" viewBox="0 0 256 256" fill="#090a0d">
            <rect x="112" y="40" width="32" height="16" rx="8"/>
            <rect x="120" y="56" width="16" height="16" rx="0"/>
            <path d="M128,24a104,104,0,1,0,104,104A104.12,104.12,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88,88,0,0,1,128,216Z"/>
            <circle cx="128" cy="136" r="8"/>
          </svg>
        </div>
        <div class="bg-[#0f121a] px-4 py-2 rounded-md border-2 border-[#7e889c]">
          <input
            type="text"
            value={displayTimer()}
            onchange={handleTimerInput}
            class="bg-transparent text-white text-lg font-medium w-16 text-center outline-none border-none font-mono"
            placeholder="MM:SS"
          />
        </div>
      </div>

      <!-- Center controls (desktop: center, mobile: spread) -->
      <div class="hidden md:flex items-center gap-4">
        <!-- DIGIT dropdown -->
        <div class="relative">
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="flex flex-col items-center cursor-pointer" role="button" tabindex="0" onclick={(e) => { e.stopPropagation(); digitDropdownOpen = !digitDropdownOpen; }}>
            <span class="text-[#7e889c] text-xs font-medium tracking-wider">DIGIT</span>
            <div class="flex items-center gap-1 text-[#ffffff] text-sm">
              <span>{state.settings.useVoice ? 'Voice' : 'Visual'}</span>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M12 16L6 10H18L12 16Z" fill="#4f79e8"/>
              </svg>
            </div>
          </div>
          {#if digitDropdownOpen}
            <div class="absolute right-0 top-full mt-1 bg-[#000000] rounded-lg border border-[#a9b4cc] overflow-hidden z-50 shadow-2xl min-w-[120px]">
              <button class="w-full px-4 py-2 text-left text-sm {state.settings.useVoice ? 'text-[#4f79e8]' : 'text-[#a9b4cc]'} hover:bg-[#121621]" onclick={(e) => { e.stopPropagation(); handleDigitMode('voice'); }}>Voice</button>
              <button class="w-full px-4 py-2 text-left text-sm {!state.settings.useVoice ? 'text-[#4f79e8]' : 'text-[#a9b4cc]'} hover:bg-[#121621]" onclick={(e) => { e.stopPropagation(); handleDigitMode('visual'); }}>Visual</button>
            </div>
          {/if}
        </div>

        <!-- ANSWER dropdown -->
        <div class="relative">
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="flex flex-col items-center cursor-pointer" role="button" tabindex="0" onclick={(e) => { e.stopPropagation(); answerDropdownOpen = !answerDropdownOpen; }}>
            <span class="text-[#7e889c] text-xs font-medium tracking-wider">ANSWER</span>
            <div class="flex items-center gap-1 text-[#ffffff] text-sm">
              <span>{state.settings.useKeypad ? 'On-screen keypad' : 'Keyboard'}</span>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M12 16L6 10H18L12 16Z" fill="#4f79e8"/>
              </svg>
            </div>
          </div>
          {#if answerDropdownOpen}
            <div class="absolute right-0 top-full mt-1 bg-[#000000] rounded-lg border border-[#a9b4cc] overflow-hidden z-50 shadow-2xl min-w-[160px]">
              <button class="w-full px-4 py-2 text-left text-sm {state.settings.useKeypad ? 'text-[#4f79e8]' : 'text-[#a9b4cc]'} hover:bg-[#121621]" onclick={(e) => { e.stopPropagation(); handleAnswerMode('keypad'); }}>On-screen keypad</button>
              <button class="w-full px-4 py-2 text-left text-sm {!state.settings.useKeypad ? 'text-[#4f79e8]' : 'text-[#a9b4cc]'} hover:bg-[#121621]" onclick={(e) => { e.stopPropagation(); handleAnswerMode('keyboard'); }}>Keyboard</button>
            </div>
          {/if}
        </div>

        <!-- HISTORY button -->
        <button class="flex flex-col items-center cursor-pointer group" onclick={(e) => { e.stopPropagation(); showHistory = !showHistory; showSettings = false; }}>
          <span class="text-[#7e889c] text-xs font-medium tracking-wider group-hover:text-[#a9b4cc]">HISTORY</span>
        </button>

        <!-- Settings gear -->
        <button class="flex items-center justify-center w-10 h-10 cursor-pointer text-[#a9b4cc] hover:text-[#ffffff]" aria-label="Settings" onclick={(e) => { e.stopPropagation(); showSettings = !showSettings; showHistory = false; }}>
          <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
            <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,64a16,16,0,1,1,16-16A16,16,0,0,1,128,144Z"/>
            <path d="M215.58,147.17l-15.71-9a79.59,79.59,0,0,0,0-22.34l15.71-9a8,8,0,0,0,2.91-10.92l-16-27.71a8,8,0,0,0-10.92-2.91l-15.71,9a79.59,79.59,0,0,0-19.34-11.24V56a8,8,0,0,0-8-8H124.29a8,8,0,0,0-8,8v18.91a79.59,79.59,0,0,0-19.34,11.24l-15.71-9a8,8,0,0,0-10.92,2.91l-16,27.71a8,8,0,0,0,2.91,10.92l15.71,9a79.59,79.59,0,0,0,0,22.34l-15.71,9a8,8,0,0,0-2.91,10.92l16,27.71a8,8,0,0,0,10.92,2.91l15.71-9a79.59,79.59,0,0,0,19.34,11.24V200a8,8,0,0,0,8,8h32.58a8,8,0,0,0,8-8V181.09a79.59,79.59,0,0,0,19.34-11.24l15.71,9a8,8,0,0,0,10.92-2.91l16-27.71A8,8,0,0,0,215.58,147.17ZM128,176a32,32,0,1,1,32-32A32,32,0,0,1,128,176Z"/>
          </svg>
        </button>
      </div>

      <!-- Mobile: just gear + history -->
      <div class="flex md:hidden items-center gap-3">
        <button class="flex flex-col items-center cursor-pointer text-[#7e889c]" onclick={(e) => { e.stopPropagation(); showHistory = !showHistory; showSettings = false; }}>
          <span class="text-xs font-medium tracking-wider">HISTORY</span>
        </button>
        <button class="flex items-center justify-center w-10 h-10 cursor-pointer text-[#a9b4cc]" aria-label="Settings" onclick={(e) => { e.stopPropagation(); showSettings = !showSettings; showHistory = false; }}>
          <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
            <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,64a16,16,0,1,1,16-16A16,16,0,0,1,128,144Z"/>
            <path d="M215.58,147.17l-15.71-9a79.59,79.59,0,0,0,0-22.34l15.71-9a8,8,0,0,0,2.91-10.92l-16-27.71a8,8,0,0,0-10.92-2.91l-15.71,9a79.59,79.59,0,0,0-19.34-11.24V56a8,8,0,0,0-8-8H124.29a8,8,0,0,0-8,8v18.91a79.59,79.59,0,0,0-19.34,11.24l-15.71-9a8,8,0,0,0-10.92,2.91l-16,27.71a8,8,0,0,0,2.91,10.92l15.71,9a79.59,79.59,0,0,0,0,22.34l-15.71,9a8,8,0,0,0-2.91,10.92l16,27.71a8,8,0,0,0,10.92,2.91l15.71-9a79.59,79.59,0,0,0,19.34,11.24V200a8,8,0,0,0,8,8h32.58a8,8,0,0,0,8-8V181.09a79.59,79.59,0,0,0,19.34-11.24l15.71,9a8,8,0,0,0,10.92-2.91l16-27.71A8,8,0,0,0,215.58,147.17ZM128,176a32,32,0,1,1,32-32A32,32,0,0,1,128,176Z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Main content -->
    <div class="flex flex-col items-center flex-1 px-4 md:px-6 gap-8 pb-4">
      <!-- Duration selector -->
      <div class="flex gap-6 justify-center items-center">
        {#each [5, 10, 15] as duration}
          <button
            class="w-[80px] h-[80px] rounded-xl flex flex-col justify-center items-center gap-2 cursor-pointer border {state.settings.timer === duration * 60 ? 'bg-[#a9b4cc] text-[#090a0d]' : 'text-[#a9b4cc] border-[#7e889c]'}"
            onclick={() => selectDuration(duration)}
          >
            <span class="text-2xl font-bold">{duration}</span>
            <span class="text-xs font-medium">MINUTES</span>
          </button>
        {/each}
      </div>

      <!-- Interval fields -->
      <div class="flex flex-col md:flex-row gap-9">
        <!-- Starting interval -->
        <div class="flex flex-col gap-2">
          <span class="text-[#7e889c] text-xs font-medium tracking-wider">STARTING INTERVAL</span>
          <div class="flex items-center gap-2">
            <input
              type="number"
              value={(state.settings.startingInterval / 1000).toFixed(1)}
              onchange={(e) => handleStartingInterval(parseFloat((e.target as HTMLInputElement).value) * 1000)}
              class="bg-[#0f121a] p-2 w-[100px] text-xl font-medium text-white rounded-md border border-[#7e889c] outline-none text-center"
            />
            <div class="flex gap-1">
              {#each [0.5, 1, 2, 3, 5] as preset}
                <button
                  class="bg-[#a9b4cc] p-2 rounded-md text-xs font-medium text-[#090a0d] hover:bg-[#ffffff] cursor-pointer min-w-[32px]"
                  onclick={() => handleStartingInterval(preset * 1000)}
                >
                  {preset}
                </button>
              {/each}
            </div>
          </div>
        </div>

        <!-- Minimum interval -->
        <div class="flex flex-col gap-2">
          <span class="text-[#7e889c] text-xs font-medium tracking-wider">MINIMUM INTERVAL</span>
          <div class="flex items-center gap-2">
            <input
              type="number"
              value={(state.settings.minimumInterval / 1000).toFixed(1)}
              onchange={(e) => handleMinimumInterval(parseFloat((e.target as HTMLInputElement).value) * 1000)}
              class="bg-[#0f121a] p-2 w-[100px] text-xl font-medium text-white rounded-md border border-[#7e889c] outline-none text-center"
            />
            <div class="flex gap-1">
              {#each [0.5, 1, 2, 3, 5] as preset}
                <button
                  class="bg-[#a9b4cc] p-2 rounded-md text-xs font-medium text-[#090a0d] hover:bg-[#ffffff] cursor-pointer min-w-[32px]"
                  onclick={() => handleMinimumInterval(preset * 1000)}
                >
                  {preset}
                </button>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom section with start button -->
    <div class="flex flex-col p-6 pb-12 bg-[#0f121a] items-center gap-4">
      <button
        class="bg-[#4f79e8] hover:opacity-75 py-6 px-18 rounded-full border flex items-center gap-3 cursor-pointer transition-opacity"
        onclick={() => engine.start()}
      >
        <div class="bg-[#0f121a] p-1 rounded-md flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#4f79e8">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
        </div>
        <span class="text-[#0f121a] font-semibold text-lg">Start session</span>
      </button>

      <a
        href="https://discord.gg/brain"
        target="_blank"
        rel="noopener noreferrer"
        class="text-[#7e889c] hover:text-[#a9b4cc] text-sm transition-colors"
      >
        Mindbuilding Discord: discord.gg/brain
      </a>
    </div>
  </div>

  <!-- Settings Panel -->
  {#if showSettings}
    <SettingsPanel {engine} on:close={() => showSettings = false} />
  {/if}

  <!-- History Panel -->
  {#if showHistory}
    <HistoryPanel {engine} on:close={() => showHistory = false} />
  {/if}
</div>
