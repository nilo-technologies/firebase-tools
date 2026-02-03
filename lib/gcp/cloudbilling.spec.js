"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const cloudbilling = require("./cloudbilling");
const api_1 = require("../api");
const PROJECT_ID = "test-project";
describe("cloudbilling", () => {
    afterEach(() => {
        nock.cleanAll();
    });
    describe("checkBillingEnabled", () => {
        it("should resolve with true if billing is enabled", async () => {
            nock((0, api_1.cloudbillingOrigin)())
                .get(`/v1/projects/${PROJECT_ID}/billingInfo`)
                .reply(200, { billingEnabled: true });
            const result = await cloudbilling.checkBillingEnabled(PROJECT_ID);
            (0, chai_1.expect)(result).to.be.true;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve with false if billing is not enabled", async () => {
            nock((0, api_1.cloudbillingOrigin)())
                .get(`/v1/projects/${PROJECT_ID}/billingInfo`)
                .reply(200, { billingEnabled: false });
            const result = await cloudbilling.checkBillingEnabled(PROJECT_ID);
            (0, chai_1.expect)(result).to.be.false;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should reject if the API call fails", async () => {
            nock((0, api_1.cloudbillingOrigin)())
                .get(`/v1/projects/${PROJECT_ID}/billingInfo`)
                .reply(404, { error: { message: "Not Found" } });
            await (0, chai_1.expect)(cloudbilling.checkBillingEnabled(PROJECT_ID)).to.be.rejectedWith("Not Found");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("isBillingEnabled", () => {
        it("should return the cached value if it exists", async () => {
            const setup = {
                isBillingEnabled: true,
                config: {},
                rcfile: { projects: {}, targets: {}, etags: {} },
                instructions: [],
            };
            const result = await cloudbilling.isBillingEnabled(setup);
            (0, chai_1.expect)(result).to.be.true;
        });
        it("should return false if projectId is not set", async () => {
            const setup = {
                config: {},
                rcfile: { projects: {}, targets: {}, etags: {} },
                instructions: [],
            };
            const result = await cloudbilling.isBillingEnabled(setup);
            (0, chai_1.expect)(result).to.be.false;
        });
        it("should call checkBillingEnabled if cache is empty", async () => {
            const setup = {
                projectId: PROJECT_ID,
                config: {},
                rcfile: { projects: {}, targets: {}, etags: {} },
                instructions: [],
            };
            nock((0, api_1.cloudbillingOrigin)())
                .get(`/v1/projects/${PROJECT_ID}/billingInfo`)
                .reply(200, { billingEnabled: true });
            const result = await cloudbilling.isBillingEnabled(setup);
            (0, chai_1.expect)(result).to.be.true;
            (0, chai_1.expect)(setup.isBillingEnabled).to.be.true;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("setBillingAccount", () => {
        const billingAccountName = "billingAccounts/test-billing-account";
        it("should resolve with true on success", async () => {
            nock((0, api_1.cloudbillingOrigin)())
                .put(`/v1/projects/${PROJECT_ID}/billingInfo`, {
                billingAccountName: billingAccountName,
            })
                .reply(200, { billingEnabled: true });
            const result = await cloudbilling.setBillingAccount(PROJECT_ID, billingAccountName);
            (0, chai_1.expect)(result).to.be.true;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should reject if the API call fails", async () => {
            nock((0, api_1.cloudbillingOrigin)())
                .put(`/v1/projects/${PROJECT_ID}/billingInfo`, {
                billingAccountName: billingAccountName,
            })
                .reply(403, { error: { message: "Permission Denied" } });
            await (0, chai_1.expect)(cloudbilling.setBillingAccount(PROJECT_ID, billingAccountName)).to.be.rejectedWith("Permission Denied");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("listBillingAccounts", () => {
        const billingAccount = {
            name: "billingAccounts/test-billing-account",
            open: "true",
            displayName: "Test Billing Account",
            masterBillingAccount: "",
        };
        it("should resolve with a list of billing accounts on success", async () => {
            nock((0, api_1.cloudbillingOrigin)())
                .get("/v1/billingAccounts")
                .reply(200, { billingAccounts: [billingAccount] });
            const result = await cloudbilling.listBillingAccounts();
            (0, chai_1.expect)(result).to.deep.equal([billingAccount]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve with an empty list if no billing accounts are returned", async () => {
            nock((0, api_1.cloudbillingOrigin)()).get("/v1/billingAccounts").reply(200, {});
            const result = await cloudbilling.listBillingAccounts();
            (0, chai_1.expect)(result).to.deep.equal([]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should reject if the API call fails", async () => {
            nock((0, api_1.cloudbillingOrigin)())
                .get("/v1/billingAccounts")
                .reply(404, { error: { message: "Not Found" } });
            await (0, chai_1.expect)(cloudbilling.listBillingAccounts()).to.be.rejectedWith("Not Found");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
});
//# sourceMappingURL=cloudbilling.spec.js.map