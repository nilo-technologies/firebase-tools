"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nock = require("nock");
const sinon = require("sinon");
const firedata_1 = require("./gcp/firedata");
const requireTosAcceptance_1 = require("./requireTosAcceptance");
const rc_1 = require("./rc");
const chai_1 = require("chai");
const auth = require("./auth");
const SAMPLE_OPTIONS = {
    cwd: "/",
    configPath: "/",
    config: {},
    only: "",
    except: "",
    nonInteractive: false,
    debug: false,
    force: false,
    filteredTargets: [],
    rc: new rc_1.RC(),
};
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
describe("requireTosAcceptance", () => {
    let loggedInStub;
    beforeEach(() => {
        nock.disableNetConnect();
        loggedInStub = sinon.stub(auth, "loggedIn");
    });
    afterEach(() => {
        nock.enableNetConnect();
        loggedInStub.restore();
    });
    it("should resolve for accepted terms of service", async () => {
        nock("https://mobilesdk-pa.googleapis.com")
            .get("/v1/accessmanagement/tos:getStatus")
            .reply(200, SAMPLE_RESPONSE);
        loggedInStub.returns(true);
        await (0, requireTosAcceptance_1.requireTosAcceptance)(firedata_1.APP_CHECK_TOS_ID)(SAMPLE_OPTIONS);
        (0, chai_1.expect)(nock.isDone()).to.be.true;
    });
    it("should throw error if not accepted", async () => {
        nock("https://mobilesdk-pa.googleapis.com")
            .get("/v1/accessmanagement/tos:getStatus")
            .reply(200, SAMPLE_RESPONSE);
        loggedInStub.returns(true);
        await (0, chai_1.expect)((0, requireTosAcceptance_1.requireTosAcceptance)(firedata_1.APPHOSTING_TOS_ID)(SAMPLE_OPTIONS)).to.be.rejectedWith("Terms of Service");
        (0, chai_1.expect)(nock.isDone()).to.be.true;
    });
    it("should resolve to if not a human", async () => {
        loggedInStub.returns(false);
        await (0, requireTosAcceptance_1.requireTosAcceptance)(firedata_1.APPHOSTING_TOS_ID)(SAMPLE_OPTIONS);
        (0, chai_1.expect)(nock.isDone()).to.be.true;
    });
});
//# sourceMappingURL=requireTosAcceptance.spec.js.map