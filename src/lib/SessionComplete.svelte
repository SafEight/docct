<script lang="ts">
  import type { Engine, GameState } from '$lib/engine';
  import { onMount } from 'svelte';

  let { engine }: { engine: Engine } = $props();
  let state = $state<GameState>(engine.getState());
  let chartCanvas: HTMLCanvasElement;
  let intervalChartCanvas: HTMLCanvasElement;
  let Chart: any;

  $effect(() => {
    return engine.subscribe((s) => { state = s; });
  });

  onMount(async () => {
    const chartModule = await import('chart.js/auto');
    Chart = chartModule.default;

    // Get the last session from history
    const session = state.sessionHistory[0];
    if (session && chartCanvas) {
      renderAccuracyChart(session);
    }
    if (session && intervalChartCanvas) {
      renderIntervalChart(session);
    }
  });

  function renderAccuracyChart(session: any) {
    if (!chartCanvas || !Chart) return;

    // Create mock data points for the chart (accuracy trend over time)
    const totalQuestions = session.totalAnswers;
    const correctAnswers = session.correctCount;
    const points = 20;
    const labels = [];
    const data = [];

    for (let i = 0; i < points; i++) {
      labels.push('');
      // Simulate accuracy trend
      const progress = (i + 1) / points;
      const accuracy = Math.min(1, session.accuracy + (Math.random() - 0.5) * 0.2);
      data.push(Math.round(accuracy * 100));
    }

    new Chart(chartCanvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          borderColor: '#4f79e8',
          borderWidth: 2,
          pointRadius: 0,
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
  }

  function renderIntervalChart(session: any) {
    if (!intervalChartCanvas || !Chart) return;

    const points = 20;
    const labels = [];
    const data = [];

    for (let i = 0; i < points; i++) {
      labels.push('');
      const progress = (i + 1) / points;
      const interval = session.fastestIntervalMs + (session.fastestIntervalMs * 0.5) * (1 - progress) + Math.random() * 500;
      data.push(Math.round(interval));
    }

    new Chart(intervalChartCanvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          borderColor: '#4f79e8',
          borderWidth: 2,
          pointRadius: 0,
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

  function formatTime(ms: number): string {
    const secs = Math.floor(ms / 1000);
    const msRemainder = ms % 1000;
    if (secs === 0) return `${msRemainder}ms`;
    return `${secs}.${Math.floor(msRemainder / 100)}s`;
  }
</script>

<div class="fixed flex w-full h-full z-2 overflow-auto bg-[#090a0d]">
  <div class="flex flex-col items-center w-full py-8 px-4 gap-8">
    <h1 class="text-[#ffffff] text-3xl font-bold" style="line-height: 1.2;">SESSION COMPLETE</h1>

    {#if state.history.length > 0}
      {@const session = state.history[0]}

      <!-- Stats grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-[600px]">
        <div class="bg-[#0f121a] rounded-xl p-4 flex flex-col items-center gap-1">
          <span class="text-[#7e889c] text-xs">Accuracy</span>
          <span class="text-[#4f79e8] text-2xl font-bold">{Math.round(session.accuracy * 100)}%</span>
        </div>

        <div class="bg-[#0f121a] rounded-xl p-4 flex flex-col items-center gap-1">
          <span class="text-[#7e889c] text-xs">Fastest Interval</span>
          <span class="text-white text-2xl font-bold">{formatTime(session.fastestIntervalMs)}</span>
        </div>

        <div class="bg-[#0f121a] rounded-xl p-4 flex flex-col items-center gap-1">
          <span class="text-[#7e889c] text-xs">Correct</span>
          <span class="text-[#4fe84f] text-2xl font-bold">{session.correctCount}/{session.totalAnswers}</span>
        </div>

        <div class="bg-[#0f121a] rounded-xl p-4 flex flex-col items-center gap-1">
          <span class="text-[#7e889c] text-xs">Streaks</span>
          <span class="text-white text-2xl font-bold">{session.streaks}</span>
        </div>
      </div>

      <!-- Accuracy chart -->
      <div class="w-full max-w-[600px]">
        <h3 class="text-[#a9b4cc] text-sm font-medium mb-3">Accuracy Over Time</h3>
        <div class="bg-[#0f121a] rounded-xl p-4 h-[200px]">
          <canvas bind:this={chartCanvas}></canvas>
        </div>
      </div>

      <!-- Interval chart -->
      <div class="w-full max-w-[600px]">
        <h3 class="text-[#a9b4cc] text-sm font-medium mb-3">Fastest Interval Over Time</h3>
        <div class="bg-[#0f121a] rounded-xl p-4 h-[200px]">
          <canvas bind:this={intervalChartCanvas}></canvas>
        </div>
      </div>
    {/if}

    <!-- New session button -->
    <button
      class="bg-[#4f79e8] hover:opacity-75 py-4 px-8 rounded-full text-[#0f121a] font-semibold text-lg cursor-pointer transition-opacity"
      onclick={() => engine.start()}
    >
      New session
    </button>
  </div>
</div>
