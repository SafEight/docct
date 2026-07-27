<script lang="ts">
  import type { Engine, GameState, SessionResult } from '$lib/engine';
  import { onMount } from 'svelte';

  let { engine, close }: { engine: Engine; close: () => void } = $props();
  let state = $state<GameState>(engine.getState());
  let chartCanvas: HTMLCanvasElement;
  let intervalChartCanvas: HTMLCanvasElement;
  let Chart: any;

  $effect(() => {
    return engine.subscribe((s) => { state = s; });
  });

  $effect(() => {
    if (state.history.length > 0 && chartCanvas && Chart) {
      renderCharts();
    }
  });

  onMount(async () => {
    const chartModule = await import('chart.js/auto');
    Chart = chartModule.default;

    if (state.history.length > 0) {
      renderCharts();
    }
  });

  function renderCharts() {
    if (!chartCanvas || !Chart) return;

    const sessions = [...state.history].reverse();

    // Accuracy chart
    new Chart(chartCanvas, {
      type: 'line',
      data: {
        labels: sessions.map((_, i) => ''),
        datasets: [{
          data: sessions.map(s => Math.round(s.accuracy * 100)),
          borderColor: '#10b981',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#10b981',
          fill: false,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: {
            min: 0,
            max: 100,
            ticks: { color: '#7e889c', font: { size: 10 } },
            grid: { color: '#121621' }
          }
        }
      }
    });

    // Interval chart
    if (intervalChartCanvas) {
      new Chart(intervalChartCanvas, {
        type: 'line',
        data: {
          labels: sessions.map((_, i) => ''),
          datasets: [{
            data: sessions.map(s => s.fastestIntervalMs),
            borderColor: '#10b981',
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#10b981',
            fill: false,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { display: false },
            y: {
              ticks: { color: '#7e889c', font: { size: 10 } },
              grid: { color: '#121621' }
            }
          }
        }
      });
    }
  }

  function formatTime(ms: number): string {
    const secs = Math.floor(ms / 1000);
    const msRemainder = ms % 1000;
    if (secs === 0) return `${msRemainder}ms`;
    return `${secs}.${Math.floor(msRemainder / 100)}s`;
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="bg-black/80 fixed inset-0 z-3 flex items-center justify-center" role="dialog" aria-label="History" onclick={close}>
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="bg-[#0f121a] rounded-[24px] p-6 max-w-[600px] w-full mx-4 max-h-[80vh] overflow-y-auto border border-[#a9b4cc]" onclick={(e) => e.stopPropagation()}>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-[#ffffff] text-2xl font-bold">History</h2>
      <button class="text-[#7e889c] hover:text-white cursor-pointer" aria-label="Close history" onclick={close}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.3 5.71a1 1 0 0 0-1.42 0L12 10.59 7.12 5.71A1 1 0 0 0 5.7 7.12L10.59 12l-4.88 4.88a1 1 0 0 0 1.42 1.42L12 13.41l4.88 4.88a1 1 0 0 0 1.42-1.42L13.41 12l4.88-4.88a1 1 0 0 0 0-1.41z"/>
        </svg>
      </button>
    </div>

    {#if state.history.length === 0}
      <div class="text-center py-12">
        <span class="text-[#7e889c] text-lg">No sessions yet</span>
      </div>
    {:else}
      <!-- Charts -->
      <div class="mb-6">
        <h3 class="text-[#a9b4cc] text-sm font-medium mb-3">Accuracy Trend</h3>
        <div class="bg-[#121621] rounded-xl p-4 h-[160px]">
          <canvas bind:this={chartCanvas}></canvas>
        </div>
      </div>

      <div class="mb-6">
        <h3 class="text-[#a9b4cc] text-sm font-medium mb-3">Fastest Interval Trend</h3>
        <div class="bg-[#121621] rounded-xl p-4 h-[160px]">
          <canvas bind:this={intervalChartCanvas}></canvas>
        </div>
      </div>

      <!-- Session list -->
      <div class="flex flex-col gap-2">
        {#each state.history as session}
          <div class="bg-[#121621] rounded-xl p-4 flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <span class="text-[#7e889c] text-xs">{formatDate(session.completedAt)}</span>
              <span class="text-[#a9b4cc] text-xs px-2 py-0.5 rounded-md bg-[#0f121a]">
                {session.mode} · {session.intervalMode === 'fixed' ? 'Fixed' : 'Adaptive'}
              </span>
            </div>
            <div class="flex items-center gap-4">
              <div class="flex flex-col">
                <span class="text-[#7e889c] text-xs">Accuracy</span>
                <span class="text-[#10b981] text-lg font-bold">{Math.round(session.accuracy * 100)}%</span>
              </div>
              <div class="flex flex-col">
                <span class="text-[#7e889c] text-xs">Fastest</span>
                <span class="text-white text-lg font-bold">{formatTime(session.fastestIntervalMs)}</span>
              </div>
              <div class="flex flex-col">
                <span class="text-[#7e889c] text-xs">Correct</span>
                <span class="text-[#4fe84f] text-lg font-bold">{session.correctCount}/{session.totalAnswers}</span>
              </div>
              <div class="flex flex-col">
                <span class="text-[#7e889c] text-xs">Streaks</span>
                <span class="text-white text-lg font-bold">{session.streaks}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
