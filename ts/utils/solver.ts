import axios, { AxiosResponse, ResponseType } from "axios"
import { ElementHandle, Frame, Page } from "puppeteer"
import { logger } from "./logger.js"
import { urlExtractor } from "./misc.js"

export class HCaptchaSolver {

    static apiURL: URL = new URL("https://solve.shimul.me/api/solve")

    API_KEY: string
    UID : string 
    page : Page
    checked: boolean
    verified: boolean
    private _frame: Frame | null
    siteURL: URL | null
    keyword: string | null

    constructor( _api_key: string, _uid: string, _page: Page){
        this.API_KEY = _api_key
        this.UID = _uid

        this.siteURL = null
        this.page = _page
        this._frame = null

        this.keyword = null

        this.checked = false
        this.verified = false

    }

    async _getKeyword() : Promise<string>{

        await this._frame.waitForSelector("h2");
        logger.log('info',"Keyword selector appeared.");

        await this.page.waitForTimeout(3000);

        const searchValue : string = await this._frame.$eval(
            ".prompt-text",
            (el : HTMLElement) => el.innerText,
        );

        let T : Array<string> = searchValue.split(" ")

        return T[T.length - 1];
    }

    async _getAssets () {

        let links: Array<URL> | {} = {};

        await this._frame.waitForSelector(".task-grid");
        logger.log('info', "Asset selector appeared.");

        let data = await this._frame.evaluate(async () => {
            let X: Array<HTMLElement> = Array.from(document.querySelectorAll(".image-wrapper .image") as unknown as HTMLCollectionOf<HTMLElement>);
            let Y = X.map((item: HTMLElement) => {
                return item.style.background;
            });
            return Y;
        });

        logger.log('info',`Image elements grabbed.`);
        logger.log('info',`Extracting links ...`);

        for (let i = 0; i < data.length; i++) {
            const link: URL = urlExtractor(data[i]);
            links[i] = link.href;
        }

        return links;
    }

    async _clickImages(_solution : Array<string>){
        await this._frame.waitForSelector(".task-grid");

        logger.log('info',"Assets available to solve.");
        for (const answer of _solution) {
            await this._frame.click(
                `body > div.challenge-container > div > div > div.task-grid > div:nth-child(${
                    answer + 1
                })`,
            )

            this._frame.waitForTimeout(1000);
            logger.log('info',`Clicked on asset #${answer + 1}.`);
        }
    }

    async _solveAssets(_imageLinks){

        let _keyword = this.keyword
        let _site = this.siteURL.href
        
        logger.log('info', `Solving assets through ${HCaptchaSolver.apiURL.href}`)
        logger.log('info', `UID: ${this.UID} | API_KEY: ${this.API_KEY}`)
        logger.log('info',`Keyword: ${_keyword} | Site: ${_site}`)

        // ISSUE
        /*
            Getting 400 BAD REQ on this call. Check what is wrong.
        */
        try {
            let response : AxiosResponse = await axios({
                method: "post",
                url: HCaptchaSolver.apiURL.href,
                headers: {
                    "Content-Type": "application/json",
                    uid: this.UID,
                    apikey: this.API_KEY,
                },
                data: {
                    images:_imageLinks,
                    target:_keyword,
                    data_type: "image",
                    site:_site,
                    site_key: "33f96e6a-38cd-421b-bb68-7806e1764460",
                },
            });

            const url = response.data.url;

            logger.log('info', url)
            response = await axios.get(url);
            return response.data;

        } catch (error) {
            logger.log('error', error);
            return error.data
        }
    }

    // Need to generalize this
    async _checkSkipORVerify(){
        await this._frame.evaluate(async () => {
            let X = await document
            .querySelector(
                "body > div.challenge-interface > div.button-submit.button > div"
            ) as HTMLElement
            X.click();
            
            if(!this.checked){
                this.checked = !this.checked
            } else {
                this.verified = !this.verified
            }

        });
    }

    async _openChallenge(){

        const captchaElement : ElementHandle = await this.page.waitForSelector(
            `#cf-hcaptcha-container > div:nth-child(2) > iframe`,
        );
        const captchaFrame : Frame = await captchaElement.contentFrame();
        await captchaFrame.waitForSelector("div #checkbox");
        logger.log('info',"Selected 'I am human' checkbox.");

        await captchaFrame.click("div #checkbox");
        logger.log('info',"Clicked checkbox.");

        await this.page.waitForTimeout(4000);
    }

    async _loadFrame(_selector: string){
        let frame = await this.page.waitForSelector(
            _selector
          );
          this._frame = await frame.contentFrame();
    }

    async _loadSiteURL(){
        this.siteURL = new URL(await this.page.evaluate(() => document.location.href))
        logger.log('info', `Site URL : ${this.siteURL.href}`)
    }
    async solve(){

        await this._loadSiteURL()
        await this._openChallenge()
        await this._loadFrame("body > div:nth-child(5) > div:nth-child(1) > iframe")
        
        this.keyword = await this._getKeyword()
        logger.log('info', `Captcha challenge keyword: ${this.keyword}.`)
        
        for(;!(this.checked && this.verified);){ 
            const assets : Object = await this._getAssets()
            logger.log('info', `Extracted ${Object.keys(assets).length}/9 assets from the challenge.`)
            const {solution} = await this._solveAssets(assets)
            logger.log('info', `Challenge answers are ${solution}.`)
            await this._clickImages(solution)
            await this._checkSkipORVerify
        }

    }
}