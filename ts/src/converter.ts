import * as voprf from './voprf';
import Token from './token';
import axios from 'axios';
import * as qs from 'qs';

const ISSUE_HEADER_NAME = 'cf-chl-bypass';
const NUMBER_OF_REQUESTED_TOKENS = 30;
const ISSUANCE_BODY_PARAM_NAME = 'blinded-tokens';
const VERIFICATION_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAExf0AftemLr0YSz5odoj3eJv6SkOF
VcH7NNb2xwdEz6Pxm44tvovEl/E+si8hdIDVg1Ys+cbaWwP0jYJW3ygv+Q==
-----END PUBLIC KEY-----`;
const COMMITMENT_URL =
    'https://raw.githubusercontent.com/privacypass/ec-commitments/master/commitments-p256.json';


async function issue(
    url: string, 
    formData: { [key: string]: string[] | string },
)/*: Promise<Token[]>*/ {
    const tokens = Array.from(Array(NUMBER_OF_REQUESTED_TOKENS).keys()).map(() => new Token());
    const issuance = {
        type: 'Issue',
        contents: tokens.map((token) => token.getEncodedBlindedPoint()),
    };
    const param = btoa(JSON.stringify(issuance));

    const body = qs.stringify({
        ...formData,
        [ISSUANCE_BODY_PARAM_NAME]: param,
    });

    const headers = {
        'content-type': 'application/x-www-form-urlencoded',
        [ISSUE_HEADER_NAME]: '1',
    };

    const response = await axios.post<string, { data: string }>(url, body, {
        headers,
        responseType: 'text',
    });

    const { signatures } = qs.parse(response.data);
    if (signatures === undefined) {
        throw new Error('There is no signatures parameter in the issuance response.');
    }
    if (typeof signatures !== 'string') {
        throw new Error('The signatures parameter in the issuance response is not a string.');
    }

    interface SignaturesParam {
        sigs: string[];
        version: string;
        proof: string;
        prng: string;
    }

    const data: SignaturesParam = JSON.parse(atob(signatures));
    const returned = voprf.getCurvePoints(data.sigs);

    const commitment = await getCommitment(data.version);

    const result = voprf.verifyProof(
        data.proof,
        tokens.map((token) => token.toLegacy()),
        returned,
        commitment,
        data.prng,
    );
    if (!result) {
        throw new Error('DLEQ proof is invalid.');
    }

    tokens.forEach((token, index) => {
        token.setSignedPoint(returned.points[index as number]);
    });

    return tokens;
}

async function getCommitment(version: string): Promise<{ G: string; H: string }> {
        const keyPrefix = 'commitment-';
        

        interface Response {
            CF: { [version: string]: { H: string; expiry: string; sig: string } };
        }

        // Download the commitment
        const { data } = await axios.get<Response>(COMMITMENT_URL);
        const commitment = data.CF[version as string];
        if (commitment === undefined) {
            throw new Error(`No commitment for the version ${version} is found`);
        }

        // Check the expiry date.
        const expiry = new Date(commitment.expiry);
        if (Date.now() >= +expiry) {
            throw new Error(`Commitments expired in ${expiry.toString()}`);
        }

        // This will throw an error on a bad signature.
        voprf.verifyConfiguration(
            VERIFICATION_KEY,
            {
                H: commitment.H,
                expiry: commitment.expiry,
            },
            commitment.sig,
        );

        // Cache.
        const item = {
            G: voprf.sec1EncodeToBase64(voprf.getActiveECSettings().curve.G, false),
            H: commitment.H,
        };
        return item;
    }

(async()=>{

    const url = 'https://captcha.website/?__cf_chl_f_tk=q_KSQ4XQFksWzoK12P6MO.hZwn5M067qLGiA0HKIJtE-1658230831-0-gaNycGzNCWU'
    const data = {
    "captcha_answer": "fSDdXKXITsGO-14-72d32ec8b94c7385",
    "captcha_vc": "ae9b8248281f30103f457ac28d6396eb",
    "md": "j6vYts1RSGBF7on9UdWIqux6yvsqypCm0DirCcp3Mv4-1658230831-0-AXv9_9YXSW8Bid9nAlHrUX0r2En8lUccZS7Bm6YRL23Oe6S2AhDSuVRxeLKTu8Yj1sNvH9m8GVTKD6Kb0Wju8h9vP9OqkSoDDqYKLDjdk19YvoDeEKmbi7RBJDMkl7Yp5sTX1pMFxPvP6xaw_WPhGv2Zk7-y84EeQB-3hz7vgo9VjUQmEf5e1JtaHeympwKpHMgRX_eeP2FA0mEx9zlj3uHXmyhXz46H4vgESXGT8UW6fpd_6DobYcO5Q40JVLabj_A1fb6LkbpYWVXCyusKvhJZ8Yu2XeigvH-Y_5FLHRwcqmotZJXJBxq4Q8gA2ndjDoaDJEdGhG4z7yTliFw5t6K9xMNY6B9EfTlyz5pxtZVGC8GV1q26AMOZkFhXhEQjHAO6CTx_VxIUyKIog4FmAwSvm-EnGcVJujPAsEEzm_VUGv1n3NXnnxdutrMdXU24GVbQ2gfTBbtnAK1MxHj-YzWqxh_R9ufYQ0qrO9e-ILQjKujgbsnEEYYZldNXcnG7lu12sHupouYaZ5SUuG0Oh5mDfP6Qol-pD5yC2Zd0RSicGIlPaAo7tyqTQayQg6WoKM-eGcoeD9-hgiDXS0gdqC7k9l-BWmNjQZQBDt2IzldQgt8rAWHC31TuddIi4U_MuKFRoZpVk47j-oDaaZZ94tbyCDRZezW3HqAA58ndAjqp",
    "r": "62XcebBNazTyfS8GKHJgZjne_hyg46ZoZu_qbdcB1OM-1658230831-0-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",
    "vc": "f82bce81284562ae3b59449b587be77f"
}
    const tokens = await issue(url, data)
    console.log(tokens)

})()