"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const sinon = require("sinon");
const configstore_1 = require("./configstore");
const ensureApiEnabled_1 = require("./ensureApiEnabled");
const FAKE_PROJECT_ID = "my_project";
const FAKE_API = "myapi.googleapis.com";
const FAKE_CACHE = {
    my_project: { "myapi.googleapis.com": true },
};
describe("ensureApiEnabled", () => {
    describe("check", () => {
        const sandbox = sinon.createSandbox();
        let configstoreGetMock;
        let configstoreSetMock;
        before(() => {
            nock.disableNetConnect();
        });
        after(() => {
            nock.enableNetConnect();
        });
        beforeEach(() => {
            configstoreGetMock = sandbox.stub(configstore_1.configstore, "get");
            configstoreSetMock = sandbox.stub(configstore_1.configstore, "set");
        });
        afterEach(() => {
            sandbox.restore();
        });
        for (const prefix of ["", "https://", "http://"]) {
            it("should call the API to check if it's enabled", async () => {
                configstoreGetMock.returns(undefined);
                configstoreSetMock.returns(undefined);
                nock("https://serviceusage.googleapis.com")
                    .get(`/v1/projects/${FAKE_PROJECT_ID}/services/${FAKE_API}`)
                    .matchHeader("x-goog-user-project", `${FAKE_PROJECT_ID}`)
                    .reply(200, { state: "ENABLED" });
                await (0, ensureApiEnabled_1.check)(FAKE_PROJECT_ID, prefix + FAKE_API, "", true);
                (0, chai_1.expect)(nock.isDone()).to.be.true;
                (0, chai_1.expect)(configstoreSetMock.calledWith(FAKE_PROJECT_ID, FAKE_API));
            });
            it("should return the value from the API", async () => {
                configstoreGetMock.returns(undefined);
                configstoreSetMock.returns(undefined);
                nock("https://serviceusage.googleapis.com")
                    .get(`/v1/projects/${FAKE_PROJECT_ID}/services/${FAKE_API}`)
                    .matchHeader("x-goog-user-project", `${FAKE_PROJECT_ID}`)
                    .once()
                    .reply(200, { state: "ENABLED" });
                await (0, chai_1.expect)((0, ensureApiEnabled_1.check)(FAKE_PROJECT_ID, prefix + FAKE_API, "", true)).to.eventually.be.true;
                nock("https://serviceusage.googleapis.com")
                    .get(`/v1/projects/${FAKE_PROJECT_ID}/services/${FAKE_API}`)
                    .matchHeader("x-goog-user-project", `${FAKE_PROJECT_ID}`)
                    .once()
                    .reply(200, { state: "DISABLED" });
                await (0, chai_1.expect)((0, ensureApiEnabled_1.check)(FAKE_PROJECT_ID, prefix + FAKE_API, "", true)).to.eventually.be.false;
            });
            it("should skip the API call if the enablement is saved in the cache", async () => {
                configstoreGetMock.returns(FAKE_CACHE);
                configstoreSetMock.returns(undefined);
                await (0, chai_1.expect)((0, ensureApiEnabled_1.check)(FAKE_PROJECT_ID, prefix + FAKE_API, "", true)).to.eventually.be.true;
            });
        }
    });
    describe("ensure", () => {
        const sandbox = sinon.createSandbox();
        let configstoreGetMock;
        let configstoreSetMock;
        const originalPollInterval = ensureApiEnabled_1.POLL_SETTINGS.pollInterval;
        const originalPollsBeforeRetry = ensureApiEnabled_1.POLL_SETTINGS.pollsBeforeRetry;
        beforeEach(() => {
            nock.disableNetConnect();
            ensureApiEnabled_1.POLL_SETTINGS.pollInterval = 0;
            ensureApiEnabled_1.POLL_SETTINGS.pollsBeforeRetry = 0;
            configstoreGetMock = sandbox.stub(configstore_1.configstore, "get");
            configstoreSetMock = sandbox.stub(configstore_1.configstore, "set");
        });
        afterEach(() => {
            nock.enableNetConnect();
            ensureApiEnabled_1.POLL_SETTINGS.pollInterval = originalPollInterval;
            ensureApiEnabled_1.POLL_SETTINGS.pollsBeforeRetry = originalPollsBeforeRetry;
            sandbox.restore();
        });
        for (const prefix of ["", "https://", "http://"]) {
            it("should verify that the API is enabled, and stop if it is", async () => {
                configstoreGetMock.returns(undefined);
                configstoreSetMock.returns(undefined);
                nock("https://serviceusage.googleapis.com")
                    .get(`/v1/projects/${FAKE_PROJECT_ID}/services/${FAKE_API}`)
                    .matchHeader("x-goog-user-project", `${FAKE_PROJECT_ID}`)
                    .once()
                    .reply(200, { state: "ENABLED" });
                await (0, chai_1.expect)((0, ensureApiEnabled_1.ensure)(FAKE_PROJECT_ID, prefix + FAKE_API, "", true)).to.not.be.rejected;
            });
            it("should verify that the API is enabled (in the cache), and stop if it is", async () => {
                configstoreGetMock.returns(FAKE_CACHE);
                configstoreSetMock.returns(undefined);
                await (0, chai_1.expect)((0, ensureApiEnabled_1.ensure)(FAKE_PROJECT_ID, prefix + FAKE_API, "", true)).to.not.be.rejected;
            });
            it("should attempt to enable the API if it is not enabled", async () => {
                configstoreGetMock.returns(undefined);
                configstoreSetMock.returns(undefined);
                nock("https://serviceusage.googleapis.com")
                    .get(`/v1/projects/${FAKE_PROJECT_ID}/services/${FAKE_API}`)
                    .matchHeader("x-goog-user-project", `${FAKE_PROJECT_ID}`)
                    .once()
                    .reply(200, { state: "DISABLED" });
                nock("https://serviceusage.googleapis.com")
                    .post(`/v1/projects/${FAKE_PROJECT_ID}/services/${FAKE_API}:enable`, (body) => !body)
                    .once()
                    .reply(200);
                nock("https://serviceusage.googleapis.com")
                    .get(`/v1/projects/${FAKE_PROJECT_ID}/services/${FAKE_API}`)
                    .matchHeader("x-goog-user-project", `${FAKE_PROJECT_ID}`)
                    .once()
                    .reply(200, { state: "ENABLED" });
                await (0, chai_1.expect)((0, ensureApiEnabled_1.ensure)(FAKE_PROJECT_ID, prefix + FAKE_API, "", true)).to.not.be.rejected;
                (0, chai_1.expect)(nock.isDone()).to.be.true;
                (0, chai_1.expect)(configstoreSetMock.calledWith(FAKE_PROJECT_ID, FAKE_API));
            });
            it("should retry enabling the API if it does not enable in time", async () => {
                configstoreGetMock.returns(undefined);
                configstoreSetMock.returns(undefined);
                nock("https://serviceusage.googleapis.com")
                    .get(`/v1/projects/${FAKE_PROJECT_ID}/services/${FAKE_API}`)
                    .matchHeader("x-goog-user-project", `${FAKE_PROJECT_ID}`)
                    .once()
                    .reply(200, { state: "DISABLED" });
                nock("https://serviceusage.googleapis.com")
                    .post(`/v1/projects/${FAKE_PROJECT_ID}/services/${FAKE_API}:enable`)
                    .matchHeader("x-goog-user-project", `${FAKE_PROJECT_ID}`)
                    .twice()
                    .reply(200);
                nock("https://serviceusage.googleapis.com")
                    .get(`/v1/projects/${FAKE_PROJECT_ID}/services/${FAKE_API}`)
                    .matchHeader("x-goog-user-project", `${FAKE_PROJECT_ID}`)
                    .once()
                    .reply(200, { state: "DISABLED" });
                nock("https://serviceusage.googleapis.com")
                    .get(`/v1/projects/${FAKE_PROJECT_ID}/services/${FAKE_API}`)
                    .matchHeader("x-goog-user-project", `${FAKE_PROJECT_ID}`)
                    .once()
                    .reply(200, { state: "ENABLED" });
                await (0, chai_1.expect)((0, ensureApiEnabled_1.ensure)(FAKE_PROJECT_ID, prefix + FAKE_API, "", true)).to.not.be.rejected;
                (0, chai_1.expect)(nock.isDone()).to.be.true;
            });
        }
    });
});
//# sourceMappingURL=ensureApiEnabled.spec.js.map