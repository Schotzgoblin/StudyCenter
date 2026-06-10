/* eslint-disable */
const puppeteer = require('puppeteer');

(async () => {
  console.log("=== STARTING STUDYCENTER E2E PUPPETEER TEST SUITE ===");
  
  let browser;
  try {
    // Launch headless browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // 1. Audit browser console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`[Browser Console Error] ${msg.text()}`);
      }
    });

    page.on('pageerror', err => {
      console.error(`[Browser Page Exception] ${err.toString()}`);
      process.exit(1);
    });

    // 2. Navigate to Home Screen
    console.log("Testing Home Screen...");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Assert title contains StudyCenter
    const title = await page.title();
    console.log(`- Page Title: "${title}"`);
    if (!title.includes("StudyCenter")) {
      throw new Error("Page title does not match!");
    }

    // Verify course search and filter components exist
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (!searchInput) throw new Error("Search input not found on Home Page");
    console.log("✓ Search input exists.");

    // 3. Navigate to Subject Dashboard
    console.log("Testing Subject Dashboard...");
    await page.goto('http://localhost:3000/subject/hands-on-ai-ii', { waitUntil: 'networkidle0' });
    
    const subjectHeader = await page.waitForSelector('h1');
    const headerText = await page.evaluate(el => el.textContent, subjectHeader);
    console.log(`- Subject Header: "${headerText}"`);
    if (!headerText.includes("Hands-on AI II")) {
      throw new Error("Subject header text does not match!");
    }
    console.log("✓ Subject Dashboard loaded successfully.");

    // 4. Test Simulator Workspace (Training Mode)
    console.log("Testing Practice Simulator...");
    await page.goto('http://localhost:3000/subject/hands-on-ai-ii/simulator?mode=training', { waitUntil: 'networkidle0' });
    
    const questionTextEl = await page.waitForSelector('h2');
    const questionText = await page.evaluate(el => el.textContent, questionTextEl);
    console.log(`- Question text: "${questionText.substring(0, 60)}..."`);
    
    // Select first option
    const options = await page.$$('button[class*="border"]');
    if (options.length < 4) throw new Error("Failed to load options");
    console.log(`- Found ${options.length} options. Clicking option A...`);
    
    // Click option A
    await options[0].click();

    // Confirm answer button
    const confirmBtn = await page.waitForSelector('button:not([disabled])');
    const confirmText = await page.evaluate(el => el.textContent, confirmBtn);
    if (confirmText.includes("Confirm")) {
      console.log("- Clicking Confirm Answer...");
      await confirmBtn.click();
    }
    console.log("✓ Simulator interactive flow verified.");

    // 5. Test Ingestion Portal
    console.log("Testing Ingestion Portal...");
    await page.goto('http://localhost:3000/ingest', { waitUntil: 'networkidle0' });
    
    const dropzoneText = await page.evaluate(() => document.body.innerText);
    if (!dropzoneText.includes("Ingestion Portal") && !dropzoneText.includes("Drag and Drop")) {
      throw new Error("Ingestion Portal page failed to load text");
    }
    console.log("✓ Ingestion Portal page loaded successfully.");

    // 6. Test Moderator Panel
    console.log("Testing Moderator Panel...");
    await page.goto('http://localhost:3000/admin/moderation', { waitUntil: 'networkidle0' });
    
    const modText = await page.evaluate(() => document.body.innerText);
    if (!modText.includes("Moderator Control Panel")) {
      throw new Error("Moderator panel failed to load text");
    }
    console.log("✓ Moderator Control Panel loaded successfully.");

    // 7. Test Profile Page
    console.log("Testing Profile Page...");
    await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle0' });
    
    const profileText = await page.evaluate(() => document.body.innerText);
    if (!profileText.includes("Developer API Keys")) {
      throw new Error("Profile page failed to load BYOK panel");
    }
    console.log("✓ Profile Workspace loaded successfully.");

    // 8. Test Lobbies list
    console.log("Testing Lobbies Dashboard...");
    await page.goto('http://localhost:3000/lobbies', { waitUntil: 'networkidle0' });
    
    const lobbiesText = await page.evaluate(() => document.body.innerText);
    if (!lobbiesText.includes("Multiplayer Quiz Lobbies")) {
      throw new Error("Lobbies Dashboard failed to load text");
    }
    console.log("✓ Lobbies Dashboard loaded successfully.");

    console.log("=== ALL E2E PUPPETEER TESTS PASSED SUCCESSFULLY ===");
    process.exit(0);
  } catch (error) {
    console.error("E2E Test Failed with error:", error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
