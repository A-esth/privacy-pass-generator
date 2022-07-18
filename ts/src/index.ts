
(() : void =>{

    // Require our hcaptchaToken method
const { hcaptchaToken } = require("puppeteer-hcaptcha");

(async () => {
  // Create Start Time
  const startTime : number = Date.now();

  // Call hcaptchaToken method passing in your url
  let token = await hcaptchaToken("https://csgostats.gg/match/72424083/watch/4466869596d606538282d5c9eceffd96c2bc91da60adbdfe480791d3ce022a10");

  // Get End Time
  const endTime : number = Date.now();

  // Log timed result to console
  console.log(`Completed in ${(endTime - startTime) / 1000} seconds`);

  // P0_eyJ0eXAiOiJ...
  console.log(token);
})();

})()