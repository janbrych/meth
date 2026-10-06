const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('[CONSOLE]', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('[PAGE ERROR]', err));

  await page.goto('http://localhost:4173/');
  await page.waitForTimeout(500);

  const startBtnVisible = await page.isVisible('#btn-start-game');
  console.log('Start button visible:', startBtnVisible);

  await page.click('#btn-start-game');
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'screenshot_test.png' });

  const canvasBox = await page.evaluate(() => {
    const c = document.getElementById('gameCanvas');
    return {
      width: c.width,
      height: c.height,
      clientWidth: c.clientWidth,
      clientHeight: c.clientHeight,
      offsetWidth: c.offsetWidth,
      offsetHeight: c.offsetHeight
    };
  });
  console.log('Canvas dimensions:', canvasBox);

  await browser.close();
})();
