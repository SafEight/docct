const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  
  // Get computed styles for key elements
  const getPageStyles = async (url) => {
    const p = await browser.newPage();
    await p.setViewport({ width: 1280, height: 800 });
    await p.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    
    return await p.evaluate(() => {
      const results = {};
      
      // Body styles
      const body = document.body;
      const bs = getComputedStyle(body);
      results.body = { bg: bs.backgroundColor, font: bs.fontFamily, color: bs.color };
      
      // Fixed container
      const fixed = document.querySelector('.fixed');
      if (fixed) {
        const fs = getComputedStyle(fixed);
        results.fixedContainer = { 
          bg: fs.backgroundColor, 
          position: fs.position, 
          width: fs.width, 
          height: fs.height,
          classes: fixed.className 
        };
      }
      
      // All visible text elements and their computed styles
      const textEls = document.querySelectorAll('span, button, a, h1, h2, h3, p');
      results.textElements = [];
      textEls.forEach(el => {
        const s = getComputedStyle(el);
        if (el.textContent.trim() && el.offsetParent !== null) {
          results.textElements.push({
            tag: el.tagName,
            text: el.textContent.trim().substring(0, 50),
            color: s.color,
            bg: s.backgroundColor,
            font: s.fontFamily,
            size: s.fontSize,
            weight: s.fontWeight,
            classes: el.className?.substring?.(0, 100) || ''
          });
        }
      });
      
      // All buttons
      const buttons = document.querySelectorAll('button');
      results.buttons = [];
      buttons.forEach(el => {
        const s = getComputedStyle(el);
        if (el.offsetParent !== null) {
          results.buttons.push({
            text: el.textContent.trim().substring(0, 50),
            bg: s.backgroundColor,
            color: s.color,
            border: s.border,
            borderRadius: s.borderRadius,
            padding: s.padding,
            classes: el.className?.substring?.(0, 100) || ''
          });
        }
      });
      
      // Background colors of major containers
      const divs = document.querySelectorAll('div');
      results.containerBgs = [];
      divs.forEach(el => {
        const s = getComputedStyle(el);
        const bg = s.backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && el.offsetParent !== null) {
          results.containerBgs.push({
            bg,
            classes: el.className?.substring?.(0, 100) || '',
            tag: el.tagName
          });
        }
      });
      
      return results;
    });
  };
  
  console.log('=== OUR SITE ===');
  const ours = await getPageStyles('https://localhost/');
  console.log(JSON.stringify(ours, null, 2));
  
  console.log('\n\n=== ORIGINAL ===');
  const orig = await getPageStyles('https://docct.pages.dev/');
  console.log(JSON.stringify(orig, null, 2));
  
  await browser.close();
})();
