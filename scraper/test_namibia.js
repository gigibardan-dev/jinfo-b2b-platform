const { chromium } = require('playwright');

(async () => {
  console.log('Testez Namibia...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://www.jinfotours.ro/circuite/detalii/namibia', { 
    waitUntil: 'networkidle', 
    timeout: 60000 
  });
  
  // Verifică tab oferte
  const hasOfferTab = await page.evaluate(() => !!document.querySelector('a[href="#offer"]'));
  console.log('Are tab oferte:', hasOfferTab);
  
  if (hasOfferTab) {
    await page.click('a[href="#offer"]');
    await page.waitForTimeout(3000);
  }
  
  const rows = await page.$$('.service-cell-row');
  console.log('Rânduri prețuri găsite:', rows.length);
  
  // Verifică și slug-ul real
  const url = page.url();
  console.log('URL accesat:', url);
  
  // Verifică titlul paginii
  const title = await page.$eval('h1', el => el.textContent.trim()).catch(() => 'N/A');
  console.log('Titlu pagină:', title);
  
  await browser.close();
})();