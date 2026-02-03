"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nock = require("nock");
const firedata_1 = require("./firedata");
const chai_1 = require("chai");
const SAMPLE_RESPONSE = {
    perServiceStatus: [
        {
            tosId: "APP_CHECK",
            serviceStatus: {
                tos: {
                    id: "app_check",
                    tosId: "APP_CHECK",
                },
                status: "ACCEPTED",
            },
        },
        {
            tosId: "APP_HOSTING_TOS",
            serviceStatus: {
                tos: {
                    id: "app_hosting",
                    tosId: "APP_HOSTING_TOS",
                },
                status: "TERMS_UPDATED",
            },
        },
    ],
};
describe("firedata", () => {
    before(() => {
        nock.disableNetConnect();
    });
    after(() => {
        nock.cleanAll();
        nock.enableNetConnect();
    });
    describe("getTosStatus", () => {
        it("should return parsed GetTosStatusResponse", async () => {
            nock("https://mobilesdk-pa.googleapis.com")
                .get("/v1/accessmanagement/tos:getStatus")
                .reply(200, SAMPLE_RESPONSE);
            await (0, chai_1.expect)((0, firedata_1.getTosStatus)()).to.eventually.deep.equal(SAMPLE_RESPONSE);
        });
    });
    describe("getAcceptanceStatus", () => {
        it("should return the status", () => {
            const res = SAMPLE_RESPONSE;
            (0, chai_1.expect)((0, firedata_1.getAcceptanceStatus)(res, firedata_1.APP_CHECK_TOS_ID)).to.equal("ACCEPTED");
            (0, chai_1.expect)((0, firedata_1.getAcceptanceStatus)(res, firedata_1.APPHOSTING_TOS_ID)).to.equal("TERMS_UPDATED");
        });
    });
    describe("isProductTosAccepted", () => {
        it("should determine whether tos is accepted", () => {
            const res = SAMPLE_RESPONSE;
            (0, chai_1.expect)((0, firedata_1.isProductTosAccepted)(res, firedata_1.APP_CHECK_TOS_ID)).to.equal(true);
            (0, chai_1.expect)((0, firedata_1.isProductTosAccepted)(res, firedata_1.APPHOSTING_TOS_ID)).to.equal(false);
        });
    });
});
//# sourceMappingURL=firedata.spec.js.map