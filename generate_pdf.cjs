const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('file:///var/www/akuzem/public/default-presentation.html', { waitUntil: 'networkidle0' });
  await page.pdf({ path: '/var/www/akuzem/public/default.pdf', format: 'A4', landscape: true, printBackground: true });
  await browser.close();
})();
