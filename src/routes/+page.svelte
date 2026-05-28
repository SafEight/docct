<script lang="ts">
  import { createEngine, type GameState } from '$lib/engine';
  import Onboarding from '$lib/Onboarding.svelte';
  import Setup from '$lib/Setup.svelte';
  import ActiveSession from '$lib/ActiveSession.svelte';
  import SessionComplete from '$lib/SessionComplete.svelte';
  import SettingsPanel from '$lib/SettingsPanel.svelte';
  import HistoryPanel from '$lib/HistoryPanel.svelte';

  const engine = createEngine();
  let state = $state<GameState>(engine.getState());
  let settingsOpen = $state(false);
  let historyOpen = $state(false);
  let digitDropdownOpen = $state(false);
  let answerDropdownOpen = $state(false);

  $effect(() => {
    return engine.subscribe((s) => { state = s; });
  });

  const isActive = $derived(state.phase === 'active' || state.phase === 'paused');
  const isSetup = $derived(state.phase === 'setup' || state.phase === 'onboarding');

  function formatTime(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="fixed flex w-full h-full z-2 overflow-auto">
  <!-- Onboarding overlay (sibling, positioned fixed) -->
  {#if state.phase === 'onboarding'}
    <Onboarding {engine} />
  {/if}

  <!-- Main layout (direct child of root) -->
  <div class="flex flex-col grow md:px-6 md:items-center">
    <!-- Header bar -->
    <div class="md:flex md:py-6 justify-between gap-2 w-full max-w-7xl">
      <!-- Left side: timer -->
      <div class="hidden md:flex gap-6 items-center">
        {#if isActive}
          <button class="cursor-pointer flex gap-2 items-center bg-[#a9b4cc] hover:bg-[#ffffff] p-1 px-4 rounded-md" onclick={() => engine.stop()}>
            <span class="text-[#090a0d] text-xs font-semibold">END SESSION</span>
          </button>
        {/if}
        <!-- Timer (always visible on desktop) -->
        <div class="hidden md:flex gap-3 items-center">
          <svg class="bg-[#a9b4cc] rounded-xl" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#090a0d" viewBox="0 0 256 256"><path d="M208,96a12,12,0,1,1,12,12A12,12,0,0,1,208,96ZM196,72a12,12,0,1,0-12-12A12,12,0,0,0,196,72Zm28.66,56a8,8,0,0,0-8.63,7.31A88.12,88.12,0,1,1,120.66,40,8,8,0,0,0,119.34,24,104.12,104.12,0,1,0,232,136.66,8,8,0,0,0,224.66,128ZM128,56a72,72,0,1,1-72,72A72.08,72.08,0,0,1,128,56Zm-8,72a8,8,0,0,0,8,8h48a8,8,0,0,0,0-16H136V80a8,8,0,0,0-16,0Zm40-80a12,12,0,1,0-12-12A12,12,0,0,0,160,48Z"></path></svg>
          <div class="flex items-center h-[30px] bg-[#0f121a] px-4 rounded-md border-[#7e889c] border-2">
            <span class="text-[#ffffff] text-xs font-extrabold">{formatTime(state.timeLeft)}</span>
          </div>
        </div>
      </div>

      <!-- Right side -->
      <div class="flex pt-6 pb-4 md:pt-0 md:pb-0 md:flex flex-col md:flex-row gap-2 items-center">
          <!-- DIGIT dropdown -->
          <div class="relative">
            <button class="cursor-pointer flex items-center p-1 px-4 border border-[#a9b4cc] gap-4 rounded-md" onclick={() => { digitDropdownOpen = !digitDropdownOpen; answerDropdownOpen = false; }}>
              <span class="text-[#7e889c]">DIGIT</span>
              <div class="flex items-center gap-1">
                <span class="text-[#a9b4cc] font-medium">{state.settings.useVoice ? 'Voice' : 'Visual'}</span>
                <svg class="{digitDropdownOpen ? 'rotate-[-90deg] transition-rotate duration-[0.1s]' : ''}" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="20" width="20"><g><path fill="#4f79e8" d="M11.2929 8H5.5703c-0.52841 0 -0.77161 0.79094 -0.3704 1.20467l2.40658 2.48173L11.2929 8Z" stroke-width="1"></path><path fill="#a9b4cc" d="m8.30273 12.4044 3.32687 3.4307c0.2132 0.2198 0.5277 0.2198 0.7408 0l6.4297 -6.63043C19.2013 8.79094 18.9581 8 18.4297 8h-5.7226l-4.40437 4.4044Z" stroke-width="1"></path></g></svg>
              </div>
            </button>
            {#if digitDropdownOpen}
              <div class="absolute flex top-[30px] left-0 w-full pt-3 z-2">
                <div class="flex grow flex-col bg-[#a9b4cc] p-1 rounded-md">
                  <button class="group hover:bg-[#000000] rounded-md cursor-pointer flex p-2 justify-end" onclick={() => { engine.updateSettings({ useVoice: true }); digitDropdownOpen = false; }}>
                    <span class="text-[#090a0d] group-hover:text-[#a9b4cc] font-medium">Voice</span>
                  </button>
                  <button class="group hover:bg-[#000000] rounded-md cursor-pointer flex p-2 justify-end" onclick={() => { engine.updateSettings({ useVoice: false }); digitDropdownOpen = false; }}>
                    <span class="text-[#090a0d] group-hover:text-[#a9b4cc] font-medium">Visual</span>
                  </button>
                </div>
              </div>
            {/if}
          </div>

          <!-- ANSWER dropdown -->
          <div class="relative">
            <button class="cursor-pointer flex items-center p-1 px-4 border border-[#a9b4cc] gap-4 rounded-md" onclick={() => { answerDropdownOpen = !answerDropdownOpen; digitDropdownOpen = false; }}>
              <span class="text-[#7e889c]">ANSWER</span>
              <div class="flex items-center gap-1">
                <span class="text-[#a9b4cc] font-medium">{state.settings.useKeypad ? 'On-screen keypad' : 'Keyboard'}</span>
                <svg class="{answerDropdownOpen ? 'rotate-[-90deg] transition-rotate duration-[0.1s]' : ''}" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="20" width="20"><g><path fill="#4f79e8" d="M11.2929 8H5.5703c-0.52841 0 -0.77161 0.79094 -0.3704 1.20467l2.40658 2.48173L11.2929 8Z" stroke-width="1"></path><path fill="#a9b4cc" d="m8.30273 12.4044 3.32687 3.4307c0.2132 0.2198 0.5277 0.2198 0.7408 0l6.4297 -6.63043C19.2013 8.79094 18.9581 8 18.4297 8h-5.7226l-4.40437 4.4044Z" stroke-width="1"></path></g></svg>
              </div>
            </button>
            {#if answerDropdownOpen}
              <div class="absolute flex top-[30px] left-0 w-full pt-3 z-2">
                <div class="flex grow flex-col bg-[#a9b4cc] p-1 rounded-md">
                  <button class="group hover:bg-[#000000] rounded-md cursor-pointer flex p-2 justify-end" onclick={() => { engine.updateSettings({ useKeypad: true }); answerDropdownOpen = false; }}>
                    <span class="text-[#090a0d] group-hover:text-[#a9b4cc] font-medium">On-screen keypad</span>
                  </button>
                  <button class="group hover:bg-[#000000] rounded-md cursor-pointer flex p-2 justify-end" onclick={() => { engine.updateSettings({ useKeypad: false }); answerDropdownOpen = false; }}>
                    <span class="text-[#090a0d] group-hover:text-[#a9b4cc] font-medium">Keyboard</span>
                  </button>
                </div>
              </div>
            {/if}
          </div>

        <!-- HISTORY button (always visible) -->
        <button class="cursor-pointer flex items-center p-1 px-4 border border-[#a9b4cc] gap-4 rounded-md" onclick={() => historyOpen = !historyOpen}>
          <span class="text-[#a9b4cc] font-medium">HISTORY</span>
        </button>

        <!-- Settings gear (desktop) -->
        <div class="relative hidden md:flex">
          <button aria-label="Open settings" class="cursor-pointer flex items-center justify-center p-1 px-2 border border-[#a9b4cc] rounded-md text-[#a9b4cc]" onclick={() => settingsOpen = !settingsOpen}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M230.52,126.06,211.9,110.5c.09-1.5.1-3,.1-4.5s0-3-.1-4.5l18.62-15.56a8,8,0,0,0,2-10.13l-16-27.71a8,8,0,0,0-9.8-3.47l-23.22,9.35a77.87,77.87,0,0,0-7.8-4.5L172,23.54A8,8,0,0,0,164.13,16H131.87A8,8,0,0,0,124,23.54l-3.68,25.94a77.87,77.87,0,0,0-7.8,4.5L89.3,44.63a8,8,0,0,0-9.8,3.47l-16,27.71a8,8,0,0,0,2,10.13L84.1,101.5c-.09,1.5-.1,3-.1,4.5s0,3,.1,4.5L65.48,126.06a8,8,0,0,0-2,10.13l16,27.71a8,8,0,0,0,9.8,3.47l23.22,9.35a77.87,77.87,0,0,0,7.8,4.5L124,188.46a8,8,0,0,0,7.87,7.54h32.26a8,8,0,0,0,7.87-7.54l3.68-25.94a77.87,77.87,0,0,0,7.8-4.5l23.22,9.35a8,8,0,0,0,9.8-3.47l16-27.71A8,8,0,0,0,230.52,126.06ZM148,128a20,20,0,1,1-20-20A20,20,0,0,1,148,128Z"></path></svg>
          </button>
          {#if settingsOpen}
            <SettingsPanel {engine} close={() => settingsOpen = false} />
          {/if}
        </div>
      </div>
    </div>

    <!-- Content area -->
    <div class="flex grow">
      <div class="flex grow md:pb-[122px] md:justify-center">
        {#if state.phase === 'onboarding'}
          <Setup {engine} />
        {:else if state.phase === 'setup'}
          <Setup {engine} />
        {:else if state.phase === 'active' || state.phase === 'paused'}
          <ActiveSession {engine} />
        {:else if state.phase === 'complete'}
          <SessionComplete {engine} onHistory={() => historyOpen = true} />
        {/if}
      </div>
    </div>
  </div>

  <!-- History panel (fixed overlay, sibling of main layout) -->
  {#if historyOpen}
    <HistoryPanel {engine} close={() => historyOpen = false} />
  {/if}
</div>
