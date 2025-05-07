const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const mockVideoPath = path.join(__dirname, 'POI_vid.y4m');
const email = process.argv[2];
const password = process.argv[3];
const qa = process.argv[4];

async function runPoiVerificationFlow() {
  if (!email || !password || !qa) {
    console.error('\x1b[31m%s\x1b[0m', 'ERROR: Email, Passowrd and qabox(ie. qa40) arguments are required'); // Red text
    console.error('Usage: node poi_flow.js <email> <password> <qabox>');
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
  await page.click('button:has-text("Log in")');
  
  // Navigate to POI page
  await page.waitForTimeout(3000);
  console.log('Starting identity verification flow...');
  await page.goto('https://staging-hub.deriv.com/Accounts/ProofOfIdentity')
  await page.waitForSelector('span:text("Document issuing country")');
  try {
    
    // Step 1: Begin the verification process
    await page.waitForTimeout(2000);
    console.log('Deriv KYC flow starting...');
    await page.click('button:has-text("Next")');

    // Step 2: Edit personal details if necessary
    // await page.fill('input[id="b9-Input_FirstName"]', 'Joe');
    await page.click('button:has-text("Next")');

    // Step 3: Choose document type
    await page.click('span:text("National Identity Card")');

    // Step 4: Fill in the Document number and Expiration date
    await page.fill('input[id="b10-b6-b5-Input_DocumentNumber"]', '65597876455555');

    await page.fill('input[id="b10-b6-b5-b3-DateField"]', '30/11/2025');

    await page.click('button:has-text("Next")');

    // Step 5: Click start verification
    await page.click('button:has-text("Start Proof Of Identity Verification")');
        
    // Step 6: Take a selfie
    console.log('Taking selfie...');
    
    await page.waitForTimeout(2000); // Wait for some time to simulate the camera focusing
    await page.click('button.camera-button');
    await page.click('button:has-text("Submit")');
    
    // Step 7: Click continue button on popup
    await page.click('button:has-text("Continue")');
    
    // Step 8: Proceed to ID document front capture
    console.log('Capturing front of ID document...');

    await page.waitForTimeout(6000); // Wait for some time for video to reach ID front
    await page.click('button.camera-button');
    await page.click('button:has-text("Submit")');

    // Step 9: Click continue button on popup
    await page.click('button:has-text("Continue")');

    // Step 10: Proceed to ID document back capture
    console.log('Capturing back of ID document...');
    await page.waitForTimeout(9000); // Wait for some time for video to reach ID front
    await page.click('button.camera-button');
    await page.click('button:has-text("Submit")');

    // Wait for in progress page
    await page.waitForSelector('span:text("Verification in progress")');
    
    console.log('POI Verification flow completed successfully!');
    
    // Optional: Take a screenshot of the success screen
    await page.screenshot({ path: 'poi-verification-success.png' });

  } catch (error) {
    console.error('An error occurred during verification flow:', error);
    await page.screenshot({ path: 'poi-verification-error.png' });
  } finally {
    await browser.close();
  }
}

runPoiVerificationFlow().catch(console.error);