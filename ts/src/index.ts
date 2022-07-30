import { Browser, Page } from "puppeteer"

import * as fs from 'fs'
import  commandLineArgs from 'command-line-args'
import  puppeteer from 'puppeteer-extra'
import  StealthPlugin from 'puppeteer-extra-plugin-stealth'



import {
  Solve,
  CLickImages,
  GetImages,
  GetTarget,
  check_skip_or_verify,
} from "../utils/index.js";


puppeteer.use(StealthPlugin());

const extension = `${process.cwd()}\\..\\..\\privacy-pass.ext`;

( async ()=>{

    const optionDefinitions = [
        {name: "output", alias:"o", type: String}
    ]

    const options = commandLineArgs(optionDefinitions)
    const {output: path} = options

    const browser : Browser = await puppeteer.launch({
        headless: false,
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

  // Activating Dev Mode
  /*
    Just a utility in case we need dev mode on.
  */
  const chromeExtenstionsTab : Page = await browser.newPage();
  await chromeExtenstionsTab.goto("chrome://extensions");

  const devModeToggle = await chromeExtenstionsTab.evaluateHandle(
    'document.querySelector("body > extensions-manager").shadowRoot.querySelector("extensions-toolbar").shadowRoot.querySelector("#devMode")'
  ) as unknown as HTMLButtonElement;

  await devModeToggle.click();

  // Obtaining the extension ID part
  /*
    ISSUE
    When you goto "chrome://extensions", the privacy pass item is hard to scrape.
  */
  let extensionID : string | undefined | null

  extensionID = await chromeExtenstionsTab.evaluate(()=>{
    return document.querySelector("body > extensions-manager").shadowRoot.querySelector('#viewManager').querySelector('#items-list').shadowRoot.querySelector('div#container > div#content-wrapper > div.items-container > extensions-item').id
  }

  );

  const extensionTab : Page = await browser.newPage()
  await extensionTab.goto(`chrome-extension://${extensionID}/popup.html`)

  // Clear tokens if already existing (OPTIONAL)
  /*
    ISSUE : Cannot get a hold of the element to click on.
    If it will be a different run everytime then this doesn't matter.
  */
  /*const clearButton = await extensionTab.evaluate(()=>{
    return document.querySelector("#root > div > div.hTjWAPKKOGmumZ5O62y0WA\\=\\= > div:nth-child(2)")
  })
  clearButton.click()*/


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

  await page.waitForTimeout(15000);

  // Accessing the storage part 
  if(typeof extensionID !== 'undefined' && extensionID!==null){

    const tokens = await extensionTab.evaluate(() =>  Object.assign({}, window.localStorage.getItem('cf-tokens')));

    fs.writeFileSync(path, 'module.exports = \n'+Object.values(tokens).join(''))
    console.log('Wrote token to file.')
  }
     
  await browser.close()

})();
