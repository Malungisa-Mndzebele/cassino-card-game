const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('\n🌐 Navigating to https://khasinogaming.com/cassino/\n');
  
  const response = await page.goto('https://khasinogaming.com/cassino/', {
    waitUntil: 'networkidle'
  });
  
  console.log(`📍 Final URL: ${page.url()}`);
  console.log(`📄 Response status: ${response.status()}`);
  console.log(`📄 Response URL: ${response.url()}\n`);
  
  // Wait a bit for JS to execute
  await page.waitForTimeout(3000);
  
  const title = await page.title();
  console.log(`📄 Page title: "${title}"\n`);
  
  const html = await page.content();
  console.log(`📄 HTML size: ${html.length} bytes\n`);
  
  if (html.includes('Casino Card Game')) {
    console.log('✅ HTML contains "Casino Card Game"');
  } else {
    console.log('❌ HTML does NOT contain "Casino Card Game"');
  }
  
  if (html.includes('Khasino Gaming')) {
    console.log('❌ HTML contains "Khasino Gaming"');
  } else {
    console.log('✅ HTML does NOT contain "Khasino Gaming"');
  }
  
  // Check if root div has content
  const rootContent = await page.locator('#root').innerHTML();
  console.log(`\n📦 Root div content length: ${rootContent.length} bytes`);
  
  if (rootContent.length < 100) {
    console.log('⚠️  Root div is nearly empty - React might not be loading!');
  }
  
  await page.screenshot({ path: 'playwright-debug.png', fullPage: true });
  console.log('\n📸 Screenshot saved to playwright-debug.png');
  
  console.log('\n⏸️  Browser will stay open for 10 seconds for inspection...');
  await page.waitForTimeout(10000);
  
  await browser.close();
})();
