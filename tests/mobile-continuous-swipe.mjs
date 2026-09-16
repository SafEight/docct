import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

const url = process.env.DOCCT_URL ?? 'http://127.0.0.1:4173';
const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.setItem('settings', JSON.stringify({
      timer: 60,
      useVoice: false,
      useKeypad: true,
      keypadLayout: 'classic',
      displayMode: 'standard',
      voicePack: 'rose',
      wrongSound: 'none',
      startingInterval: 1500,
      minimumInterval: 500,
      intervalMode: 'fixed',
      adaptationMode: 'responsive',
      adaptationStepMs: 100,
      onboardingCompleted: true,
      taskMode: '1-back',
    }));
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const start = Array.from(document.querySelectorAll('button'))
      .find((button) => button.textContent?.includes('Start session'));
    if (!start) throw new Error('Start session button not found');
    start.click();
  });
  await page.waitForSelector('[data-keypad-layout="classic"]');
  await page.$eval('[data-keypad-layout="classic"]', (keypad) =>
    keypad.scrollIntoView({ block: 'center', inline: 'center' }));

  const center = async (answer) => page.$eval(`[data-answer="${answer}"]`, (button) => {
    const rect = button.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });
  const isSelected = (answer) => page.$eval(`[data-answer="${answer}"]`, (button) =>
    button.classList.contains('bg-[#000000]'));
  const selectedAnswers = () => page.$$eval('[data-answer].bg\\-\\[\\#000000\\]', (buttons) =>
    buttons.map((button) => Number(button.dataset.answer)));

  const cdp = await page.createCDPSession();
  const two = await center(2);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ ...two, id: 1, radiusX: 1, radiusY: 1, force: 1 }],
  });
  assert.equal(await isSelected(2), true, 'touchstart should select answer 2');

  // The old 750 ms failsafe ended the gesture here, forcing another touch-down.
  await new Promise((resolve) => setTimeout(resolve, 900));
  const three = await center(3);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ ...three, id: 1, radiusX: 1, radiusY: 1, force: 1 }],
  });
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.equal(await isSelected(3), true, 'a held finger should still select after 750 ms');
  assert.deepEqual(await selectedAnswers(), [3], 'only the latest swiped answer should be selected');

  const generationBefore = await page.$eval('[aria-label^="Current digit"]', (node) => node.getAttribute('aria-label'));
  await page.waitForFunction((previous) => {
    const node = document.querySelector('[aria-label^="Current digit"]');
    return node && node.getAttribute('aria-label') !== previous;
  }, { timeout: 3000 }, generationBefore);
  assert.deepEqual(await selectedAnswers(), [], 'a new turn should clear the previous submitted answer');

  const four = await center(4);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ ...four, id: 1, radiusX: 1, radiusY: 1, force: 1 }],
  });
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.equal(await isSelected(4), true, 'the same uninterrupted touch should select in the next turn');
  assert.deepEqual(await selectedAnswers(), [4], 'the next turn should contain only the new swiped answer');

  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  console.log('PASS: continuous mobile swipe selects answers after a long hold and across turns');
} finally {
  await browser.close();
}
