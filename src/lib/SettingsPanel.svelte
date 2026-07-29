<script lang="ts">
  import type { Engine, GameState } from '$lib/engine';

  let { engine, close, mobileFloating = false }: { engine: Engine; close: () => void; mobileFloating?: boolean; showOnboarding?: () => void } = $props();
  let state = $state<GameState>(engine.getState());

  $effect(() => {
    return engine.subscribe((s) => { state = s; });
  });

  // Click-outside handler
  let wrapperEl: HTMLElement;
  $effect(() => {
    if (!wrapperEl) return;
    const timer = setTimeout(() => {
      const handler = (e: MouseEvent) => {
        if (!wrapperEl.contains(e.target as Node)) {
          close();
        }
      };
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    });
    return () => clearTimeout(timer);
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
  bind:this={wrapperEl}
  class="z-20 {mobileFloating ? 'fixed bottom-20 left-4 right-4 md:absolute md:bottom-auto md:left-auto md:right-0 md:top-[42px] md:w-[220px]' : 'absolute right-0 top-[42px] w-[220px]'}"
>
  <div class="max-h-[calc(100vh-7rem)] overflow-y-auto rounded-md bg-[#a9b4cc] p-1 shadow-2xl">
    <!-- Task mode: Regular (1-back) -->
    <button class="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left {state.settings.taskMode === '1-back' ? 'bg-[#000000]' : 'cursor-pointer hover:bg-[#000000]'}" onclick={() => engine.updateSettings({ taskMode: '1-back' })}>
      <span class="font-medium {state.settings.taskMode === '1-back' ? 'text-[#a9b4cc]' : 'text-[#090a0d] group-hover:text-[#a9b4cc]'}">Regular</span>
      {#if state.settings.taskMode === '1-back'}
        <span class="text-sm font-semibold text-[#10b981]">&bull;</span>
      {:else}
        <span>&bull;</span>
      {/if}
    </button>

    <!-- Task mode: 2-back -->
    <button class="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left {state.settings.taskMode === '2-back' ? 'bg-[#000000]' : 'cursor-pointer hover:bg-[#000000]'}" onclick={() => engine.updateSettings({ taskMode: '2-back' })}>
      <span class="font-medium {state.settings.taskMode === '2-back' ? 'text-[#a9b4cc]' : 'text-[#090a0d] group-hover:text-[#a9b4cc]'}">2-back</span>
      {#if state.settings.taskMode === '2-back'}
        <span class="text-sm font-semibold text-[#10b981]">&bull;</span>
      {:else}
        <span>&bull;</span>
      {/if}
    </button>

    <!-- Task mode: Variable -->
    <button class="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left {state.settings.taskMode === 'variable' ? 'bg-[#000000]' : 'cursor-pointer hover:bg-[#000000]'}" onclick={() => engine.updateSettings({ taskMode: 'variable' })}>
      <span class="font-medium {state.settings.taskMode === 'variable' ? 'text-[#a9b4cc]' : 'text-[#090a0d] group-hover:text-[#a9b4cc]'}">Variable</span>
      {#if state.settings.taskMode === 'variable'}
        <span class="text-sm font-semibold text-[#10b981]">&bull;</span>
      {:else}
        <span>&bull;</span>
      {/if}
    </button>

    <div class="my-1 h-px bg-[#7e889c]"></div>

    <div class="px-3 py-2">
      <span class="text-xs font-semibold uppercase tracking-[0.18em] text-[#515c70]">Session display</span>
    </div>

    <button
      class="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left {state.settings.displayMode === 'standard' ? 'bg-[#000000]' : 'cursor-pointer hover:bg-[#000000]'}"
      onclick={() => engine.updateSettings({ displayMode: 'standard' })}
    >
      <span class="flex flex-col">
        <span class="font-medium {state.settings.displayMode === 'standard' ? 'text-[#a9b4cc]' : 'text-[#090a0d] group-hover:text-[#a9b4cc]'}">Standard</span>
        <span class="text-[10px] {state.settings.displayMode === 'standard' ? 'text-[#7e889c]' : 'text-[#515c70] group-hover:text-[#7e889c]'}">Timer and interval visible</span>
      </span>
      <span class="text-sm font-semibold {state.settings.displayMode === 'standard' ? 'text-[#10b981]' : ''}">&bull;</span>
    </button>

    <button
      class="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left {state.settings.displayMode === 'focus' ? 'bg-[#000000]' : 'cursor-pointer hover:bg-[#000000]'}"
      onclick={() => engine.updateSettings({ displayMode: 'focus' })}
    >
      <span class="flex flex-col">
        <span class="font-medium {state.settings.displayMode === 'focus' ? 'text-[#a9b4cc]' : 'text-[#090a0d] group-hover:text-[#a9b4cc]'}">Focus</span>
        <span class="text-[10px] {state.settings.displayMode === 'focus' ? 'text-[#7e889c]' : 'text-[#515c70] group-hover:text-[#7e889c]'}">Hide during training</span>
      </span>
      <span class="text-sm font-semibold {state.settings.displayMode === 'focus' ? 'text-[#10b981]' : ''}">&bull;</span>
    </button>

    <div class="my-1 h-px bg-[#7e889c]"></div>

    {#if state.settings.useKeypad}
      <div class="px-3 py-2">
        <span class="text-xs font-semibold uppercase tracking-[0.18em] text-[#515c70]">Keypad layout</span>
      </div>

      <button
        class="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left {state.settings.keypadLayout === 'classic' ? 'bg-[#000000]' : 'cursor-pointer hover:bg-[#000000]'}"
        onclick={() => engine.updateSettings({ keypadLayout: 'classic' })}
      >
        <span class="flex flex-col">
          <span class="font-medium {state.settings.keypadLayout === 'classic' ? 'text-[#a9b4cc]' : 'text-[#090a0d] group-hover:text-[#a9b4cc]'}">Classic (3×6)</span>
          <span class="text-[10px] {state.settings.keypadLayout === 'classic' ? 'text-[#7e889c]' : 'text-[#515c70] group-hover:text-[#7e889c]'}">Current grouped layout</span>
        </span>
        <span class="text-sm font-semibold {state.settings.keypadLayout === 'classic' ? 'text-[#10b981]' : ''}">&bull;</span>
      </button>

      <button
        class="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left {state.settings.keypadLayout === 'sequential' ? 'bg-[#000000]' : 'cursor-pointer hover:bg-[#000000]'}"
        onclick={() => engine.updateSettings({ keypadLayout: 'sequential' })}
      >
        <span class="flex flex-col">
          <span class="font-medium {state.settings.keypadLayout === 'sequential' ? 'text-[#a9b4cc]' : 'text-[#090a0d] group-hover:text-[#a9b4cc]'}">Sequential 6×3</span>
          <span class="text-[10px] {state.settings.keypadLayout === 'sequential' ? 'text-[#7e889c]' : 'text-[#515c70] group-hover:text-[#7e889c]'}">2–7, 8–13, 14–18</span>
        </span>
        <span class="text-sm font-semibold {state.settings.keypadLayout === 'sequential' ? 'text-[#10b981]' : ''}">&bull;</span>
      </button>

      <div class="my-1 h-px bg-[#7e889c]"></div>
    {/if}

    <!-- Voice label -->
    <div class="px-3 py-2">
      <span class="text-xs font-semibold uppercase tracking-[0.18em] text-[#515c70]">Voice</span>
    </div>

    <!-- Voice: Rose -->
    <button class="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left {state.settings.voicePack === 'rose' ? 'bg-[#000000]' : 'cursor-pointer hover:bg-[#000000]'}" onclick={() => engine.updateSettings({ voicePack: 'rose' })}>
      <span class="font-medium {state.settings.voicePack === 'rose' ? 'text-[#a9b4cc]' : 'text-[#090a0d] group-hover:text-[#a9b4cc]'}">Rose</span>
      {#if state.settings.voicePack === 'rose'}
        <span class="text-sm font-semibold text-[#10b981]">&bull;</span>
      {:else}
        <span>&bull;</span>
      {/if}
    </button>

    <!-- Voice: Rose Fast -->
    <button class="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left {state.settings.voicePack === 'rose_fast' ? 'bg-[#000000]' : 'cursor-pointer hover:bg-[#000000]'}" onclick={() => engine.updateSettings({ voicePack: 'rose_fast' })}>
      <span class="font-medium {state.settings.voicePack === 'rose_fast' ? 'text-[#a9b4cc]' : 'text-[#090a0d] group-hover:text-[#a9b4cc]'}">Rose Fast</span>
      {#if state.settings.voicePack === 'rose_fast'}
        <span class="text-sm font-semibold text-[#10b981]">&bull;</span>
      {:else}
        <span>&bull;</span>
      {/if}
    </button>

    <!-- Voice: Jenny -->
    <button class="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left {state.settings.voicePack === 'jenny' ? 'bg-[#000000]' : 'cursor-pointer hover:bg-[#000000]'}" onclick={() => engine.updateSettings({ voicePack: 'jenny' })}>
      <span class="font-medium {state.settings.voicePack === 'jenny' ? 'text-[#a9b4cc]' : 'text-[#090a0d] group-hover:text-[#a9b4cc]'}">Jenny</span>
      {#if state.settings.voicePack === 'jenny'}
        <span class="text-sm font-semibold text-[#10b981]">&bull;</span>
      {:else}
        <span>&bull;</span>
      {/if}
    </button>

    <div class="my-1 h-px bg-[#7e889c]"></div>

    <!-- Wrong answer sound label -->
    <div class="px-3 py-2">
      <span class="text-xs font-semibold uppercase tracking-[0.18em] text-[#515c70]">Wrong answer sound</span>
    </div>

    <!-- Wrong sound: None -->
    <button class="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left {state.settings.wrongSound === 'none' ? 'bg-[#000000]' : 'cursor-pointer hover:bg-[#000000]'}" onclick={() => engine.updateSettings({ wrongSound: 'none' })}>
      <span class="font-medium {state.settings.wrongSound === 'none' ? 'text-[#a9b4cc]' : 'text-[#090a0d] group-hover:text-[#a9b4cc]'}">None</span>
      {#if state.settings.wrongSound === 'none'}
        <span class="text-sm font-semibold text-[#10b981]">&bull;</span>
      {:else}
        <span>&bull;</span>
      {/if}
    </button>

    <!-- Wrong sound: Beep -->
    <button class="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left {state.settings.wrongSound === 'beep' ? 'bg-[#000000]' : 'cursor-pointer hover:bg-[#000000]'}" onclick={() => engine.updateSettings({ wrongSound: 'beep' })}>
      <span class="font-medium {state.settings.wrongSound === 'beep' ? 'text-[#a9b4cc]' : 'text-[#090a0d] group-hover:text-[#a9b4cc]'}">Beep</span>
      {#if state.settings.wrongSound === 'beep'}
        <span class="text-sm font-semibold text-[#10b981]">&bull;</span>
      {:else}
        <span>&bull;</span>
      {/if}
    </button>

    <!-- Wrong sound: Fart -->
    <button class="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left {state.settings.wrongSound === 'fart' ? 'bg-[#000000]' : 'cursor-pointer hover:bg-[#000000]'}" onclick={() => engine.updateSettings({ wrongSound: 'fart' })}>
      <span class="font-medium {state.settings.wrongSound === 'fart' ? 'text-[#a9b4cc]' : 'text-[#090a0d] group-hover:text-[#a9b4cc]'}">Fart 💨</span>
      {#if state.settings.wrongSound === 'fart'}
        <span class="text-sm font-semibold text-[#10b981]">&bull;</span>
      {:else}
        <span>&bull;</span>
      {/if}
    </button>

    <div class="my-1 h-px bg-[#7e889c]"></div>

    <!-- View instructions -->
    <button class="group flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left hover:bg-[#000000]" onclick={() => { engine.showOnboarding(); close(); }}>
      <span class="font-medium text-[#090a0d] group-hover:text-[#a9b4cc]">View instructions</span>
      <span class="text-[#090a0d] group-hover:text-[#a9b4cc]">&rsaquo;</span>
    </button>

    <!-- Close (mobile only) -->
    <button class="group mt-1 flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left hover:bg-[#000000] md:hidden" onclick={close}>
      <span class="font-medium text-[#090a0d] group-hover:text-[#a9b4cc]">Close</span>
    </button>
  </div>
</div>
