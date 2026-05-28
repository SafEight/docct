<script lang="ts">
  import { createEngine, type GameState } from '$lib/engine';
  import Onboarding from '$lib/Onboarding.svelte';
  import Setup from '$lib/Setup.svelte';
  import ActiveSession from '$lib/ActiveSession.svelte';
  import PausedOverlay from '$lib/PausedOverlay.svelte';
  import SessionComplete from '$lib/SessionComplete.svelte';

  const engine = createEngine();
  let state = $state<GameState>(engine.getState());

  $effect(() => {
    return engine.subscribe((s) => { state = s; });
  });
</script>

<div class="fixed flex w-full h-full z-2 overflow-auto">
  {#if state.phase === 'onboarding'}
    <Onboarding {engine} />
    <Setup {engine} />
  {:else if state.phase === 'setup'}
    <Setup {engine} />
  {:else if state.phase === 'active'}
    <ActiveSession {engine} />
  {:else if state.phase === 'paused'}
    <ActiveSession {engine} />
    <PausedOverlay {engine} />
  {:else if state.phase === 'complete'}
    <SessionComplete {engine} />
  {/if}
</div>
