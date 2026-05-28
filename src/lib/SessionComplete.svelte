<script lang="ts">
  import type { Engine, GameState } from '$lib/engine';
  import { onMount } from 'svelte';

  let { engine, onHistory }: { engine: Engine; onHistory?: () => void } = $props();
  let state = $state<GameState>(engine.getState());
  let accuracyCanvas: HTMLCanvasElement;
  let intervalCanvas: HTMLCanvasElement;

  $effect(() => {
    return engine.subscribe((s) => { state = s; });
  });

  const session = $derived(state.history.length > 0 ? state.history[0] : null);

  // Previous session for comparison
  const prevSession = $derived(state.history.length > 1 ? state.history[1] : null);

  function changePercent(current: number, previous: number): number {
    if (!previous) return 0;
    return Number(((current - previous) / previous).toFixed(2));
  }

  function formatInterval(ms: number): string {
    if (!ms) return 'N/A';
    const secs = ms / 1000;
    const decimals = Number.isInteger(secs) ? 0 : secs < 1 ? 2 : 1;
    return `${secs.toFixed(decimals)} SECOND${secs === 1 ? '' : 'S'}`;
  }

  const accuracy = $derived(session?.accuracy ?? 0);
  const fastest = $derived(session?.fastestIntervalMs ?? 0);
  const streaks = $derived(session?.streaks ?? 0);
  const ending = $derived(session?.endingIntervalMs ?? 0);

  // Compute changes from previous session
  const accuracyChange = $derived(prevSession ? changePercent(accuracy, prevSession.accuracy) : 0);
  const fastestChange = $derived(prevSession ? changePercent(fastest, prevSession.fastestIntervalMs) : 0);
  const streaksChange = $derived(prevSession ? changePercent(streaks, prevSession.streaks) : 0);
  const endingChange = $derived(prevSession ? changePercent(ending, prevSession.endingIntervalMs) : 0);

  onMount(async () => {
    if (!accuracyCanvas || !intervalCanvas) return;
    try {
      const chartModule = await import('chart.js/auto');
      const Chart = chartModule.default;
      const fontFamily = "'DM Sans', sans-serif";

      // Accuracy chart
      const accuracyData = state.history.slice().reverse().map((s, i) => ({ x: i, y: Math.round(s.accuracy * 100) }));
      new Chart(accuracyCanvas, {
        type: 'line',
        data: {
          labels: accuracyData.map(d => ''),
          datasets: [{ data: accuracyData.map(d => d.y), borderColor: '#4f79e8', borderWidth: 2, pointRadius: 0, fill: false, tension: 0.4, categoryPercentage: 1, barPercentage: 1 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            x: { display: false },
            y: { min: 0, max: 100, ticks: { color: '#7e889c', font: { family: fontFamily, size: 12, weight: '500' }, stepSize: 25 }, grid: { color: '#121621' }, border: { display: false } }
          },
          elements: { line: { capBezierPoints: true } },
          spanGaps: true
        }
      });

      // Interval chart
      const intervalData = state.history.slice().reverse().map((s, i) => ({ x: i, y: s.fastestIntervalMs }));
      new Chart(intervalCanvas, {
        type: 'line',
        data: {
          labels: intervalData.map(d => ''),
          datasets: [{ data: intervalData.map(d => d.y), borderColor: '#4f79e8', borderWidth: 2, pointRadius: 0, fill: false, tension: 0.4, categoryPercentage: 1, barPercentage: 1 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            x: { display: false },
            y: { ticks: { color: '#7e889c', font: { family: fontFamily, size: 12, weight: '500' }, callback: (v: any) => `${(v/1000).toFixed(1)}s` }, grid: { color: '#121621' }, border: { display: false } }
          },
          elements: { line: { capBezierPoints: true } },
          spanGaps: true
        }
      });
    } catch {}
  });
</script>

<div class="flex grow flex-col">
  <!-- Header row: "What a session!" + buttons -->
  <div class="flex pt-12 pb-6 md:pb-0 justify-center md:justify-between gap-2 items-center w-full max-w-5xl">
    <span class="hidden md:inline text-2xl text-white">What a session!</span>
    <div class="flex gap-3">
      <button class="cursor-pointer flex items-center gap-6 bg-[#0f121a] hover:bg-[#121621] py-3 px-8 rounded-full border border-[#273049]" onclick={() => onHistory?.()}>
        <span class="text-[#a9b4cc] font-semibold">History</span>
      </button>
      <button class="cursor-pointer flex items-center gap-6 bg-[#4f79e8] hover:opacity-75 py-3 px-18 rounded-full border" onclick={() => engine.start()}>
        <span class="text-[#090a0d] font-semibold">Start again</span>
      </button>
    </div>
  </div>

  {#if session}
    <!-- Score cards -->
    <div class="grid grid-cols-2 gap-4 max-w-5xl w-full">
      <!-- Accuracy card -->
      <div class="flex flex-col gap-[5px] rounded-4xl overflow-hidden">
        <div class="flex flex-col bg-[#0f121a] pt-6 text-center items-center">
          <span class="text-2xl text-[#a9b4cc] px-6">Accuracy</span>
          <div class="flex gap-3 items-center">
            <span class="text-[#ffffff] py-12 font-medium">{Math.round(accuracy * 100)}%</span>
            {#if accuracyChange > 0}
              <div class="flex gap-1 bg-[#4fe84f] p-1 rounded-md items-center mt-[-15px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="#0f121a" viewBox="0 0 256 256"><path d="M215.39,163.06A8,8,0,0,1,208,168H48a8,8,0,0,1-5.66-13.66l80-80a8,8,0,0,1,11.32,0l80,80A8,8,0,0,1,215.39,163.06Z"></path></svg>
                <span class="text-xs text-[#0f121a] font-mono font-medium">{Math.abs(accuracyChange).toFixed(2)}</span>
              </div>
            {:else if accuracyChange < 0}
              <div class="flex gap-1 bg-[#e85c4f] p-1 rounded-md items-center mb-[-15px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="#0f121a" viewBox="0 0 256 256"><path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,48,88H208a8,8,0,0,1,5.66,13.66Z"></path></svg>
                <span class="text-xs text-[#0f121a] font-mono font-medium">{Math.abs(accuracyChange).toFixed(2)}</span>
              </div>
            {/if}
          </div>
        </div>
        <div class="flex gap-6 bg-[#000000] p-6 justify-center">
          <span class="text-xs text-[#7e889c] font-medium">Max accuracy</span>
          <span class="text-xs text-[#ffffff] font-medium">{Math.round(accuracy * 100)}%</span>
        </div>
      </div>

      <!-- Fastest Interval card -->
      <div class="flex flex-col gap-[5px] rounded-4xl overflow-hidden">
        <div class="flex flex-col bg-[#0f121a] pt-6 text-center items-center">
          <span class="text-2xl text-[#a9b4cc] px-6">Fastest Interval</span>
          <div class="flex gap-3 items-center">
            <span class="text-[#ffffff] py-12 font-medium">{formatInterval(fastest)}</span>
            {#if fastestChange > 0}
              <div class="flex gap-1 bg-[#4fe84f] p-1 rounded-md items-center mt-[-15px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="#0f121a" viewBox="0 0 256 256"><path d="M215.39,163.06A8,8,0,0,1,208,168H48a8,8,0,0,1-5.66-13.66l80-80a8,8,0,0,1,11.32,0l80,80A8,8,0,0,1,215.39,163.06Z"></path></svg>
                <span class="text-xs text-[#0f121a] font-mono font-medium">{Math.abs(fastestChange).toFixed(2)}</span>
              </div>
            {:else if fastestChange < 0}
              <div class="flex gap-1 bg-[#e85c4f] p-1 rounded-md items-center mb-[-15px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="#0f121a" viewBox="0 0 256 256"><path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,48,88H208a8,8,0,0,1,5.66,13.66Z"></path></svg>
                <span class="text-xs text-[#0f121a] font-mono font-medium">{Math.abs(fastestChange).toFixed(2)}</span>
              </div>
            {/if}
          </div>
        </div>
        <div class="flex gap-6 bg-[#000000] p-6 justify-center">
          <span class="text-xs text-[#7e889c] font-medium">All-time best</span>
          <span class="text-xs text-[#ffffff] font-medium">{formatInterval(fastest)}</span>
        </div>
      </div>

      <!-- Streaks card -->
      <div class="flex flex-col gap-[5px] rounded-4xl overflow-hidden">
        <div class="flex flex-col bg-[#0f121a] pt-6 text-center items-center">
          <span class="text-2xl text-[#a9b4cc] px-6">Streaks</span>
          <div class="flex gap-3 items-center">
            <span class="text-[#ffffff] py-12 font-medium">{streaks}</span>
            {#if streaksChange > 0}
              <div class="flex gap-1 bg-[#4fe84f] p-1 rounded-md items-center mt-[-15px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="#0f121a" viewBox="0 0 256 256"><path d="M215.39,163.06A8,8,0,0,1,208,168H48a8,8,0,0,1-5.66-13.66l80-80a8,8,0,0,1,11.32,0l80,80A8,8,0,0,1,215.39,163.06Z"></path></svg>
                <span class="text-xs text-[#0f121a] font-mono font-medium">{Math.abs(streaksChange).toFixed(2)}</span>
              </div>
            {:else if streaksChange < 0}
              <div class="flex gap-1 bg-[#e85c4f] p-1 rounded-md items-center mb-[-15px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="#0f121a" viewBox="0 0 256 256"><path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,48,88H208a8,8,0,0,1,5.66,13.66Z"></path></svg>
                <span class="text-xs text-[#0f121a] font-mono font-medium">{Math.abs(streaksChange).toFixed(2)}</span>
              </div>
            {/if}
          </div>
        </div>
        <div class="flex gap-6 bg-[#000000] p-6 justify-center">
          <span class="text-xs text-[#7e889c] font-medium">Most streaks</span>
          <span class="text-xs text-[#ffffff] font-medium">{streaks}</span>
        </div>
      </div>

      <!-- Ending Interval card -->
      <div class="flex flex-col gap-[5px] rounded-4xl overflow-hidden">
        <div class="flex flex-col bg-[#0f121a] pt-6 text-center items-center">
          <span class="text-2xl text-[#a9b4cc] px-6">Ending Interval</span>
          <div class="flex gap-3 items-center">
            <span class="text-[#ffffff] py-12 font-medium">{formatInterval(ending)}</span>
          </div>
        </div>
        <div class="flex gap-6 bg-[#000000] p-6 justify-center">
          <span class="text-xs text-[#7e889c] font-medium">Starting</span>
          <span class="text-xs text-[#ffffff] font-medium">{formatInterval(state.settings.startingInterval)}</span>
        </div>
      </div>
    </div>

    <!-- Charts section -->
    <div class="grid grid-cols-1 gap-4 max-w-5xl w-full mt-4">
      <!-- Accuracy chart -->
      <section class="rounded-[28px] bg-[#0f121a] p-5">
        <span class="text-lg font-medium text-[#a9b4cc]">Accuracy</span>
        <div class="mt-4 h-[200px] min-w-0">
          <canvas bind:this={accuracyCanvas}></canvas>
        </div>
      </section>

      <!-- Interval chart -->
      <section class="rounded-[28px] bg-[#0f121a] p-5">
        <span class="text-lg font-medium text-[#a9b4cc]">Fastest Interval</span>
        <div class="mt-4 h-[200px] min-w-0">
          <canvas bind:this={intervalCanvas}></canvas>
        </div>
      </section>
    </div>
  {:else}
    <!-- Empty state -->
    <div class="rounded-[28px] bg-[#0f121a] p-8 text-center max-w-5xl w-full">
      <span class="text-lg font-semibold text-white">No sessions yet</span>
      <p class="mt-3 text-sm leading-6 text-[#7e889c]">Finish a session in this mode and the progress charts will show up here.</p>
    </div>
  {/if}
</div>
