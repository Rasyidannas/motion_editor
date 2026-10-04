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

// Press play, wait ~9s real time so scene_2 timeline advances well past fade-ins
await page.keyboard.press('Space');
for (let i = 0; i < 3; i++) {
  await sleep(3000);
  await page.screenshot({
    path: `/tmp/shot_play_${i}.png`,
    clip: { x: 454, y: 10, width: 1464, height: 824 },
  });
  const t = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const txt = walker.currentNode.textContent.trim();
      if (/^\d\d:\d\d:\d\d/.test(txt)) return txt;
    }
    return 'time-not-found';
  });
  console.log(`shot ${i} time:`, t);
}
console.log('ERRORS:', JSON.stringify([...new Set(errors)].slice(0, 10)));
await browser.close();
