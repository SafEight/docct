<script lang="ts">
  import type { Engine } from '$lib/engine';

  let { engine }: { engine: Engine } = $props();
</script>

<div class="bg-black/80 fixed inset-0 z-3 flex items-center justify-center">
  <div class="bg-[#0f121a] rounded-[24px] p-8 max-w-[400px] border border-[#a9b4cc] mx-4 flex flex-col items-center gap-6">
    <h2 class="text-[#ffffff] text-3xl font-bold" style="line-height: 1.2;">PAUSED</h2>

    <div class="flex gap-4 w-full">
      <button
        class="flex-1 bg-[#4f79e8] hover:opacity-75 py-4 px-6 rounded-full flex items-center justify-center gap-2 cursor-pointer transition-opacity"
        onclick={() => engine.resume()}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
          <polygon points="5,3 19,12 5,21"/>
        </svg>
        <span class="text-[#ffffff] font-semibold">Resume</span>
      </button>

      <button
        class="flex-1 bg-transparent hover:bg-[#121621] py-4 px-6 rounded-full flex items-center justify-center gap-2 cursor-pointer border border-[#7e889c] transition-colors"
        onclick={() => engine.stop()}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#e85c4f">
          <rect x="6" y="6" width="12" height="12" rx="2"/>
        </svg>
        <span class="text-[#e85c4f] font-semibold">Stop</span>
      </button>
    </div>
  </div>
</div>
