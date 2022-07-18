
(() : void =>{

    // Require our hcaptchaToken method
const { hcaptchaToken } = require("puppeteer-hcaptcha");

(async () => {
  // Create Start Time
  const startTime : number = Date.now();

  // Call hcaptchaToken method passing in your url
  let token = await hcaptchaToken("https://captcha.website/");

  // Get End Time
  const endTime : number = Date.now();

  // Log timed result to console
  console.log(`Completed in ${(endTime - startTime) / 1000} seconds`);

  // P0_eyJ0eXAiOiJ...
  console.log(token);
})();

})()
