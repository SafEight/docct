<script lang="ts">
  import type { Engine } from '$lib/engine';

  let { engine }: { engine: Engine } = $props();
</script>

<div class="fixed inset-0 z-20 overflow-y-auto bg-black/80 p-4 md:flex md:items-center md:justify-center md:p-6">
  <div class="flex min-h-full flex-col justify-center md:min-h-0 md:w-full md:max-w-[800px]">
    <div class="flex flex-col gap-6 rounded-[24px] bg-[#090a0d] p-5 sm:p-6 md:gap-8 md:p-8">
      <span class="text-2xl leading-[1.2] text-white sm:text-3xl md:text-4xl">
        This is an exercise that targets cognitive control, the brain's ability to regulate attention, impulses, and emotions.
      </span>

      <span class="text-2xl leading-[1.2] text-white sm:text-3xl md:text-4xl">
        Each time, a number (1-9) will be displayed or spoken out loud. Add that number to the one before it and say the sum (2-18). If the first number is 7 and the next is 3, you answer 10. If the number shown after 3 is 2, you answer 5.
      </span>

      <div class="flex justify-stretch md:justify-end">
        <button
          class="cursor-pointer flex w-full items-center justify-center gap-6 rounded-full border bg-[#4f79e8] px-8 py-3 hover:opacity-75 md:w-auto"
          onclick={() => engine.completeOnboarding()}
        >
          <span class="text-[#0f121a] font-semibold">Continue</span>
        </button>
      </div>
    </div>
  </div>
</div>
