import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1920,1080'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error' || msg.type() === 'warning')
    errors.push(`[${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', err => errors.push(`[pageerror] ${err.message}`));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise(r => setTimeout(r, 8000));
await page.screenshot({ path: '/tmp/shot_editor.png' });

// Dump scene tabs / timeline labels
const info = await page.evaluate(() => {
  const out = { texts: [], canvasCount: 0 };
  out.canvasCount = document.querySelectorAll('canvas').length;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const t = walker.currentNode.textContent.trim();
    if (t && !seen.has(t) && t.length < 60) {
      seen.add(t);
      out.texts.push(t);
    }
  }
  return out;
});
console.log('CANVASES:', info.canvasCount);
console.log('TEXTS:', JSON.stringify(info.texts.slice(0, 80), null, 1));
console.log('ERRORS:', JSON.stringify(errors.slice(0, 30), null, 1));
await browser.close();
