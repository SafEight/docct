/**
 * Final parity comparison: original vs clone at every game state.
 */
import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';

const ORIG = 'http://localhost:3000';
const CLONE = 'http://localhost:3001';
const OUT = '/tmp/parity';
mkdirSync(OUT, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getPageText(page) {
  return page.evaluate(() => document.body.innerText);
}

async function getPageHTML(page) {
  return page.evaluate(() => document.body.innerHTML);
}

async function getInteractiveElements(page) {
  return page.evaluate(() => {
    const els = [];
    // Buttons
    document.querySelectorAll('button').forEach(b => {
      els.push({ type: 'button', text: b.textContent?.trim(), classes: b.className });
    });
    // Inputs
    document.querySelectorAll('input').forEach(i => {
      els.push({ type: 'input', inputType: i.type, value: i.value, placeholder: i.placeholder, classes: i.className });
    });
    // Links
    document.querySelectorAll('a').forEach(a => {
      els.push({ type: 'link', text: a.textContent?.trim(), href: a.href });
    });
    return els;
  });
}

async function getClassList(page) {
  return page.evaluate(() => {
    const all = new Set();
    document.querySelectorAll('*').forEach(el => {
      el.classList.forEach(c => all.add(c));
    });
    return [...all].sort();
  });
}

async function getElementCount(page) {
  return page.evaluate(() => document.querySelectorAll('*').length);
}

async function getColorScheme(page) {
  return page.evaluate(() => {
    const colors = new Map();
    document.querySelectorAll('*').forEach(el => {
      const s = getComputedStyle(el);
      if (s.color && s.color !== 'rgb(0, 0, 0)') colors.set(s.color, (colors.get(s.color) || 0) + 1);
      if (s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'rgb(0, 0, 0)') {
        colors.set(s.backgroundColor, (colors.get(s.backgroundColor) || 0) + 1);
      }
    });
    return [...colors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  });
}

async function visualDiff(img1, img2, label) {
  const diffPath = `${OUT}/diff-${label}.png`;
  try {
    execSync(`python3 -c "
from PIL import Image, ImageChops, ImageEnhance
import sys
a = Image.open('${img1}')
b = Image.open('${img2}')
# Resize to match
if a.size != b.size:
    b = b.resize(a.size)
diff = ImageChops.difference(a, b)
enhancer = ImageEnhance.Brightness(diff)
diff = enhancer.enhance(20)
diff.save('${diffPath}')
# Calculate difference percentage
import numpy as np
arr = np.array(diff)
non_zero = np.count_nonzero(arr)
total = arr.size
pct = (non_zero / total) * 100
print(f'{pct:.2f}')
" 2>&1`, { encoding: 'utf-8' });
  } catch (e) {
    return 'error';
  }
}

async function setupGame(page, overrides = {}) {
  await page.goto(ORIG);
  const settings = {
    timer: 600, useVoice: false, useKeypad: false,
    voicePack: 'rose', beepOnIncorrect: false,
    startingInterval: 3000, minimumInterval: 500,
    onboardingCompleted: true, taskMode: '1-back',
    ...overrides,
  };
  await page.evaluate((s) => {
    localStorage.setItem('settings', JSON.stringify(s));
    localStorage.setItem('onboardingCompleted', 'true');
  }, settings);
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(2000);
}

async function clickButton(page, textMatch) {
  return page.evaluate((match) => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.textContent?.toLowerCase().includes(match.toLowerCase())) {
        b.click();
        return true;
      }
    }
    return false;
  }, textMatch);
}

async function compare(label, origPage, clonePage) {
  console.log(`\n═══ ${label} ═══`);

  const [oText, cText] = await Promise.all([getPageText(origPage), getPageText(clonePage)]);
  const [oElems, cElems] = await Promise.all([getInteractiveElements(origPage), getInteractiveElements(clonePage)]);
  const [oClasses, cClasses] = await Promise.all([getClassList(origPage), getClassList(clonePage)]);
  const [oCount, cCount] = await Promise.all([getElementCount(origPage), getElementCount(clonePage)]);
  const [oColors, cColors] = await Promise.all([getColorScheme(origPage), getColorScheme(clonePage)]);

  // Screenshot both
  const origShot = `${OUT}/orig-${label}.png`;
  const cloneShot = `${OUT}/clone-${label}.png`;
  await origPage.screenshot({ path: origShot, fullPage: true });
  await clonePage.screenshot({ path: cloneShot, fullPage: true });

  // Visual diff
  const diffPct = await visualDiff(origShot, cloneShot, label);

  // Text comparison
  const oLines = oText.split('\n').map(l => l.trim()).filter(Boolean);
  const cLines = cText.split('\n').map(l => l.trim()).filter(Boolean);
  const textMatch = JSON.stringify(oLines) === JSON.stringify(cLines);

  // Element count
  const countMatch = oCount === cCount;

  // Interactive elements
  const oBtnTexts = oElems.filter(e => e.type === 'button').map(e => e.text);
  const cBtnTexts = cElems.filter(e => e.type === 'button').map(e => e.text);
  const btnMatch = JSON.stringify(oBtnTexts) === JSON.stringify(cBtnTexts);

  // CSS class overlap
  const common = oClasses.filter(c => cClasses.includes(c));
  const oOnly = oClasses.filter(c => !cClasses.includes(c));
  const cOnly = cClasses.filter(c => !oClasses.includes(c));
  const classSimilarity = common.length / Math.max(oClasses.length, cClasses.length) * 100;

  // Color scheme
  const oTopColors = oColors.slice(0, 8).map(([c]) => c);
  const cTopColors = cColors.slice(0, 8).map(([c]) => c);
  const colorMatch = JSON.stringify(oTopColors) === JSON.stringify(cTopColors);

  console.log(`  Text match:     ${textMatch ? '✅ IDENTICAL' : `❌ DIFFERENT (${oLines.length} vs ${cLines.length} lines)`}`);
  if (!textMatch) {
    // Show differences
    const maxLen = Math.max(oLines.length, cLines.length);
    for (let i = 0; i < maxLen && i < 30; i++) {
      if (oLines[i] !== cLines[i]) {
        console.log(`    L${i}: orig="${oLines[i]}" clone="${cLines[i]}"`);
      }
    }
  }
  console.log(`  Element count:  ${countMatch ? '✅' : '❌'} ${oCount} vs ${cCount}`);
  console.log(`  Buttons:        ${btnMatch ? '✅ IDENTICAL' : '❌ DIFFERENT'}`);
  if (!btnMatch) {
    console.log(`    orig: ${oBtnTexts.join(', ')}`);
    console.log(`    clone: ${cBtnTexts.join(', ')}`);
  }
  console.log(`  CSS classes:    ${classSimilarity.toFixed(0)}% overlap (${common.length} common, ${oOnly.length} orig-only, ${cOnly.length} clone-only)`);
  if (oOnly.length > 0 && oOnly.length <= 10) console.log(`    orig-only: ${oOnly.join(', ')}`);
  if (cOnly.length > 0 && cOnly.length <= 10) console.log(`    clone-only: ${cOnly.join(', ')}`);
  console.log(`  Top colors:     ${colorMatch ? '✅ IDENTICAL' : '❌ DIFFERENT'}`);
  console.log(`  Visual diff:    ${diffPct}% pixel difference`);
  console.log(`  Screenshots:    ${origShot} / ${cloneShot}`);

  return { textMatch, countMatch, btnMatch, classSimilarity, colorMatch, diffPct };
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const allResults = {};

  // ══════════════════════════════════════════════════════════════════════
  // STATE 1: Setup screen
  // ══════════════════════════════════════════════════════════════════════
  {
    const op = await browser.newPage();
    const cp = await browser.newPage();
    await op.setViewport({ width: 1280, height: 800 });
    await cp.setViewport({ width: 1280, height: 800 });
    await setupGame(op);
    await setupGame(cp, {}); // same settings for clone
    await sleep(1000);
    allResults.setup = await compare('setup', op, cp);
    await op.close();
    await cp.close();
  }

  // ══════════════════════════════════════════════════════════════════════
  // STATE 2: Active gameplay (wait for a few digits)
  // ══════════════════════════════════════════════════════════════════════
  {
    const op = await browser.newPage();
    const cp = await browser.newPage();
    await op.setViewport({ width: 1280, height: 800 });
    await cp.setViewport({ width: 1280, height: 800 });
    await setupGame(op, { startingInterval: 3000 });
    await setupGame(cp, { startingInterval: 3000 });
    await clickButton(op, 'start session');
    await clickButton(cp, 'start session');
    await sleep(3000); // wait for first digit
    allResults.active = await compare('active', op, cp);
    await op.close();
    await cp.close();
  }

  // ══════════════════════════════════════════════════════════════════════
  // STATE 3: Session complete
  // ══════════════════════════════════════════════════════════════════════
  {
    const op = await browser.newPage();
    const cp = await browser.newPage();
    await op.setViewport({ width: 1280, height: 800 });
    await cp.setViewport({ width: 1280, height: 800 });
    await setupGame(op, { timer: 3, startingInterval: 5000 });
    await setupGame(cp, { timer: 3, startingInterval: 5000 });
    await clickButton(op, 'start session');
    await clickButton(cp, 'start session');
    await sleep(6000); // wait for completion
    allResults.complete = await compare('complete', op, cp);
    await op.close();
    await cp.close();
  }

  // ══════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('FINAL PARITY REPORT');
  console.log('═══════════════════════════════════════════════════════════════');
  
  let totalChecks = 0;
  let passedChecks = 0;
  
  for (const [state, r] of Object.entries(allResults)) {
    console.log(`\n  ${state.toUpperCase()}:`);
    const checks = [
      ['Text content', r.textMatch],
      ['Element count', r.countMatch],
      ['Buttons', r.btnMatch],
      ['Colors', r.colorMatch],
    ];
    for (const [name, pass] of checks) {
      totalChecks++;
      if (pass) passedChecks++;
      console.log(`    ${pass ? '✅' : '❌'} ${name}`);
    }
    console.log(`    ${r.classSimilarity >= 90 ? '✅' : '⚠️'} CSS classes (${r.classSimilarity.toFixed(0)}% overlap)`);
    console.log(`    ${parseFloat(r.diffPct) < 5 ? '✅' : '⚠️'} Visual diff (${r.diffPct}%)`);
  }

  console.log(`\n  SCORE: ${passedChecks}/${totalChecks} structural checks passed`);
  
  await browser.close();
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
