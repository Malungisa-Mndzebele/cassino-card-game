const { chromium } = require('playwright');

(async () => {
  console.log('\n🧪 Simple Playwright Test\n');
  
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  
  console.log('📍 Navigating to: https://khasinogaming.com/cassino/');
  await page.goto('https://khasinogaming.com/cassino/', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  
  console.log(`📍 Final URL: ${page.url()}`);
  
  await page.waitForTimeout(2000);
  
  const title = await page.title();
  console.log(`📄 Title: "${title}"`);
  
  const heading = await page.locator('h1').first().textContent();
  console.log(`📄 First H1: "${heading}"`);
  
  const rootHTML = await page.locator('#root').innerHTML();
  console.log(`📦 Root content length: ${rootHTML.length} bytes`);
  
  if (title.includes('Cassino')) {
    console.log('\n✅ SUCCESS: Correct site loaded!');
  } else if (title.includes('Khasino Gaming')) {
    console.log('\n❌ FAIL: Wrong site (Khasino Gaming)');
  } else {
    console.log(`\n⚠️  UNKNOWN: Title is "${title}"`);
  }
  
  await browser.close();
})();
