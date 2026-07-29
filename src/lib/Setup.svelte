<script lang="ts">
  import SettingsPanel from './SettingsPanel.svelte';
  import type { Engine, GameState } from '$lib/engine';
  let { engine }: { engine: Engine } = $props();
  let state = $state<GameState>(engine.getState());
  let settingsOpen = $state(false);
  $effect(() => {
    return engine.subscribe((s) => { state = s; });
  });

  function handleDuration(minutes: number) {
    engine.updateSettings({ timer: Math.round(minutes * 60) });
  }

  function handleStartingInterval(val: number) {
    engine.updateSettings({ startingInterval: val * 1000 });
  }

  function handleMinimumInterval(val: number) {
    engine.updateSettings({ minimumInterval: val * 1000 });
  }

  function handleIntervalMode(intervalMode: 'adaptive' | 'fixed') {
    engine.updateSettings({ intervalMode });
  }

  function handleAdaptationMode(adaptationMode: 'responsive' | 'classic') {
    engine.updateSettings({ adaptationMode });
  }
</script>

<div class="flex flex-col justify-center grow gap-18">
  <div class="flex flex-col md:flex-row gap-18 items-center grow">
    <div class="flex flex-col gap-9">
      <!-- Pacing is independent from the Regular / 2-back / Variable task mode. -->
      <div class="flex flex-col items-start gap-4">
        <span class="text-sm text-[#7e889c]">PACING</span>
        <div class="inline-flex rounded-xl bg-[#0f121a] p-1" role="group" aria-label="Interval pacing">
          <button
            type="button"
            aria-pressed={state.settings.intervalMode === 'adaptive'}
            class="cursor-pointer rounded-lg px-5 py-3 text-sm font-semibold transition-colors {state.settings.intervalMode === 'adaptive' ? 'bg-[#10b981] text-[#090a0d]' : 'text-[#a9b4cc] hover:bg-[#121621]'}"
            onclick={() => handleIntervalMode('adaptive')}
          >Adaptive</button>
          <button
            type="button"
            aria-pressed={state.settings.intervalMode === 'fixed'}
            class="cursor-pointer rounded-lg px-5 py-3 text-sm font-semibold transition-colors {state.settings.intervalMode === 'fixed' ? 'bg-[#10b981] text-[#090a0d]' : 'text-[#a9b4cc] hover:bg-[#121621]'}"
            onclick={() => handleIntervalMode('fixed')}
          >Fixed</button>
        </div>
      </div>

      {#if state.settings.intervalMode === 'adaptive'}
        <div class="flex flex-col items-start gap-4">
          <span class="text-sm text-[#7e889c]">ADAPTATION STEP</span>
          <div class="inline-flex rounded-xl bg-[#0f121a] p-1" role="group" aria-label="Adaptive interval step">
            <button
              type="button"
              aria-pressed={state.settings.adaptationMode === 'responsive'}
              class="cursor-pointer rounded-lg px-5 py-3 text-sm font-semibold transition-colors {state.settings.adaptationMode === 'responsive' ? 'bg-[#10b981] text-[#090a0d]' : 'text-[#a9b4cc] hover:bg-[#121621]'}"
              onclick={() => handleAdaptationMode('responsive')}
            >Responsive</button>
            <button
              type="button"
              aria-pressed={state.settings.adaptationMode === 'classic'}
              class="cursor-pointer rounded-lg px-5 py-3 text-sm font-semibold transition-colors {state.settings.adaptationMode === 'classic' ? 'bg-[#10b981] text-[#090a0d]' : 'text-[#a9b4cc] hover:bg-[#121621]'}"
              onclick={() => handleAdaptationMode('classic')}
            >Classic (0.10s)</button>
          </div>
        </div>
      {/if}

      <div class="flex flex-col md:flex-row gap-9">
        <!-- Duration -->
        <div class="flex flex-col items-start gap-4">
          <span class="text-sm text-[#7e889c]">DURATION</span>
          <div class="flex overflow-hidden rounded-xl">
            <input aria-label="Duration in minutes" class="bg-[#0f121a] p-2 text-center text-xl font-medium text-white [appearance:textfield] focus:outline-none w-[100px] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" type="text" inputmode="decimal" spellcheck="false" value={(state.settings.timer / 60).toFixed(2).replace(/\.?0+$/, "")} onchange={(e) => handleDuration(parseFloat((e.target as HTMLInputElement).value))} onkeydown={(e) => { if (e.key === "Escape") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }} />
            <div class="flex gap-2 bg-[#0f121a] p-2 pl-0">
              {#each [5, 10, 15, 30, 60] as preset}
                <button type="button" class="cursor-pointer bg-[#a9b4cc] p-2 rounded-md" onmousedown={(e) => e.preventDefault()} onclick={() => handleDuration(preset)}>
                  <span class="text-[#0f121a] text-sm font-bold">{preset}</span>
                </button>
              {/each}
            </div>
          </div>
        </div>

        <!-- Starting interval becomes the only interval in Fixed pacing. -->
        <div class="flex flex-col items-start gap-4">
          <span class="text-sm text-[#7e889c]">{state.settings.intervalMode === 'fixed' ? 'INTERVAL' : 'STARTING INTERVAL'}</span>
          <div class="flex overflow-hidden rounded-xl">
            <input aria-label={state.settings.intervalMode === 'fixed' ? 'Fixed interval in seconds' : 'Starting interval in seconds'} class="bg-[#0f121a] p-2 text-center text-xl font-medium text-white [appearance:textfield] focus:outline-none w-[100px] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" type="text" inputmode="decimal" spellcheck="false" value={(state.settings.startingInterval / 1000).toFixed(2).replace(/\.?0+$/, "")} onchange={(e) => handleStartingInterval(parseFloat((e.target as HTMLInputElement).value))} onkeydown={(e) => { if (e.key === "Escape") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }} />
            <div class="flex gap-2 bg-[#0f121a] p-2 pl-0">
              {#each [0.5, 1, 2, 3, 5] as preset}
                <button type="button" class="cursor-pointer bg-[#a9b4cc] p-2 rounded-md" onmousedown={(e) => e.preventDefault()} onclick={() => handleStartingInterval(preset)}>
                  <span class="text-[#0f121a] text-sm font-bold">{preset}</span>
                </button>
              {/each}
            </div>
          </div>
        </div>

        {#if state.settings.intervalMode === 'adaptive'}
          <!-- Minimum interval only applies while pacing adapts. -->
          <div class="flex flex-col items-start gap-4">
            <span class="text-sm text-[#7e889c]">MINIMUM INTERVAL</span>
            <div class="flex overflow-hidden rounded-xl">
              <input aria-label="Minimum interval in seconds" class="bg-[#0f121a] p-2 text-center text-xl font-medium text-white [appearance:textfield] focus:outline-none w-[100px] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" type="text" inputmode="decimal" spellcheck="false" value={(state.settings.minimumInterval / 1000).toFixed(2).replace(/\.?0+$/, "")} onchange={(e) => handleMinimumInterval(parseFloat((e.target as HTMLInputElement).value))} onkeydown={(e) => { if (e.key === "Escape") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }} />
              <div class="flex gap-2 bg-[#0f121a] p-2 pl-0">
                {#each [0.5, 1, 2, 3, 5] as preset}
                  <button type="button" class="cursor-pointer bg-[#a9b4cc] p-2 rounded-md" onmousedown={(e) => e.preventDefault()} onclick={() => handleMinimumInterval(preset)}>
                    <span class="text-[#0f121a] text-sm font-bold">{preset}</span>
                  </button>
                {/each}
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Bottom section -->
  <div class="flex flex-col items-center gap-4 pb-12 md:pb-0">
    <button class="cursor-pointer flex justify-center items-center gap-3 bg-[#10b981] hover:opacity-75 py-5 px-16 rounded-full" onclick={() => engine.start()}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="h-5 w-5 text-[#090a0d]"><path d="M8 5v14l11-7z"/></svg>
      <span class="text-[#090a0d] font-semibold text-lg">Start session</span>
    </button>

    <div class="flex flex-wrap justify-center gap-x-6 gap-y-1 pt-4 text-sm">
      <a href="https://discord.com/invite/brain" target="_blank" rel="noreferrer" class="group flex flex-wrap items-center justify-center gap-x-2 text-[#7e889c] hover:text-[#a9b4cc]">
        <span>Mindbuilding Discord:</span>
        <span class="text-[#a9b4cc] group-hover:text-[#ffffff]">discord.gg/brain</span>
      </a>
      <a href="https://github.com/SafEight/docct" target="_blank" rel="noreferrer" class="group flex items-center justify-center gap-x-2 text-[#7e889c] hover:text-[#a9b4cc]">
        <span>GitHub:</span>
        <span class="text-[#a9b4cc] group-hover:text-[#ffffff]">SafEight/docct</span>
      </a>
    </div>

    <!-- Mobile settings gear -->
    <div class="flex pt-2 md:hidden">
      <button aria-label="Open settings" class="cursor-pointer flex items-center justify-center p-1 px-4 border border-[#a9b4cc] rounded-md text-[#a9b4cc] gap-4" onclick={() => settingsOpen = !settingsOpen}>
        <span class="text-[#a9b4cc] font-medium">SETTINGS</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M230.52,126.06,211.9,110.5c.09-1.5.1-3,.1-4.5s0-3-.1-4.5l18.62-15.56a8,8,0,0,0,2-10.13l-16-27.71a8,8,0,0,0-9.8-3.47l-23.22,9.35a77.87,77.87,0,0,0-7.8-4.5L172,23.54A8,8,0,0,0,164.13,16H131.87A8,8,0,0,0,124,23.54l-3.68,25.94a77.87,77.87,0,0,0-7.8,4.5L89.3,44.63a8,8,0,0,0-9.8,3.47l-16,27.71a8,8,0,0,0,2,10.13L84.1,101.5c-.09,1.5-.1,3-.1,4.5s0,3,.1,4.5L65.48,126.06a8,8,0,0,0-2,10.13l16,27.71a8,8,0,0,0,9.8,3.47l23.22,9.35a77.87,77.87,0,0,0,7.8,4.5L124,188.46a8,8,0,0,0,7.87,7.54h32.26a8,8,0,0,0,7.87-7.54l3.68-25.94a77.87,77.87,0,0,0,7.8-4.5l23.22,9.35a8,8,0,0,0,9.8-3.47l16-27.71A8,8,0,0,0,230.52,126.06ZM148,128a20,20,0,1,1-20-20A20,20,0,0,1,148,128Z"></path></svg>
      </button>
    </div>
    {#if settingsOpen}
      <SettingsPanel {engine} close={() => settingsOpen = false} mobileFloating />
    {/if}
  </div>
</div>
