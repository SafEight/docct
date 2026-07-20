import puppeteer from 'puppeteer';

const external = [];
const failures = [];
const responses = [];
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.hostname !== '127.0.0.1') {
      external.push(request.url());
      request.abort();
    } else {
      request.continue();
    }
  });
  page.on('requestfailed', (request) => failures.push(`${request.url()} :: ${request.failure()?.errorText}`));
  page.on('response', (response) => responses.push([response.status(), response.url()]));

  await page.goto('http://127.0.0.1:8765/', { waitUntil: 'networkidle0' });
  const title = await page.title();
  const start = await page.$('button');
  if (!start) throw new Error('No button found');
  const startButton = await page.$$('button');
  let clicked = false;
  for (const button of startButton) {
    const text = await button.evaluate((el) => el.textContent?.trim());
    if (text?.includes('Start session')) {
      await button.click();
      clicked = true;
      break;
    }
  }
  if (!clicked) throw new Error('Start session button not found');
  await new Promise((resolve) => setTimeout(resolve, 2500));

  const badLocal = responses.filter(([status]) => status >= 400);
  console.log(JSON.stringify({ title, external, failures, badLocal, localResponses: responses.length }, null, 2));
  if (external.length || failures.length || badLocal.length) process.exitCode = 1;
} finally {
  await browser.close();
}
