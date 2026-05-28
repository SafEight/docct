<script lang="ts">
  import type { Engine, GameState } from '$lib/engine';

  let { engine }: { engine: Engine } = $props();
  let state = $state<GameState>(engine.getState());

  $effect(() => {
    return engine.subscribe((s) => { state = s; });
  });

  function selectDuration(minutes: number) {
    engine.updateSettings({ timer: minutes * 60 });
  }

  function handleStartingInterval(val: number) {
    engine.updateSettings({ startingInterval: val * 1000 });
  }

  function handleMinimumInterval(val: number) {
    engine.updateSettings({ minimumInterval: val * 1000 });
  }
</script>

<div class="flex flex-col justify-center grow gap-18">
  <div class="flex flex-col md:flex-row gap-18 items-center grow">
    <!-- Duration buttons -->
    <div class="flex gap-6 justify-center items-center grow">
      {#each [5, 10, 15] as duration}
        {@const selected = state.settings.timer === duration * 60}
        <button class="flex flex-col rounded-xl justify-center items-center gap-2 w-[80px] h-[80px] {selected ? 'bg-[#ffffff]' : 'cursor-pointer'}" onclick={() => selectDuration(duration)}>
          <span class="text-2xl {selected ? 'text-[#090a0d] font-bold' : 'text-[#a9b4cc] font-medium'}">{duration}</span>
          <span class="text-xs font-medium {selected ? 'text-[#090a0d]' : 'text-[#a9b4cc]'}">MINUTES</span>
        </button>
      {/each}
    </div>

    <!-- Interval fields -->
    <div class="flex flex-col md:flex-row gap-9">
      <!-- Starting interval -->
      <div class="flex flex-col items-start gap-6">
        <span class="text-sm text-[#7e889c]">STARTING INTERVAL</span>
        <div class="flex overflow-hidden rounded-xl">
          <input class="bg-[#0f121a] p-2 text-center text-xl font-medium text-white [appearance:textfield] focus:outline-none w-[100px] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" type="text" inputmode="decimal" spellcheck="false" value={(state.settings.startingInterval / 1000).toFixed(2).replace(/\.?0+$/, "")} onchange={(e) => handleStartingInterval(parseFloat((e.target as HTMLInputElement).value))} onkeydown={(e) => { if (e.key === "Escape") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }} />
          <div class="flex gap-2 bg-[#0f121a] p-2 pl-0">
            {#each [0.5, 1, 2, 3, 5] as preset}
              <button type="button" class="cursor-pointer bg-[#a9b4cc] p-2 rounded-md" onmousedown={(e) => e.preventDefault()} onclick={() => handleStartingInterval(preset)}>
                <span class="#0f121a text-sm font-bold">{preset}</span>
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- Minimum interval -->
      <div class="flex flex-col items-start gap-6">
        <span class="text-sm text-[#7e889c]">MINIMUM INTERVAL</span>
        <div class="flex overflow-hidden rounded-xl">
          <input class="bg-[#0f121a] p-2 text-center text-xl font-medium text-white [appearance:textfield] focus:outline-none w-[100px] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" type="text" inputmode="decimal" spellcheck="false" value={(state.settings.minimumInterval / 1000).toFixed(2).replace(/\.?0+$/, "")} onchange={(e) => handleMinimumInterval(parseFloat((e.target as HTMLInputElement).value))} onkeydown={(e) => { if (e.key === "Escape") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }} />
          <div class="flex gap-2 bg-[#0f121a] p-2 pl-0">
            {#each [0.5, 1, 2, 3, 5] as preset}
              <button type="button" class="cursor-pointer bg-[#a9b4cc] p-2 rounded-md" onmousedown={(e) => e.preventDefault()} onclick={() => handleMinimumInterval(preset)}>
                <span class="#0f121a text-sm font-bold">{preset}</span>
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom section (inside the flex-col wrapper) -->
  <div class="flex flex-col p-6 pb-12 md:p-0 bg-[#0f121a] md:bg-[#090a0d] justify-between">
    <button class="cursor-pointer flex justify-center items-center gap-6 bg-[#4f79e8] hover:opacity-75 py-6 px-18 rounded-full border" onclick={() => engine.start()}>
      <div class="bg-[#0f121a] p-1 rounded-md">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Play--Streamline-Solar" height="12" width="12"><g id="Bold Duotone/Video Audio Sound/Play"><path id="Vector" fill="#4f79e8" d="m8.59662 21.6145 12.81198 -6.9671C22.4695 14.0705 23 13.0352 23 12H4v6.9671c0 2.3092 2.53435 3.7689 4.59662 2.6474Z" stroke-width="1"></path><path id="Vector_2" fill="#4f79e8" fill-rule="evenodd" d="M23 12c0 -1.0352 -0.5305 -2.07047 -1.5914 -2.64742L8.59661 2.38548C6.53435 1.26402 4 2.72368 4 5.0329V12h19Z" clip-rule="evenodd" stroke-width="1"></path></g></svg>
      </div>
      <span class="text-[#0f121a] font-semibold">Start session</span>
    </button>

    <div class="flex justify-center pt-4">
      <a href="https://discord.com/invite/brain" target="_blank" rel="noreferrer" class="group flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-[#7e889c] hover:text-[#a9b4cc]">
        <span>Mindbuilding Discord:</span>
        <span class="text-[#a9b4cc] group-hover:text-[#ffffff]">discord.gg/brain</span>
      </a>
    </div>

    <!-- Mobile settings gear -->
    <div class="flex pt-4 md:hidden">
      <button aria-label="Open settings" class="flex h-10 w-10 items-center justify-center rounded-md border border-[#a9b4cc] text-[#a9b4cc]">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M230.52,126.06,211.9,110.5c.09-1.5.1-3,.1-4.5s0-3-.1-4.5l18.62-15.56a8,8,0,0,0,2-10.13l-16-27.71a8,8,0,0,0-9.8-3.47l-23.22,9.35a77.87,77.87,0,0,0-7.8-4.5L172,23.54A8,8,0,0,0,164.13,16H131.87A8,8,0,0,0,124,23.54l-3.68,25.94a77.87,77.87,0,0,0-7.8,4.5L89.3,44.63a8,8,0,0,0-9.8,3.47l-16,27.71a8,8,0,0,0,2,10.13L84.1,101.5c-.09,1.5-.1,3-.1,4.5s0,3,.1,4.5L65.48,126.06a8,8,0,0,0-2,10.13l16,27.71a8,8,0,0,0,9.8,3.47l23.22,9.35a77.87,77.87,0,0,0,7.8,4.5L124,188.46a8,8,0,0,0,7.87,7.54h32.26a8,8,0,0,0,7.87-7.54l3.68-25.94a77.87,77.87,0,0,0,7.8-4.5l23.22,9.35a8,8,0,0,0,9.8-3.47l16-27.71A8,8,0,0,0,230.52,126.06ZM148,128a20,20,0,1,1-20-20A20,20,0,0,1,148,128Z"></path></svg>
      </button>
    </div>
  </div>
</div>
