<script lang="ts">
  import type { Engine } from '$lib/engine';

  let { engine }: { engine: Engine } = $props();
</script>

<div class="bg-black/80 fixed inset-0 z-2 flex items-center justify-center">
  <div class="bg-[#0f121a] rounded-[24px] p-8 max-w-[800px] border border-[#a9b4cc] mx-4">
    <h1 class="text-[#ffffff] text-2xl font-semibold mb-6" style="line-height: 1.2;">
      This is an exercise that targets cognitive control, the brain's ability to regulate attention, impulses, and emotions.
    </h1>

    <p class="text-[#a9b4cc] text-base mb-8" style="line-height: 1.5;">
      Each time, a number (1-9) will be displayed or spoken out loud. Add that number to the one before it and say the sum (2-18). If the first number is 7 and the next is 3, you answer 10. If the number shown after 3 is 2, you answer 5.
    </p>

    <button
      onclick={() => engine.completeOnboarding()}
      class="bg-[#4f79e8] hover:opacity-75 text-[#0f121a] font-semibold py-3 px-8 rounded-full text-lg transition-opacity cursor-pointer"
    >
      Continue
    </button>
  </div>
</div>
