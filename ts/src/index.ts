const fs = require('fs');

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('random-useragent');

puppeteer.use(StealthPlugin());

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
        args: [
                `--disable-extensions-except=${extension}`, 
                `--load-extension=${extension}`,
                '--enable-automation'
  ]
    })

    const page = await browser.newPage()
    await page.goto('https://captcha.website')
    
  // Activating Dev Mode
  /*const [chromeExtenstionsTab] = await browser.pages();
  await chromeExtenstionsTab.goto("chrome://extensions");
  const devModeToggle = await chromeExtenstionsTab.evaluateHandle(
    'document.querySelector("body > extensions-manager").shadowRoot.querySelector("extensions-toolbar").shadowRoot.querySelector("#devMode")'
  );
  await devModeToggle.click();*/

  // The solving process goes here.
  await new Promise<void>((resolve, reject) : void=>{
    setTimeout(()=>{
      resolve()
    }, 120*1000)
  }) 

  // Trying to get a hold 
  await page.goto('chrome-extension://podnclopaidnlkcbgkpmjlomckhmgalc/popup.html')


  const localStorage = await page.evaluate(() =>  Object.assign({}, window.localStorage));
  const tokens = localStorage['cf-tokens']

  fs.writeFileSync(path, 'module.exports = \n'+JSON.stringify(tokens, null, 2))
    
    //await browser.close()

})();