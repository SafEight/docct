<script lang="ts">
  import type { Engine, GameState } from '$lib/engine';
  import { createEventDispatcher } from 'svelte';

  let { engine }: { engine: Engine } = $props();
  let state = $state<GameState>(engine.getState());
  const dispatch = createEventDispatcher();

  $effect(() => {
    return engine.subscribe((s) => { state = s; });
  });

  function setTaskMode(mode: '1-back' | '2-back' | 'variable') {
    engine.updateSettings({ taskMode: mode });
  }

  function setVoicePack(pack: 'rose' | 'rose_fast' | 'jenny') {
    engine.updateSettings({ voicePack: pack });
  }

  function toggleBeep() {
    engine.updateSettings({ beepOnIncorrect: !state.settings.beepOnIncorrect });
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="absolute right-0 top-[42px] w-[220px] bg-[#0f121a] rounded-xl border border-[#a9b4cc] shadow-2xl z-50 overflow-hidden" onclick={(e) => e.stopPropagation()}>
  <div class="p-4 flex flex-col gap-4">
    <!-- Close button -->
    <button class="absolute top-3 right-3 text-[#7e889c] hover:text-white cursor-pointer" aria-label="Close settings" onclick={() => dispatch('close')}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.3 5.71a1 1 0 0 0-1.42 0L12 10.59 7.12 5.71A1 1 0 0 0 5.7 7.12L10.59 12l-4.88 4.88a1 1 0 0 0 1.42 1.42L12 13.41l4.88 4.88a1 1 0 0 0 1.42-1.42L13.41 12l4.88-4.88a1 1 0 0 0 0-1.41z"/>
      </svg>
    </button>

    <!-- Task mode -->
    <div class="flex flex-col gap-2">
      <span class="text-[#7e889c] text-xs font-medium tracking-wider">TASK MODE</span>
      <div class="flex gap-1">
        {#each ['1-back', '2-back', 'variable'] as mode}
          <button
            class="flex-1 py-2 px-2 rounded-md text-xs font-medium cursor-pointer transition-colors
              {state.settings.taskMode === mode
                ? mode === '1-back' ? 'bg-[#3d4f82] text-[#8fb2ff]' :
                  mode === '2-back' ? 'bg-[#2f6a57] text-[#74d8b3]' :
                  'bg-[#7c6230] text-[#d5b15e]'
                : 'bg-[#121621] text-[#7e889c] hover:bg-[#0f121a]'}"
            onclick={() => setTaskMode(mode as any)}
          >
            {mode}
          </button>
        {/each}
      </div>
    </div>

    <!-- Voice pack -->
    <div class="flex flex-col gap-2">
      <span class="text-[#7e889c] text-xs font-medium tracking-wider">VOICE PACK</span>
      <div class="flex flex-col gap-1">
        {#each [{ id: 'rose' as const, label: 'Rose' }, { id: 'rose_fast' as const, label: 'Rose Fast' }, { id: 'jenny' as const, label: 'Jenny' }] as pack}
          <button
            class="w-full py-2 px-3 rounded-md text-sm text-left cursor-pointer transition-colors
              {state.settings.voicePack === pack.id ? 'bg-[#4f79e8] text-[#0f121a]' : 'bg-[#121621] text-[#a9b4cc] hover:bg-[#0f121a]'}"
            onclick={() => setVoicePack(pack.id)}
          >
            {pack.label}
          </button>
        {/each}
      </div>
    </div>

    <!-- Beep toggle -->
    <div class="flex items-center justify-between">
      <span class="text-[#a9b4cc] text-sm">Beep on wrong answer</span>
      <button aria-label="Toggle beep on wrong answer"
        class="w-10 h-5 rounded-full relative cursor-pointer transition-colors {state.settings.beepOnIncorrect ? 'bg-[#4f79e8]' : 'bg-[#7e889c]'}"
        onclick={toggleBeep}
      >
        <div class="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform {state.settings.beepOnIncorrect ? 'translate-x-5' : 'translate-x-0.5'}"></div>
      </button>
    </div>
  </div>
</div>
