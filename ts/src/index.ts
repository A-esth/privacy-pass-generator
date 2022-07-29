import { ElementHandle, JSHandle } from "puppeteer";

const fs = require('fs');

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('random-useragent');

const dotenv = require('dotenv')

puppeteer.use(StealthPlugin());

const {
  Solve,
  CLickImages,
  GetImages,
  GetTarget,
  check_skip_or_verify,
} = require("../utils/utils");


const commandLineArgs = require('command-line-args');

const extension = `${process.cwd()}\\..\\..\\privacy-pass.ext`;

( async ()=>{

    const optionDefinitions = [
        {name: "output", alias:"o", type: String}
    ]

    const options = commandLineArgs(optionDefinitions)
    const {output: path} = options

    const browser = await puppeteer.launch({
        'headless': false,
        devtools: false,
        ignoreHTTPSErrors: true,
        userDataDir: `data`,
        args: [
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--no-sandbox",
                "--window-size=1000,900",
                "--start-maximized",
                "--disable-web-security",
                "--allow-running-insecure-content",
                "--disable-strict-mixed-content-checking",
                "--ignore-certificate-errors",
                "--disable-features=IsolateOrigins,site-per-process",
                "--blink-settings=imagesEnabled=true",
                `--disable-extensions-except=${extension}`, 
                `--load-extension=${extension}`,
                '--enable-automation'
  ]
    })
    console.log(browser)
   // const ID2 = "fippkiffcenldphbnipngjoadodngmeo"
    const ID = "fippkiffcenldphbnipngjoadodngmeo"
    const page = await browser.newPage()
    await page.goto('https://captcha.website')
    
     await page.waitForTimeout(10000);
    ///////////////
    const elementHandle = await page.waitForSelector(
    `#cf-hcaptcha-container > div:nth-child(2) > iframe`,
  );
  const capFrame = await elementHandle.contentFrame();
  await capFrame.waitForSelector("div #checkbox");
  console.log("[+] CapFrame Selecting checkbox");
  await capFrame.click("div #checkbox");
  console.log("[+] Clicked");
  await page.waitForTimeout(4000);
  ///////////////////
  let ifram2 = await page.waitForSelector(
    "body > div:nth-child(5) > div:nth-child(1) > iframe",
  );
  const capFrame2 = await ifram2.contentFrame();
  //////////////////
  var target = await GetTarget(capFrame2, page);
  console.log(`[+] This is the target ===> ${target}`);
  var Images = await GetImages(capFrame2);
  console.log(`[+] We got ===> ${Object.keys(Images).length} images`);

  var site = await page.evaluate(() => document.location.href);
  console.log(`[+] This is the SITE ===> ${site}`);
  const startSolving = await Solve(Images, target, site);
  console.log(`[+] Pictures Solved ===> ${startSolving.solution}`);
  await CLickImages(startSolving.solution, capFrame2);
  await check_skip_or_verify(capFrame2);
  const Img2 = await GetImages(capFrame2);
  const startSolving2 = await Solve(Img2, target, site);
  console.log(`[+] Pictures Solved ===> ${startSolving2.solution}`);
  await CLickImages(startSolving2.solution, capFrame2);
  await check_skip_or_verify(capFrame2);

  // Activating Dev Mode
  /*
    Just a utility in case we need dev mode on.
  */
  const chromeExtenstionsTab = await browser.newPage();
  await chromeExtenstionsTab.goto("chrome://extensions");
  const devModeToggle = await chromeExtenstionsTab.evaluateHandle(
    'document.querySelector("body > extensions-manager").shadowRoot.querySelector("extensions-toolbar").shadowRoot.querySelector("#devMode")'
  );
  console.log(devModeToggle)
  await devModeToggle.click();

  // Obtaining the extension ID part
  /*
    ISSUE
    When you goto "chrome://extensions", the privacy pass item is hard to scrape.
  */
  let extensionID : ElementHandle | undefined

  extensionID = await chromeExtenstionsTab.evaluate(()=>{
    return document.querySelector("body > extensions-manager").shadowRoot.querySelector('#viewManager').querySelector('#items-list').shadowRoot.querySelector('div#container > div#content-wrapper > div.items-container > extensions-item').id
  }

  );
  console.log(`${extensionID}`)
  
  await page.waitForTimeout(10000);

  // Accessing the storage part 
  if(extensionID!==undefined){
    await page.goto(`chrome-extension://${extensionID}/popup.html`)


    const localStorage = await page.evaluate(() =>  Object.assign({}, window.localStorage));
    const tokens = localStorage['cf-tokens']

    fs.writeFileSync(path, 'module.exports = \n'+JSON.stringify(tokens, null, 2))
  }
     
  await browser.close()

})();
