"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const api_1 = require("./api");
const shortenUrl_1 = require("./shortenUrl");
describe("shortenUrl", () => {
    const TEST_LINK = "https://abc.def/";
    const MOCKED_LINK = "https://firebase.tools/l/TEST";
    function mockDynamicLinks(url, suffix = "UNGUESSABLE", code = 200) {
        nock((0, api_1.dynamicLinksOrigin)())
            .post(`/v1/shortLinks`, (body) => body.dynamicLinkInfo?.link === url && body.suffix?.option === suffix)
            .query({ key: (0, api_1.dynamicLinksKey)() })
            .reply(code, {
            shortLink: MOCKED_LINK,
            previewLink: `${MOCKED_LINK}?d=1`,
        });
    }
    it("should return a shortened url with an unguessable suffix by default", async () => {
        mockDynamicLinks(TEST_LINK);
        (0, chai_1.expect)(await (0, shortenUrl_1.shortenUrl)(TEST_LINK)).to.eq(MOCKED_LINK);
    });
    it("should request a short suffix URL if guessable is true", async () => {
        mockDynamicLinks(TEST_LINK, "SHORT");
        (0, chai_1.expect)(await (0, shortenUrl_1.shortenUrl)(TEST_LINK, true)).to.eq(MOCKED_LINK);
    });
    it("should return the original URL in case of an error", async () => {
        mockDynamicLinks(TEST_LINK, "UNGUESSABLE", 400);
        (0, chai_1.expect)(await (0, shortenUrl_1.shortenUrl)(TEST_LINK)).to.eq(TEST_LINK);
    });
});
//# sourceMappingURL=shortenUrl.spec.js.map