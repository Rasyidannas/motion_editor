import puppeteer from 'puppeteer-core';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1920,1080', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text().slice(0, 200));
});
page.on('pageerror', err => errors.push('[pageerror] ' + err.message.slice(0, 200)));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 60000 });
await sleep(6000);

// Click the "scenes" grid icon in left rail to open scene list (3rd icon)
const railBtns = await page.$$('div[class*="rail"] button, aside button, nav button');
console.log('rail buttons:', railBtns.length);

// Find clickable element containing text scene_2 anywhere and click it
const clicked = await page.evaluate(() => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = null;
  while (walker.nextNode()) {
    if (walker.currentNode.textContent.trim() === 'scene_2') { node = walker.currentNode; break; }
  }
  if (!node) return 'scene_2 text not found';
  let el = node.parentElement;
  while (el && el !== document.body) {
    const r = el.getBoundingClientRect();
    if (r.width > 20 && r.height > 8) {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      el.click();
      return `clicked ${el.tagName}.${el.className} @${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`;
    }
    el = el.parentElement;
  }
  return 'no clickable parent';
});
console.log('click scene_2:', clicked);
await sleep(4000);
await page.screenshot({ path: '/tmp/shot_s2_selected.png' });

// Press play via Space key, wait, screenshot preview region
await page.keyboard.press('Space');
await sleep(7000);
await page.screenshot({ path: '/tmp/shot_s2_full.png' });
const preview = await page.$('canvas');
if (preview) {
  const box = await preview.boundingBox();
  console.log('canvas box:', JSON.stringify(box));
}
console.log('ERRORS:', JSON.stringify([...new Set(errors)].slice(0, 10), null, 1));
await browser.close();
