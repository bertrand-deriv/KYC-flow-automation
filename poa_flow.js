const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const mockVideoPath = path.join(__dirname, 'POA_mock.y4m');
const email = process.argv[2];
const password = process.argv[3];
const qa = process.argv[4];

async function runPoaVerificationFlow() {
  if (!email || !password || !qa) {
    console.error('\x1b[31m%s\x1b[0m', 'ERROR: Email, Passowrd and qabox(ie. qa40) arguments are required'); // Red text
    console.error('Usage: node poa_flow.js <email> <password> <qabox>');
    // This will exit immediately
    process.exit(1);
}
  if (!fs.existsSync(mockVideoPath)) {
    console.error('Error: Mock video file not found. Please place a mock_video.y4m file in the same directory as this script.');
    return;
  }

  // Launch Chromium with fake video capture
  const browser = await chromium.launch({
    args: [
      `--use-file-for-fake-video-capture=${mockVideoPath}`,
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream'
    ],
    headless: false // Set to true for headless operation
  });

  const context = await browser.newContext({
    permissions: ['camera', 'microphone']
  });

  const page = await context.newPage();

  // Set server endpoints
  await page.goto('https://staging-hub.deriv.com/Accounts/endpoint');
  await page.fill('input[id="Input_Server"]', `${qa}.deriv.dev`);
  await page.click('button:has-text("Submit")');
  
  // Login with test account
  await page.fill('input[name="email"]', `${email}`);
  await page.fill('input[name="password"]', `${password}`);
  await page.click('button:has-text("Log in")')
  
  // Navigate to POA page
  await page.waitForTimeout(3000);
  console.log('Starting identity verification flow...');
  await page.goto('https://staging-hub.deriv.com/Accounts/ProofOfAddress')
  await page.waitForSelector('span:text("Review address details")');
  try {
    
    // Step 1: Address Fill up page
    await page.waitForTimeout(2000);
    console.log('Deriv KYC flow starting...');
    await page.click('button:has-text("Next")');

    // Step 2: Choose document type
    await page.click('span:text("Official residence declaration or affidavit")');

    // Step 3: Click start verification
    await page.click('button:has-text("Start Proof Of Address Verification")');
        
    // Step 4: Proceed to Affidavit document front capture
    console.log('Capturing front of document...');
    
    await page.waitForTimeout(1000); // Wait for some time to simulate the camera focusing
    await page.click('button.camera-button');
    await page.click('button:has-text("Submit")');

    // Wait for in progress page
    await page.waitForSelector('span:text("Verification in progress")');
    
    console.log('POA Verification completed successfully!');
    
    // Optional: Take a screenshot of the success screen
    await page.screenshot({ path: 'poa-verification-success.png' });

  } catch (error) {
    console.error('An error occurred during verification flow:', error);
    await page.screenshot({ path: 'poa-verification-error.png' });
  } finally {
    await browser.close();
  }
}

runPoaVerificationFlow().catch(console.error);