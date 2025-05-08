# kyc_flow_automation

Automates KYC (Know Your Customer) flows for Deriv’s staging environment using Playwright and a fake camera feed.  
Includes two scripts:
- **poi_flow.js** – Proof of Identity (POI) flow  
- **poa_flow.js** – Proof of Address (POA) flow  

## Prerequisites

- Node.js v14 or higher  
- npm (comes with Node.js)  
- A `.y4m` mock video file for each flow in the project root:
  - `POI_vid.y4m` for the POI script. Can get them from the KYC team
  - `POA_mock.y4m` for the POA script. Can get them from the KYC team 

## Installation

1. Clone or download this repository.  
2. From the project root, install dependencies:

   ```bash
   npm install
   ```
3. If its the first time working with Playwright, you need to install it as well:

   ```bash
   npx playwright install
   ```
## Usage

Both scripts require three command-line arguments in the following order:

1. **email** – Test account email  
2. **password** – Test account password  
3. **qabox** – QA server identifier (e.g. `qa40`)

### Proof of Identity Flow

```bash
node poi_flow.js <email> <password> <qabox>
```

- Launches Chromium (non-headless by default) with a fake camera using `POI_vid.y4m`.  
- Connects to `https://staging-hub.deriv.com/Accounts/endpoint`, sets the endpoint to `<qabox>.deriv.dev`, and logs in.  
- Walks through the identity verification steps:
  1. Click “Next” to begin
  2. Choose “National Identity Card”
  3. Enter document number and expiration date
  4. Start verification, take selfie, capture front/back of ID
- On success, saves a screenshot as `poi-verification-success.png`. On error, prints details and saves `poi-verification-error.png`.

### Proof of Address Flow

```bash
node poa_flow.js <email> <password> <qabox>
```

- Launches Chromium (non-headless by default) with a fake camera using `POA_mock.y4m`.  
- Connects to `https://staging-hub.deriv.com/Accounts/endpoint`, sets the endpoint to `<qabox>.deriv.dev`, and logs in.  
- Walks through the address verification steps:
  1. Click “Next” to proceed
  2. Choose “Official residence declaration or affidavit”
  3. Start verification and capture the document
- On success, saves a screenshot as `poa-verification-success.png`. On error, prints details and saves `poa-verification-error.png`.

## Configuration

- Both scripts launch Chromium with these flags:
  - `--use-file-for-fake-video-capture=…`
  - `--use-fake-device-for-media-stream`
  - `--use-fake-ui-for-media-stream`
- To run in headless mode, open each script and change `headless: false` to `headless: true`.

## Troubleshooting

- **Missing mock video**  
  If you see:
  ```
  Error: Mock video file not found. Please place a mock_video.y4m file in the same directory as this script.
  ```
  Ensure `POI_vid.y4m` or `POA_mock.y4m` exists in the project root.

- **Missing arguments**  
  If you see:
  ```
  ERROR: Email, Passowrd and qabox(ie. qa40) arguments are required
  Usage: node poi_flow.js <email> <password> <qabox>
  ```
  Provide all three arguments in order.
